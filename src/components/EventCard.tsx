import { Calendar, Clock, MapPin, Trophy, DollarSign, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Event } from '@/data/events';
import { format, parseISO } from 'date-fns';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  isSelected?: boolean;
  fullDescription?: string;
  isDescriptionLoading?: boolean;
}

const EventCard = ({
  event,
  onClick,
  isSelected,
  fullDescription,
  isDescriptionLoading,
}: EventCardProps) => {
  const isAllWeek = event.date === 'all-week';
  const formattedDate = isAllWeek ? 'All Week' : format(parseISO(event.date), 'EEE, MMM d');

  const description = isSelected ? (fullDescription ?? event.description) : event.description;

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
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg text-foreground mb-1">
              {event.title}
            </h3>
            {isSelected ? (
              <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          
          <p className={`text-sm text-muted-foreground mb-3 ${isSelected ? '' : 'line-clamp-2'}`}>
            {description}
          </p>

          {isSelected && isDescriptionLoading && (
            <p className="text-xs text-muted-foreground mb-3">Loading full description…</p>
          )}
          
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

          {/* Expanded details when selected */}
          {isSelected && (
            <div className="mt-4 pt-3 border-t border-border/50 space-y-2 animate-fade-in">
              {event.cost && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-accent" />
                  <span className="text-foreground">{event.cost}</span>
                </div>
              )}
              {event.ageRestriction && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-secondary" />
                  <span className="text-foreground">{event.ageRestriction}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default EventCard;
