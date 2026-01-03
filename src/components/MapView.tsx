import { useEffect, useRef, useState } from 'react';
import { events } from '@/data/events';
import { MapPin, X } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MapViewProps {
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
}

// Downtown Durango center coordinates
const DURANGO_CENTER: [number, number] = [-107.8801, 37.2753];

const MapView = ({ selectedEventId, onEventSelect }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState(() => 
    localStorage.getItem('mapbox_token') || ''
  );
  const [tokenInput, setTokenInput] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Get unique locations with their events
  const locationEvents = events.reduce((acc, event) => {
    const key = `${event.coordinates.lat}-${event.coordinates.lng}`;
    if (!acc[key]) {
      acc[key] = {
        coordinates: event.coordinates,
        events: [],
      };
    }
    acc[key].events.push(event);
    return acc;
  }, {} as Record<string, { coordinates: { lat: number; lng: number }; events: typeof events }>);

  const handleSaveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem('mapbox_token', tokenInput.trim());
      setMapboxToken(tokenInput.trim());
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: DURANGO_CENTER,
        zoom: 14,
        pitch: 45,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.on('load', () => {
        setMapReady(true);
      });

      return () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.current?.remove();
        map.current = null;
        setMapReady(false);
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      localStorage.removeItem('mapbox_token');
      setMapboxToken('');
    }
  }, [mapboxToken]);

  // Add markers when map is ready
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each unique location
    Object.values(locationEvents).forEach(({ coordinates, events: locEvents }) => {
      const isSelected = locEvents.some(e => e.id === selectedEventId);
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'cursor-pointer transition-transform hover:scale-110';
      el.innerHTML = `
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${isSelected ? 'hsl(45, 93%, 47%)' : 'hsl(25, 95%, 53%)'}" stroke="${isSelected ? 'hsl(45, 93%, 60%)' : 'hsl(25, 95%, 65%)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3" fill="white"/>
          </svg>
          ${locEvents.length > 1 ? `<span class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">${locEvents.length}</span>` : ''}
        </div>
      `;

      el.addEventListener('click', () => {
        onEventSelect(locEvents[0].id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [mapReady, selectedEventId, onEventSelect]);

  // Fly to selected event
  useEffect(() => {
    if (!map.current || !mapReady || !selectedEvent) return;

    map.current.flyTo({
      center: [selectedEvent.coordinates.lng, selectedEvent.coordinates.lat],
      zoom: 16,
      duration: 1000,
    });
  }, [selectedEventId, mapReady, selectedEvent]);

  if (!mapboxToken) {
    return (
      <div className="relative z-10 flex flex-col h-full px-4 pb-24">
        <div className="py-4">
          <h2 className="font-display text-2xl text-foreground mb-1">Event Map</h2>
          <p className="text-sm text-muted-foreground">
            Enter your Mapbox public token to view the interactive map
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Mapbox Public Token
            </label>
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="bg-background/50"
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Get your free token at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              mapbox.com
            </a>
            {' '}→ Account → Tokens
          </p>

          <Button 
            onClick={handleSaveToken}
            disabled={!tokenInput.trim()}
            className="w-full"
          >
            Save Token & Load Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="flex-1 min-h-[400px]" />

      {/* Selected Event Details */}
      {selectedEvent && (
        <div className="absolute bottom-24 left-4 right-4 glass-card rounded-xl p-4 animate-fade-in">
          <button 
            onClick={() => onEventSelect('')}
            className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="font-display text-xl text-foreground mb-1 pr-6">
            {selectedEvent.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {selectedEvent.description}
          </p>
          <div className="flex items-center gap-2 text-accent">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{selectedEvent.location}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {selectedEvent.time} • {selectedEvent.date === 'all-week' ? 'All Week' : selectedEvent.date}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;