import { useState } from 'react';
import { events, categories } from '@/data/events';
import EventCard from './EventCard';
import { format, parseISO } from 'date-fns';

interface ScheduleViewProps {
  onEventSelect: (eventId: string) => void;
  selectedEventId: string | null;
}

const ScheduleView = ({ onEventSelect, selectedEventId }: ScheduleViewProps) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredEvents = activeCategory === 'all' 
    ? events 
    : events.filter(e => e.category === activeCategory);

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="relative z-10 flex flex-col h-full">
      {/* Category Filter */}
      <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-gradient-accent text-accent-foreground shadow-glow'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {sortedDates.map((date) => (
          <div key={date} className="mb-6">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 mb-3 z-10">
              <h2 className="font-display text-xl text-accent">
                {format(parseISO(date), 'EEEE, MMMM d')}
              </h2>
            </div>
            
            <div className="space-y-3">
              {groupedEvents[date].map((event, index) => (
                <div
                  key={event.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <EventCard
                    event={event}
                    onClick={() => onEventSelect(event.id)}
                    isSelected={selectedEventId === event.id}
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

export default ScheduleView;
