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

// Real coordinates for Durango venues (approximate positions along Main Ave)
const venueCoordinates: Record<string, { lat: number; lng: number }> = {
  "La Plata County": { lat: 37.2850, lng: -107.8750 },
  "Durango Public Library - 1900 E 3rd Ave": { lat: 37.2746, lng: -107.8762 },
  "Bark Bark - 634 Main Ste B": { lat: 37.2741, lng: -107.8800 },
  "Pet Haus - 1444 Main": { lat: 37.2788, lng: -107.8803 },
  "The Subterrain - 900 Main Ave": { lat: 37.2759, lng: -107.8806 },
  "The Subterrain - 900 Main": { lat: 37.2759, lng: -107.8806 },
  "Prohibition Herb - 1185 Camino Del Rio": { lat: 37.2720, lng: -107.8760 },
  "Magpie's Newsstand & Café - 707 Main": { lat: 37.2746, lng: -107.8805 },
  "Gazpacho New Mexican Restaurant - 431 E 2nd Ave": { lat: 37.2735, lng: -107.8785 },
  "Gazpacho Restaurant - 431 E 2nd Ave": { lat: 37.2735, lng: -107.8785 },
  "Gable House Bed and Breakfast Inn - 805 E 5th Ave": { lat: 37.2761, lng: -107.8770 },
  "Gravity Lab - 732 CR 233": { lat: 37.2710, lng: -107.8830 },
  "VFW - 1550 Main": { lat: 37.2795, lng: -107.8802 },
  "Durango Dance - 3416 Main Ste 101": { lat: 37.2850, lng: -107.8795 },
  "Starlight Lounge - 937 Main": { lat: 37.2762, lng: -107.8805 },
  "Durango Beer and Ice Company - 3000 Main": { lat: 37.2835, lng: -107.8798 },
  "Union Social House - 3062 Main": { lat: 37.2840, lng: -107.8796 },
  "Black Heron Lounge - 726 Main": { lat: 37.2748, lng: -107.8804 },
  "Durango Arts Center Theatre - 802 E 2nd Ave": { lat: 37.2738, lng: -107.8775 },
  "EsoTerra Cider & Wines - 558 Main": { lat: 37.2738, lng: -107.8808 },
  "8th Avenue Tavern - 509 E 8th Ave": { lat: 37.2773, lng: -107.8780 },
  "Hermosa Cafe - 738 Main": { lat: 37.2749, lng: -107.8804 },
  "Applebee's - 800 Camino Del Rio": { lat: 37.2715, lng: -107.8765 },
  "Blue Rain Gallery - 934 Main": { lat: 37.2761, lng: -107.8806 },
  "Four Leaves Winery - 528 Main": { lat: 37.2736, lng: -107.8809 },
  "Guild House Games - 835 Main Ste 203": { lat: 37.2754, lng: -107.8806 },
  "Office Depot - 331 S Camino Del Rio Ste D": { lat: 37.2700, lng: -107.8755 },
  "Lizard Head Trading Company - 965 Main": { lat: 37.2764, lng: -107.8805 },
  "Barons Creek Vineyards - 901 Main": { lat: 37.2758, lng: -107.8806 },
  "11th Street Station - 1101 Main": { lat: 37.2775, lng: -107.8804 },
  "Ska Brewing - 225 Girard": { lat: 37.2680, lng: -107.8730 },
  "Animas Brewing Company - 802 E 2nd Ave": { lat: 37.2738, lng: -107.8778 },
  "Buckley Park": { lat: 37.2745, lng: -107.8795 },
  "Animas City Park - 3200 W 4th Ave": { lat: 37.2850, lng: -107.8880 },
  "Town Plaza": { lat: 37.2752, lng: -107.8800 },
  "Main Avenue": { lat: 37.2755, lng: -107.8803 },
  "Toh-Atin Gallery - 145 W 9th St": { lat: 37.2778, lng: -107.8815 },
  "The Nugget - 957 Main": { lat: 37.2763, lng: -107.8805 },
  "Diamond Belle Saloon at Strater Hotel - 699 Main": { lat: 37.2744, lng: -107.8805 },
  "El Moro - 945 Main": { lat: 37.2762, lng: -107.8805 },
  "Lady Falconburgh's - 640 Main": { lat: 37.2742, lng: -107.8807 },
  "DBC Annex - 2949 Main": { lat: 37.2832, lng: -107.8799 },
  "The Roller Rink - 1215 Camino Del Rio": { lat: 37.2722, lng: -107.8758 },
  "Powerhouse Science Center - 1333 Camino Del Rio": { lat: 37.2728, lng: -107.8752 },
  "Transit Center - 250 W 8th St": { lat: 37.2770, lng: -107.8820 },
  "Silverton Mountain Ski Area": { lat: 37.8850, lng: -107.6650 },
  "Purgatory Resort": { lat: 37.6300, lng: -107.8140 },
  "Hesperus Ski Area": { lat: 37.2950, lng: -108.0550 },
};

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

  // Get unique locations by name with their events
  const locationEvents = events.reduce((acc, event) => {
    const key = event.location;
    if (!acc[key]) {
      // Use venue coordinates if available, otherwise use event's original coordinates
      const coords = venueCoordinates[event.location] || event.coordinates;
      acc[key] = {
        coordinates: coords,
        location: event.location,
        events: [],
      };
    }
    acc[key].events.push(event);
    return acc;
  }, {} as Record<string, { coordinates: { lat: number; lng: number }; location: string; events: typeof events }>);

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