import { useState } from 'react';
import { events } from '@/data/events';
import { MapPin, Navigation2 } from 'lucide-react';

interface MapViewProps {
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
}

const MapView = ({ selectedEventId, onEventSelect }: MapViewProps) => {
  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Get unique locations and dedupe events at same location
  const uniqueLocations = events.reduce((acc, event) => {
    const existing = acc.find(e => e.location === event.location);
    if (!existing) {
      acc.push(event);
    }
    return acc;
  }, [] as typeof events);

  // Distribute pins more evenly across the map area
  const mapLocations = uniqueLocations.map((event, index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    return {
      ...event,
      top: 15 + row * 20 + (col % 2) * 8,
      left: 12 + col * 22,
    };
  });

  return (
    <div className="relative z-10 flex flex-col h-full px-4 pb-24">
      {/* Map Header */}
      <div className="py-4">
        <h2 className="font-display text-2xl text-foreground mb-1">Event Map</h2>
        <p className="text-sm text-muted-foreground">
          Downtown Durango • Tap a pin for details
        </p>
      </div>

      {/* Interactive Map Area */}
      <div className="relative flex-1 min-h-[400px] rounded-xl overflow-hidden bg-gradient-card border border-border">
        {/* Mountain Background */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 300" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <path
              d="M0 300 L50 200 L100 250 L150 150 L200 220 L250 120 L300 180 L350 100 L400 160 L400 300 Z"
              fill="hsl(var(--pine))"
            />
            <path
              d="M0 300 L80 220 L130 260 L180 180 L230 240 L280 160 L330 200 L400 140 L400 300 Z"
              fill="hsl(var(--mountain))"
            />
          </svg>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Event Markers */}
        {mapLocations.map((location) => {
          const isSelected = selectedEventId === location.id;
          
          return (
              <button
                key={location.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEventSelect(location.id);
                }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer ${
                  isSelected ? 'z-30 scale-125' : 'z-10 hover:scale-110 hover:z-20'
                }`}
                style={{
                  top: `${location.top}%`,
                  left: `${location.left}%`,
                }}
              >
                <div className={`relative ${isSelected ? 'animate-pulse' : ''}`}>
                  <MapPin 
                    className={`w-8 h-8 drop-shadow-lg pointer-events-none ${
                      isSelected ? 'text-primary fill-primary/30' : 'text-accent fill-accent/30'
                    }`} 
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                  )}
                </div>
              </button>
          );
        })}

        {/* Compass */}
        <div className="absolute top-4 right-4 p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border">
          <Navigation2 className="w-5 h-5 text-accent" />
        </div>
      </div>

      {/* Selected Event Details */}
      {selectedEvent && (
        <div className="mt-4 glass-card rounded-xl p-4 animate-fade-in">
          <h3 className="font-display text-xl text-foreground mb-1">
            {selectedEvent.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {selectedEvent.description}
          </p>
          <div className="flex items-center gap-2 text-accent">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{selectedEvent.location}</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {selectedEvent.time} • {selectedEvent.date}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
