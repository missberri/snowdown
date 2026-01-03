import { useMemo, useState } from 'react';
import { events } from '@/data/events';
import EventCard from './EventCard';
import { format, parseISO } from 'date-fns';
import { useEventFullDescription } from '@/hooks/useEventFullDescription';

interface ScheduleViewProps {
  onEventSelect: (eventId: string) => void;
  selectedEventId: string | null;
  isLiked: (eventId: string) => boolean;
  onToggleLike: (eventId: string) => void;
}

const ScheduleView = ({ onEventSelect, selectedEventId, isLiked, onToggleLike }: ScheduleViewProps) => {
  // Get unique dates from events
  const uniqueDates = [...new Set(events.map(e => e.date))].sort((a, b) => {
    if (a === 'all-week') return -1;
    if (b === 'all-week') return 1;
    return a.localeCompare(b);
  });

  const [activeDate, setActiveDate] = useState(uniqueDates[0] || 'all-week');

  const filteredEvents = events.filter((e) => e.date === activeDate);

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

  return (
    <div className="relative z-10 flex flex-col h-full">
      {/* Day Filter */}
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

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 mb-3 z-10">
          <h2 className="font-display text-xl text-accent">
            {activeDate === 'all-week' ? 'All Week Events' : format(parseISO(activeDate), 'EEEE, MMMM d')}
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
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;
