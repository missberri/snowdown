import { useEffect, useMemo, useState } from 'react';
import type { Event } from '@/data/events';
import { getEventFullDescription } from '@/lib/schedulePdf';

const descriptionCache = new Map<string, string>();

export function useEventFullDescription(event: Event | null) {
  const cacheKey = useMemo(() => (event ? event.id : null), [event]);
  const [fullDescription, setFullDescription] = useState<string | null>(() => {
    if (!cacheKey) return null;
    return descriptionCache.get(cacheKey) ?? null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!event) {
        setFullDescription(null);
        setLoading(false);
        return;
      }

      const cached = descriptionCache.get(event.id);
      if (cached) {
        setFullDescription(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const desc = await getEventFullDescription({
          title: event.title,
          location: event.location,
        });

        if (cancelled) return;

        if (desc) {
          descriptionCache.set(event.id, desc);
          setFullDescription(desc);
        } else {
          setFullDescription(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [event]);

  return { fullDescription, loading };
}
