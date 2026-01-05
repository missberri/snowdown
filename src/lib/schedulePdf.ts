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
  "Bingo at the Bee's":
    "From gold rush fever to bingo fever; it's Bee-Ingo! Test your luck at the Bee's and see if fortune favors you like Colorado's pioneers. All ages welcome!",
  'Outhouse Stuffing':
    "Colorado may be loaded with open spaces, but not during SNOWDOWN outhouse stuffing! The team that pushes and squeezes the most people into the outhouse within 2 minutes, then keeps the door closed for 10 seconds, wins! Participants can sign up as a team or individually to create the largest stuffable team. The only rule is that waivers must be signed. Must be 21+.",
  'Crokinole Doubles Tournament':
    "See FRIDAY, Jan 23, 5 PM for details.",
  "Carver Brewing's Beer Dinner":
    "Better hop to it! What better way to celebrate SNOWDOWN 2026 than with a dinner of sesquicentennial-themed food and Carver's craft beer pairings! Purchase tickets in advance at CarverBrewing.com. Must be 21+.",
  'Scavenger Hunt':
    "The original SNOWDOWN Scavenger Hunt is back! This ain't our first rodeo, but it could be yours. Judging will take place on Fri, Jan 30 at 10 AM. Must be 21+.",
  'Joint Rolling Contest':
    "Colorado and weed go together like skis and snow. Now it's your turn to show off those rolling skills! The Joint Rolling contest (using a non-regulated hemp-based product) will consist of 3 categories: Biggest joint rolled, Fastest joint rolling, and Most stylish joint. Points awarded in each category to crown the SNOWDOWN Joint Rolling Champion. A $50 bar tab, $25 bar tab, and a free drink for 1st, 2nd, and 3rd place. Must be 21+.",
  'Pop Darts Tournament':
    "Join us at The ACT for our Pop Darts tournament! What are Pop Darts? Proof that Durango will make a SNOWDOWN event out of anything. Twelve teams of two compete for a chance to win one of three great prizes awarded to the top 3 teams. Must 21+.",
  'Pinball Tournament':
    "A bona fide pinball tournament sponsored by the International Pinball Flipper Association. Format will be 3 strikes, you're out! The winner? The one who survives the chaos with the most points and the least wrist cramps. Prizes for 1st, 2nd, 3rd, and Best Costume. All ages welcome!",
  'Rocky Mountain Mystics Living Tarot':
    "Spend an evening with the Rocky Mountain Mystics Living Tarot Troupe! Immerse yourself in an interactive performance where each card is brought to life. As with Tarot readings, each performance is different, as the cards pulled by audience members result in a unique, personal reading performed by our troupe of silly mediums. Must be 21+.",
  "Buckin' Mechanical Bullriding Contest":
    "We're bringing a Colorado rodeo tradition indoors with a riding contest more challenging than navigating Red Mountain pass during a blizzard. $250, $100, and $50 cash prizes for 1st, 2nd, and 3rd. Must be 18+.",
  'Mah Jongg Tournament':
    "Colorado might've already been on the map before American Mah Jongg hit the scene in the early 1900s, but recently, the popularity has soared! We'll follow the National Mah Jongg League (NMJL) rules, which use the NMJL card. Bring your 2025 NMJL card, but leave your quarters at home. We will track points and award cash prizes to the winners. Costumes encouraged. Please sign up by 5 PM on Tues, Jan 29. All ages welcome, but you must already know how to play American Mah Jongg.",
  'Name That Tune':
    "From John Denver to today's hits, test your music knowledge in this fast-paced guessing game! Contestants will be given clips of songs to listen to, then asked to identify both the song and the artist. Each correct answer earns one point. Highest point total wins! Sign up 15 minutes before the event starts. Must be 21+.",
  'Cocktails for Conservation':
    "Join us in celebrating 34 years of La Plata Open Space Conservancy at our annual SNOWDOWN fundraiser! Cocktails for Conservation is one of Snowdown's premier events and LPOSC's largest fundraiser. Each ticket include complimentary cocktails, wines, fine foods, local brews, silent auction, and a museum scavenger hunt with prizes! All proceeds from this popular event support LPOSC's work to conserve our cherished landscapes and natural resources. All proceeds support LPOSC's work to conserve our cherished landscapes and natural resources, protecting our unique way of life in Southwest Colorado—then and WOW! Ticket and sponsorship details found at www.lposc.org. Must be 21+.",
  'Connect 4':
    "What starts as a classic game of Connect 4 may turn into an outright Hootenanny. Let's hope, at least. Come one, come all! Must be 21+.",
  'Paint the Peaks & Colorado Trivia':
    "Raise a glass and your paintbrush! Come paint a scenic local mountain range, guided step by step by our instructor. Between brushstrokes, test your knowledge with fun Colorado trivia. No experience needed! Please reserve your spot online on Eventbrite. All ages welcome!",
  'Reel of Fortune':
    "It's Centennial State Theme Week here on the Reel of Fortune! Hosted by Ryan Seabass and Vanna Whitefish. Use your casting arm to spin the Reel (wheel) and solve puzzles unique to Colorful Colorado! 2 people per team with 3 rounds of puzzles and a Bonus Round. Register by Wed, Jan 28. All ages welcome!",
  "Booze N'Beacons":
    "A collision of libations and life-saving skills, incorporating teamwork, knowledge of the downtown bar scene, and skills with an avalanche beacon that will send teams out across Durango in a competition to out-track one another. The goals? Hone your beacon skills and socialize with others in an easy-going, booze-imbued, avalanche burial setting. Teams of 4 people. Sign up by Mon, Jan 26. Must be 21+.",
  'Red Ball Express':
    "Hosted by Rotary Clubs of La Plata County and Alpine Bank. Red Ball Express is a local fundraising event organized by the Rotary Clubs of La Plata County. This is the ultimate game of chance and your opportunity to be a \"high roller\" while supporting your community! You could win $5,000, $2,000, or $1,000 and help local non-profits. Here's your chance to make history and have a ball! Find more information at DurangoRedBall.com. Must be 18+.",
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

