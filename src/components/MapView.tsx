import { useEffect, useRef, useState } from 'react';
import { events, Event } from '@/data/events';
import { MapPin, X, Calendar, Clock } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


interface MapViewProps {
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
}

interface SelectedLocation {
  location: string;
  events: Event[];
}

// Downtown Durango center coordinates
const DURANGO_CENTER: [number, number] = [-107.8801, 37.2753];

// GPS coordinates for Durango venues from official data
const venueCoordinates: Record<string, { lat: number; lng: number }> = {
  // From uploaded spreadsheet
  "Lola's Place - 725 E 2nd. Avenue": { lat: 37.271591141804066, lng: -107.88015291629407 },
  "Lola's Place - 725 E 2nd Ave": { lat: 37.271591141804066, lng: -107.88015291629407 },
  "The Balcony - 600 Main Ave": { lat: 37.270331989135336, lng: -107.88139625800191 },
  "8th Ave Tavern - 509 E 8th Ave": { lat: 37.2680936268276, lng: -107.87264463470723 },
  "8th Avenue Tavern - 509 E 8th Ave": { lat: 37.2680936268276, lng: -107.87264463470723 },
  "Wild Horse Saloon - 601 E 2nd Ave Ste A": { lat: 37.2702543478759, lng: -107.88054799663774 },
  "Black Heron Lounge - 726 Main Ave": { lat: 37.271746826497164, lng: -107.88078056169545 },
  "Black Heron Lounge - 726 Main": { lat: 37.271746826497164, lng: -107.88078056169545 },
  "La Plata County Fairgrounds & Event Center": { lat: 37.292721644626695, lng: -107.87232581567127 },
  "Blue Rain Gallery - 934 Main Ave, Unit B": { lat: 37.27407652076874, lng: -107.88001403101325 },
  "Blue Rain Gallery - 934 Main": { lat: 37.27407652076874, lng: -107.88001403101325 },
  "The Subterrain - 900 Main Ave": { lat: 37.273588572150885, lng: -107.88040510402486 },
  "The Subterrain - 900 Main": { lat: 37.273588572150885, lng: -107.88040510402486 },
  "Oye - 1017 Main Ave": { lat: 37.274952719225, lng: -107.8804982886837 },
  "Barons Creek Vineyards - 901 Main Ave": { lat: 37.27383907172465, lng: -107.88103097518959 },
  "Barons Creek Vineyards - 901 Main": { lat: 37.27383907172465, lng: -107.88103097518959 },
  "Gazpacho New Mexican Restaurant - 431 E 2nd Ave": { lat: 37.26866751904039, lng: -107.88115736169566 },
  "Gazpacho Restaurant - 431 E 2nd Ave": { lat: 37.26866751904039, lng: -107.88115736169566 },
  "11th Street Station - 1101 Main Ave": { lat: 37.27606070292123, lng: -107.88038183470684 },
  "11th Street Station - 1101 Main": { lat: 37.27606070292123, lng: -107.88038183470684 },
  "Durango Public Library - 1900 E 3rd Ave": { lat: 37.283916717024944, lng: -107.8736275463538 },
  "Durango American Legion - 878 E 2nd Ave": { lat: 37.273319574719224, lng: -107.87925590402484 },
  "American Legion - 878 E 2nd Ave": { lat: 37.273319574719224, lng: -107.87925590402484 },
  "Animas Chocolate Company - 920 Main Ave": { lat: 37.2737154970162, lng: -107.88033064820114 },
  "Union Social House - 3062 Main Ave": { lat: 37.298917834141875, lng: -107.8714222481999 },
  "Union Social House - 3062 Main": { lat: 37.298917834141875, lng: -107.8714222481999 },
  "Powerhouse Science Center - 1333 Camino Del Rio": { lat: 37.278719724448116, lng: -107.88003249035341 },
  "Ska World Headquarters. - 225 Girard Street": { lat: 37.23897374225163, lng: -107.87604673082834 },
  "Ska World Headquarters - 225 Girard St": { lat: 37.23897374225163, lng: -107.87604673082834 },
  "Ska Brewing - 225 Girard": { lat: 37.23897374225163, lng: -107.87604673082834 },
  "Downtown Durango - Main Avenue - From College Dr to 12th St": { lat: 37.274463511532645, lng: -107.88034834336818 },
  "Gravity Lab - 732 CR-233": { lat: 37.22937958002034, lng: -107.80894354635663 },
  "Gravity Lab - 732 CR 233": { lat: 37.229422292565566, lng: -107.8090079193682 },
  "El Rancho Tavern - 975 Main Ave": { lat: 37.27474401730894, lng: -107.88059836169535 },
  "Animas City Theatre - 128 E College Dr": { lat: 37.269925303034476, lng: -107.8811185482013 },
  "Carver Brewing Co. - 1022 Main Ave": { lat: 37.274994719129616, lng: -107.88009330402481 },
  "VFW Post 4031 - 1550 Main Ave": { lat: 37.2804857291656, lng: -107.87810247888294 },
  "VFW - 1550 Main": { lat: 37.2804857291656, lng: -107.87810247888294 },
  "Guild House Games - 835 Main Ave": { lat: 37.27300356123316, lng: -107.88147801936589 },
  "Guild House Games - 835 Main Ste 203": { lat: 37.27300356123316, lng: -107.88147801936589 },
  "Four Leaves Winery - 528 Main Ave": { lat: 37.26962380725341, lng: -107.88190069053087 },
  "Four Leaves Winery - 528 Main": { lat: 37.26962380725341, lng: -107.88190069053087 },
  "Dalton Ranch Clubhouse Restaurant - 589 County Rd 252": { lat: 37.39199507374744, lng: -107.83750380401884 },
  "Durango Elks Lodge - 901 E 2nd Ave": { lat: 37.27366343468804, lng: -107.87961238849917 },
  "Durango Elks Lodge901 E 2nd Ave.": { lat: 37.27366343468804, lng: -107.87961238849917 },
  "Elks Lodge #507 - 901 E 2nd Ave": { lat: 37.27366343468804, lng: -107.87961238849917 },
  "Elks Ballroom - 901 E 2nd Ave": { lat: 37.27366343468804, lng: -107.87961238849917 },
  "EsoTerra Cider & Wines - 558 Main Ave": { lat: 37.2699884442741, lng: -107.88155505966306 },
  "EsoTerra Cider & Wines - 558 Main": { lat: 37.2699884442741, lng: -107.88155505966306 },
  "Hermosa Cafe - 738 Main Ave": { lat: 37.271950076866524, lng: -107.88109690402499 },
  "Hermosa Cafe - 738 Main": { lat: 37.27198422760396, lng: -107.88110763286024 },
  "Anarchy Brewing - 225 E 8th Ave Unit C": { lat: 37.26479068079217, lng: -107.87364317334323 },
  "Stoked - 640 Main Ave": { lat: 37.27082225292892, lng: -107.881215588684 },
  "Durango Arts Center - 802 E 2nd Ave": { lat: 37.272313525211594, lng: -107.87946935984856 },
  "Durango Arts Center Theatre - 802 E 2nd Ave": { lat: 37.272313525211594, lng: -107.87946935984856 },
  "The Garage - 121 W 8th St": { lat: 37.27267107391278, lng: -107.88153457518963 },
  "Purgatory Resort - The Beach1 Skier Place": { lat: 37.6293281828919, lng: -107.81108499873797 },
  "Purgatory Resort": { lat: 37.6293281828919, lng: -107.81108499873797 },
  "Zia Cantina - 2977 Main Ave": { lat: 37.29749453326957, lng: -107.87216715061325 },
  "Prohibition Herb - 1185 Camino Del Rio": { lat: 37.276872766287546, lng: -107.88163727518943 },
  "Confluence Park - 100 Confluence Avenue": { lat: 37.23817431729288, lng: -107.82094057263072 },
  "San Juan Angler - 600 Main Ave, Ste 202": { lat: 37.27053909137122, lng: -107.88080277760301 },
  "J Bo's Pizza - 1301 Florida Rd, Unit E": { lat: 37.29669350774901, lng: -107.85336733101217 },
  "D&SNG Museum - 479 Main Ave": { lat: 37.26838038169863, lng: -107.88227053286037 },
  "Alpine Bank - 1099 Main Ave": { lat: 37.276029648723004, lng: -107.87904121166144 },
  "Los Amigos Del Sur - 835 Main Ave": { lat: 37.27321839942897, lng: -107.88076773157977 },
  "McDonalds - 201 W College Dr": { lat: 37.27020471628864, lng: -107.88271423712045 },
  "Folsom Place - 11 Folsom Place": { lat: 37.28846284076177, lng: -107.86785921084498 },
  "Best Western Rio Grande Inn - 400 E 2nd Ave": { lat: 37.26765417057392, lng: -107.88088194635468 },
  "The Good Fight Boxing Gym - 835 Main Ave, Ste 105": { lat: 37.272977083841546, lng: -107.88144528901219 },
  "Rocky Mountain High - 120 E 6th": { lat: 37.304920251222356, lng: -107.86699953285856 },
  "Lizard Head Trading Company - 965 Main Ave": { lat: 37.27448216997428, lng: -107.8808532193659 },
  "Lizard Head Trading Company - 965 Main": { lat: 37.27448216997428, lng: -107.8808532193659 },
  "The Office - 699 Main Ave": { lat: 37.27112700112642, lng: -107.88182349053082 },
  "Animas River Lounge - 501 Camino Del Rio": { lat: 37.26991212212867, lng: -107.88572462334298 },
  "DoubleTree Grand Ballroom - 501 Camino Del Rio": { lat: 37.270280342959424, lng: -107.88573594635456 },
  "Grassburger Downtown - 726 1/2 Main Ave": { lat: 37.27199888190841, lng: -107.88078331936602 },
  "Maria's Bookshop - 960 Main Ave": { lat: 37.27447201866629, lng: -107.88034676169532 },
  "The Roost - 128 E College Dr": { lat: 37.27008646818064, lng: -107.88104851751926 },
  "Applebee's - 800 Camino Del Rio": { lat: 37.27368637246648, lng: -107.88409476169535 },
  "Durango Dance - 3416 Main Ave, Ste 101": { lat: 37.302888887443395, lng: -107.86928973285869 },
  "Durango Dance - 3416 Main Ste 101": { lat: 37.302888887443395, lng: -107.86928973285869 },
  "Steamworks Brewing - 801 E 2nd Ave": { lat: 37.27234607327844, lng: -107.87999244635442 },
  "Starlight Lounge - 937 Main Ave": { lat: 37.274406768800866, lng: -107.8808290040248 },
  "Starlight Lounge - 937 Main": { lat: 37.274406768800866, lng: -107.8808290040248 },
  "Chapman Hill - 500 Florida Rd": { lat: 37.283332691562244, lng: -107.86777883896652 },
  "Durango Beer and Ice Company - 3000 Main Ave": { lat: 37.29783529776685, lng: -107.87185403101205 },
  "Durango Beer and Ice Company - 3000 Main": { lat: 37.29783529776685, lng: -107.87185403101205 },
  "Office Depot - 331 S Camino Del Rio, Ste D": { lat: 37.251270392604546, lng: -107.878102704026 },
  "Office Depot - 331 S Camino Del Rio Ste D": { lat: 37.251270392604546, lng: -107.878102704026 },
  "Cork & Larder - 120 W 8th St": { lat: 37.27243174964322, lng: -107.8814020040249 },
  "The Powerhouse - 1333 Camino Del Rio": { lat: 37.278719724448116, lng: -107.88003249035341 },
  "The Powerhouse - 1333 Camino del Rio": { lat: 37.278719724448116, lng: -107.88003249035341 },
  "CrossFit Durango - 600 Sawmill Road": { lat: 37.247015423111534, lng: -107.86930358868518 },
  "Pet Haus - 1444 Main Ave": { lat: 37.27940106718191, lng: -107.87852254053037 },
  "Pet Haus - 1444 Main": { lat: 37.27940106718191, lng: -107.87852254053037 },
  "Durango Winery - 900 Main Ave": { lat: 37.27372567203349, lng: -107.88047587703636 },
  "The Gable House - 805 E 5th Ave": { lat: 37.27169180209377, lng: -107.87579936169551 },
  "Gable House Bed and Breakfast Inn - 805 E 5th Ave": { lat: 37.27169180209377, lng: -107.87579936169551 },
  "Bark Bark - 643b Main Ave": { lat: 37.270918704022584, lng: -107.88204589053075 },
  "Bark Bark - 634 Main Ste B": { lat: 37.270918704022584, lng: -107.88204589053075 },
  
  // Additional fallback locations
  "Main Avenue": { lat: 37.274463511532645, lng: -107.88034834336818 },
  "Town Plaza": { lat: 37.274463511532645, lng: -107.88034834336818 },
  "Buckley Park": { lat: 37.2755, lng: -107.8815 },
  "La Plata County": { lat: 37.292721644626695, lng: -107.87232581567127 },
  "Silverton Mountain Ski Area": { lat: 37.8850, lng: -107.6650 },
  "Hesperus Ski Area": { lat: 37.2950, lng: -108.0550 },
};

