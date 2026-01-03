import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'snowdown-liked-events';

export const useLikedEvents = () => {
  const [likedEventIds, setLikedEventIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...likedEventIds]));
    } catch {
      // localStorage might be full or unavailable
    }
  }, [likedEventIds]);

  const toggleLike = useCallback((eventId: string) => {
    setLikedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  const isLiked = useCallback((eventId: string) => likedEventIds.has(eventId), [likedEventIds]);

  const likedCount = likedEventIds.size;

  return { likedEventIds, toggleLike, isLiked, likedCount };
};
