import { useMemo, useState, useRef, useEffect, MutableRefObject } from 'react';
import { events } from '@/data/events';
import EventCard from './EventCard';
import { format, parseISO } from 'date-fns';
import { useEventFullDescription } from '@/hooks/useEventFullDescription';

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface ScheduleViewProps {
  onEventSelect: (eventId: string) => void;
  selectedEventId: string | null;
  isLiked: (eventId: string) => boolean;
  onToggleLike: (eventId: string) => void;
  scrollPosition: MutableRefObject<number>;
}

const ScheduleView = ({ onEventSelect, selectedEventId, isLiked, onToggleLike, scrollPosition }: ScheduleViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique dates from events
  const uniqueDates = [...new Set(events.map(e => e.date))].sort((a, b) => {
    if (a === 'all-week') return -1;
    if (b === 'all-week') return 1;
    return a.localeCompare(b);
  });

  const [activeDate, setActiveDate] = useState(uniqueDates[0] || 'all-week');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPosition.current;
    }
  }, []);

  // Save scroll position on unmount
  useEffect(() => {
    const container = scrollContainerRef.current;
    return () => {
      if (container) {
        scrollPosition.current = container.scrollTop;
      }
    };
  }, [scrollPosition]);

  // Scroll to top when active date changes (skip initial mount so returning to Schedule restores position)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    scrollPosition.current = 0;
  }, [activeDate, scrollPosition]);

  // Filter events by search query and date
  const filteredEvents = useMemo(() => {
    let filtered = events.filter((e) => e.date === activeDate);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = events.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeDate, searchQuery]);

  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((e) => e.id === selectedEventId) ?? null : null),
    [selectedEventId]
  );

  const { fullDescription, loading: fullDescriptionLoading } = useEventFullDescription(selectedEvent);

  const formatDateTab = (date: string) => {
    if (date === 'all-week') return 'All Week';
    try {
      return format(parseISO(date), 'EEE MMM d');
    } catch {
      return date;
    }
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="relative z-10 flex flex-col h-full">
      {/* Search Bar */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-muted/50 border-muted"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Day Filter - hide when searching */}
      {!isSearching && (
        <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {uniqueDates.map((date) => (
              <button
                key={date}
                onClick={() => setActiveDate(date)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeDate === date
                    ? 'bg-gradient-accent text-accent-foreground shadow-glow'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {formatDateTab(date)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Events List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 mb-3 z-10">
          <h2 className="font-display text-xl text-accent">
            {isSearching 
              ? `${filteredEvents.length} result${filteredEvents.length !== 1 ? 's' : ''} for "${searchQuery}"`
              : activeDate === 'all-week' 
                ? 'All Week Events' 
                : format(parseISO(activeDate), 'EEEE, MMMM d')}
          </h2>
        </div>
        
        <div className="space-y-3">
          {filteredEvents.map((event, index) => {
            const isSelected = selectedEventId === event.id;
            return (
              <div
                key={event.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <EventCard
                  event={event}
                  onClick={() => onEventSelect(event.id)}
                  isSelected={isSelected}
                  fullDescription={isSelected ? fullDescription ?? undefined : undefined}
                  isDescriptionLoading={isSelected ? fullDescriptionLoading : false}
                  isLiked={isLiked(event.id)}
                  onToggleLike={onToggleLike}
                />
              </div>
            );
          })}
          {filteredEvents.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No events found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;