// Mapbox public token (publishable key - safe for frontend)
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ3RoNzU2ciIsImEiOiJjbWp4cWFtdHY2cHM5M2VvdHpoeGltd3BoIn0.XKYCPY5IX4Fz55NZvgdVdg';

const MapView = ({ selectedEventId, onEventSelect }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

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
    }
  }, []);

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
        if (locEvents.length > 1) {
          // Show location panel with all events
          setSelectedLocation({ location: locEvents[0].location, events: locEvents });
        } else {
          // Single event - select it directly
          setSelectedLocation(null);
          onEventSelect(locEvents[0].id);
        }
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

    // Use venue coordinates if available, otherwise fall back to event coordinates
    const coords = venueCoordinates[selectedEvent.location] || selectedEvent.coordinates;
    
    map.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 16,
      duration: 1000,
    });
  }, [selectedEventId, mapReady, selectedEvent]);

  return (
    <div className="relative z-10 flex flex-col h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="flex-1 min-h-[400px]" />

      {/* Selected Location with Multiple Events */}
      {selectedLocation && (
        <div className="absolute bottom-24 left-4 right-14 glass-card rounded-xl p-4 animate-fade-in">
          <button 
            onClick={() => setSelectedLocation(null)}
            className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-accent mb-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate pr-6">{selectedLocation.location}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{selectedLocation.events.length} events at this location</p>
          <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
            {selectedLocation.events.map((event) => (
              <button
                key={event.id}
                onClick={() => {
                  onEventSelect(event.id);
                  setSelectedLocation(null);
                }}
                className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <h4 className="font-display text-sm text-foreground mb-1 line-clamp-1">
                  {event.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {event.date === 'all-week' ? 'All Week' : event.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Single Event Details */}
      {selectedEvent && !selectedLocation && (
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