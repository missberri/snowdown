import { Calendar, Clock, MapPin, Trophy } from 'lucide-react';
import { Event } from '@/data/events';
import { format, parseISO } from 'date-fns';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  isSelected?: boolean;
}

const EventCard = ({ event, onClick, isSelected }: EventCardProps) => {
  const formattedDate = format(parseISO(event.date), 'EEE, MMM d');

  return (
    <button
      onClick={onClick}
      className={`w-full text-left glass-card rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-glow ${
        isSelected ? 'ring-2 ring-primary shadow-glow' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center">
          <Trophy className="w-6 h-6 text-accent-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-foreground mb-1 truncate">
            {event.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {event.description}
          </p>
          
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1 text-accent">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-1 text-secondary">
              <Clock className="w-3.5 h-3.5" />
              <span>{event.time}</span>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default EventCard;
