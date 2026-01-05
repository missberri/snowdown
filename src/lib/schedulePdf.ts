import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// Vite-friendly worker URL
// eslint-disable-next-line import/no-unresolved
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// Vite asset URL
import schedulePdfUrl from '@/assets/snowdown-schedule.pdf?url';
import { events } from '@/data/events';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

let scheduleTextPromise: Promise<string> | null = null;

// Bump to invalidate older cached PDF text after parser improvements
const STORAGE_KEY = 'snowdown_schedule_text_v2';

const collapseWhitespace = (s: string) => s.replace(/\s+/g, ' ').trim();

const decodeCommonEntities = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const EVENT_TITLE_NEEDLES = Array.from(new Set(events.map((e) => e.title.toUpperCase())))
  // Avoid false positives where a short title matches normal words inside a paragraph
  .filter((t) => t.length >= 12);

// Hand-corrected full descriptions (from the official PDF) for events where parsing is unreliable.
const MANUAL_FULL_DESCRIPTIONS: Record<string, string> = {
  'Search for the Silver Bullet':
    "Hosted by A & L Coors & Four Corners Broadcasting. Engage your inner Zebulon Pike or Mary Cronin! Hidden somewhere among the cliffs, canyons, mountains, and meadows of La Plata County, the Silver Bullet awaits. Starting Mon, Jan 26, daily clues will be released on RADIO 101.3 FM & KRSJ 100.5 FM. Be creative and innovative in solving these clues; there's only one Silver Bullet and no second place! Registration is not required. Find it first and win $250 cash, glory, and other fabulous prizes! All ages welcome. Must be 21+ to win.",
  'SNOWDOWN Theme Contest':
    "Submit Your Idea for SNOWDOWN 2028! Themes are chosen 2 years in advance. Submit ideas by 5 PM on Sun, Feb 1. Keep it family-friendly and unique. All ages welcome!",
  'SNOWDOWN T-Shirt Day':
    "Prepare to make history with the official 2026 SNOWDOWN merch! Purchase your very own themed adornments, posters, and buttons released only once a year! These limited-edition collectibles celebrate 150 years of Colorado statehood. Stop by Magpie's to load up your loot!",
  'Colorado Costume Dance Party':
    "Lace up your dancing boots and get ready to party, it's a hootenanny! Join us at the library for a Colorado Costume Dance Party-a fun, high-energy celebration just for little ones. Come dressed as your favorite Colorado critter, mountain explorer, skier, or hometown hero, and dance the day away to kid-friendly tunes! Ages 9 and under.",
  'The Fetch Quest: Colorado Then and Wow':
    "Colorado history meets SNOWDOWN mischief. In this paw-some Colorado-themed scavenger quest, you'll sniff out clues, dig up hidden history, and explore today's dog-friendly gems. Purchase a Scavenger Hunt Kit from Pet Haus, solve themed riddles to find participating businesses, collect stamps at each stop, and return completed sheets for prizes and raffle entry. The hunt runs through Sat, Jan 31. All proceeds donated to the La Plata County Humane Society. Prize categories include First to Finish, Most Creative Selfie, Least Number of Hints Used, Most Riddles Completed, and Best Social Media Post. All ages welcome!",
};

async function extractScheduleText(): Promise<string> {
  const loadingTask = getDocument(schedulePdfUrl);
  const pdf = await loadingTask.promise;

  let out = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // pdf.js text items are either TextItem or TextMarkedContent
    const pageText = (textContent.items as any[])
      .map((it) => (typeof it?.str === 'string' ? it.str : ''))
      .join(' ');

    out += `\n\n${pageText}`;
  }

  return collapseWhitespace(out);
}

export async function loadScheduleText(): Promise<string> {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  if (!scheduleTextPromise) {
    scheduleTextPromise = (async () => {
      const text = await extractScheduleText();
      try {
        localStorage.setItem(STORAGE_KEY, text);
      } catch {
        // ignore storage quota/private mode issues
      }
      return text;
    })();
  }

  return scheduleTextPromise;
}

function findNextEventTitleIndex(upper: string, start: number): number {
  let min = -1;
  for (const title of EVENT_TITLE_NEEDLES) {
    const i = upper.indexOf(title, start);
    if (i !== -1 && (min === -1 || i < min)) min = i;
  }
  return min;
}

export async function getEventFullDescription(params: {
  title: string;
  location: string;
}): Promise<string | null> {
  const manual = MANUAL_FULL_DESCRIPTIONS[params.title];
  if (manual) return manual;

  const text = await loadScheduleText();
  const upper = text.toUpperCase();

  const titleNeedle = params.title.toUpperCase();
  const locNeedle = params.location.toUpperCase();

  let idx = upper.indexOf(titleNeedle);
  while (idx !== -1) {
    const start = idx + titleNeedle.length;

    // Prefer matches where the location appears near the title, but don't require it.
    const locIdx = upper.indexOf(locNeedle, idx);
    const locationIsNear = locIdx !== -1 && locIdx - idx < 900;

    const endCandidates: number[] = [];

    // Best boundary: next event title
    const nextTitleIdx = findNextEventTitleIndex(upper, start + 5);
    // Only use this if it looks like a real "next event" boundary.
    if (nextTitleIdx !== -1 && nextTitleIdx - idx < 5000 && nextTitleIdx - start > 50) {
      endCandidates.push(nextTitleIdx);
    }

    // Fallback boundaries
    endCandidates.push(
      ...[
        upper.indexOf('EVENT COORDINATOR', start),
        upper.indexOf('ENTRY COST', start),
      ].filter((i) => i !== -1)
    );

    if (endCandidates.length) {
      const end = Math.min(...endCandidates);
      const raw = text.slice(start, end);

      let cleaned = decodeCommonEntities(collapseWhitespace(raw));

      // If the extracted block begins with the location (common in PDFs), strip it.
      if (cleaned.toUpperCase().startsWith(locNeedle)) {
        cleaned = cleaned.slice(locNeedle.length).trim();
      }

      // Remove leading separators/punctuation introduced by text extraction.
      cleaned = cleaned.replace(/^[,.;:–—\-\s]+/, '').trim();

      if (cleaned) return cleaned;
    }

    // If this occurrence didn't look right, try the next one.
    idx = upper.indexOf(titleNeedle, idx + titleNeedle.length);

    // If we found a location-near match and still couldn't extract, don't keep searching.
    if (locationIsNear) break;
  }

  return null;
}

