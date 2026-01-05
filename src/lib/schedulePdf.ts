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

// Disabled: PDF parsing was causing incorrect descriptions to bleed between events.
// The hardcoded descriptions in events.ts are now the source of truth.
export async function getEventFullDescription(_params: {
  title: string;
  location: string;
}): Promise<string | null> {
  return null;
}
