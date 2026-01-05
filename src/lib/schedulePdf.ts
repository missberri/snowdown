import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// Vite-friendly worker URL
// eslint-disable-next-line import/no-unresolved
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// Vite asset URL
import schedulePdfUrl from '@/assets/snowdown-schedule.pdf?url';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

let scheduleTextPromise: Promise<string> | null = null;

const STORAGE_KEY = 'snowdown_schedule_text_v1';

const collapseWhitespace = (s: string) => s.replace(/\s+/g, ' ').trim();

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

export async function getEventFullDescription(params: {
  title: string;
  location: string;
}): Promise<string | null> {
  const text = await loadScheduleText();
  const upper = text.toUpperCase();

  const titleNeedle = params.title.toUpperCase();
  const locNeedle = params.location.toUpperCase();

  let idx = upper.indexOf(titleNeedle);
  while (idx !== -1) {
    const locIdx = upper.indexOf(locNeedle, idx);

    // Ensure the location is near the title (same event block)
    if (locIdx !== -1 && locIdx - idx < 500) {
      // Start right after the title (some events include the location inside the description)
      const start = idx + titleNeedle.length;

      const endCandidates: number[] = [
        upper.indexOf('EVENT COORDINATOR', start),
        upper.indexOf('ENTRY COST', start),
      ].filter((i) => i !== -1);

      // Some events have clear end markers inside the description itself.
      // If present, prefer truncating at that point (including punctuation).
      const allAgesIdx = upper.indexOf('ALL AGES WELCOME', start);
      if (allAgesIdx !== -1) {
        let endIdx = allAgesIdx + 'ALL AGES WELCOME'.length;
        const nextChar = upper[endIdx];
        if (nextChar === '!' || nextChar === '.') endIdx += 1;
        endCandidates.push(endIdx);
      }

      if (!endCandidates.length) return null;

      const end = Math.min(...endCandidates);
      const raw = text.slice(start, end);

      let cleaned = collapseWhitespace(raw);

      // If the extracted block begins with the location (common in the PDF), strip it.
      if (cleaned.toUpperCase().startsWith(locNeedle)) {
        cleaned = cleaned.slice(locNeedle.length).trim();
      }

      // Avoid returning fragments like ", the Silver Bullet awaits."
      cleaned = cleaned.replace(/^[,.;:–—\-\s]+/, '').trim();

      return cleaned || null;
    }

    idx = upper.indexOf(titleNeedle, idx + titleNeedle.length);
  }

  return null;
}
