import { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { events, Event } from '@/data/events';
import { format, parseISO } from 'date-fns';
import EventCard from './EventCard';

interface MyEventsViewProps {
  likedEventIds: Set<string>;
  onToggleLike: (eventId: string) => void;
  onEventSelect: (eventId: string) => void;
  selectedEventId: string | null;
}

const MyEventsView = ({ 
  likedEventIds, 
  onToggleLike, 
  onEventSelect, 
  selectedEventId 
}: MyEventsViewProps) => {
  const likedEvents = useMemo(() => {
    return events.filter((event) => likedEventIds.has(event.id));
  }, [likedEventIds]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    
    likedEvents.forEach((event) => {
      const key = event.date === 'all-week' ? 'all-week' : event.date;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    });

    // Sort dates
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'all-week') return -1;
      if (b === 'all-week') return 1;
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => ({
      date: key,
      label: key === 'all-week' ? 'All Week' : format(parseISO(key), 'EEEE, MMMM d'),
      events: groups[key],
    }));
  }, [likedEvents]);

  if (likedEvents.length === 0) {
    return (
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 pb-24">
        <div className="glass-card rounded-xl p-8 text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-accent mb-4">
            <Heart className="w-8 h-8 text-accent-foreground" />
          </div>
          <h2 className="font-display text-xl text-foreground mb-2">
            No Events Yet
          </h2>
          <p className="text-sm text-muted-foreground">
            Tap the heart on any event to add it to your personal SNOWDOWN schedule!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 h-full overflow-y-auto px-4 pb-24">
      <div className="py-4">
        <h2 className="font-display text-2xl text-foreground mb-1">My Events</h2>
        <p className="text-sm text-muted-foreground">
          {likedEvents.length} event{likedEvents.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="space-y-6">
        {groupedEvents.map((group) => (
          <div key={group.date}>
            <h3 className="font-display text-lg text-accent mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
              {group.label}
            </h3>
            <div className="space-y-3">
              {group.events.map((event) => (
                <div key={event.id} className="relative">
                  <EventCard
                    event={event}
                    onClick={() => onEventSelect(event.id)}
                    isSelected={selectedEventId === event.id}
                    isLiked={true}
                    onToggleLike={onToggleLike}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyEventsView;
