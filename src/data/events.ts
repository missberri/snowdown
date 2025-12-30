export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: 'competition' | 'activity' | 'entertainment';
  coordinates: { lat: number; lng: number };
  image?: string;
}

export const events: Event[] = [
  {
    id: '1',
    title: 'Ski Joring Championship',
    description: 'Watch horses pull skiers through downtown at breakneck speeds in this uniquely Colorado tradition.',
    date: '2026-01-22',
    time: '2:00 PM',
    location: 'Main Street',
    category: 'competition',
    coordinates: { lat: 37.2753, lng: -107.8801 },
  },
  {
    id: '2',
    title: 'Snowshoe Race',
    description: 'Test your endurance in our annual snowshoe race through historic trails.',
    date: '2026-01-23',
    time: '10:00 AM',
    location: 'Animas River Trail',
    category: 'competition',
    coordinates: { lat: 37.2785, lng: -107.8800 },
  },
  {
    id: '3',
    title: 'Ice Sculpture Contest',
    description: 'Artists transform blocks of ice into stunning works of art celebrating Colorado heritage.',
    date: '2026-01-23',
    time: '9:00 AM',
    location: 'Town Plaza',
    category: 'competition',
    coordinates: { lat: 37.2749, lng: -107.8820 },
  },
  {
    id: '4',
    title: 'Hot Wing Eating Challenge',
    description: 'Can you handle the heat? Compete for the title of wing champion.',
    date: '2026-01-24',
    time: '6:00 PM',
    location: "Steamworks Brewing",
    category: 'competition',
    coordinates: { lat: 37.2756, lng: -107.8807 },
  },
  {
    id: '5',
    title: 'Snow Sculpture Showdown',
    description: 'Teams compete to build the most impressive snow sculptures.',
    date: '2026-01-25',
    time: '11:00 AM',
    location: 'Rotary Park',
    category: 'competition',
    coordinates: { lat: 37.2720, lng: -107.8795 },
  },
  {
    id: '6',
    title: 'Cardboard Sled Derby',
    description: 'Build a sled from cardboard and race down the hill! Creativity counts.',
    date: '2026-01-25',
    time: '1:00 PM',
    location: 'Chapman Hill',
    category: 'competition',
    coordinates: { lat: 37.2695, lng: -107.8760 },
  },
  {
    id: '7',
    title: 'Beard & Stache Contest',
    description: 'Show off your finest facial hair in true frontier fashion.',
    date: '2026-01-26',
    time: '3:00 PM',
    location: 'El Rancho Tavern',
    category: 'competition',
    coordinates: { lat: 37.2761, lng: -107.8815 },
  },
  {
    id: '8',
    title: 'Polar Plunge',
    description: 'Take a dip in the icy Animas River for charity. Not for the faint of heart!',
    date: '2026-01-26',
    time: '12:00 PM',
    location: 'Santa Rita Park',
    category: 'competition',
    coordinates: { lat: 37.2790, lng: -107.8785 },
  },
];

export const categories = [
  { id: 'all', label: 'All Events', icon: '🎿' },
  { id: 'competition', label: 'Competitions', icon: '🏆' },
  { id: 'activity', label: 'Activities', icon: '⛷️' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
];
