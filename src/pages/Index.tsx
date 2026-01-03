import { useState } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ScheduleView from '@/components/ScheduleView';
import MapView from '@/components/MapView';
import AboutView from '@/components/AboutView';
import SnowEffect from '@/components/SnowEffect';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'map' | 'about'>('schedule');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleEventSelect = (eventId: string) => {
    // Toggle selection - if clicking same event, deselect; otherwise select new one
    setSelectedEventId(prev => prev === eventId ? null : eventId);
    console.log('Event selected:', eventId);
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <SnowEffect />
      
      <div className="flex flex-col h-screen">
        <Header />
        
        <main className="flex-1 overflow-hidden">
          {activeTab === 'schedule' && (
            <ScheduleView 
              onEventSelect={handleEventSelect}
              selectedEventId={selectedEventId}
            />
          )}
          {activeTab === 'map' && (
            <MapView 
              selectedEventId={selectedEventId}
              onEventSelect={handleEventSelect}
            />
          )}
          {activeTab === 'about' && <AboutView />}
        </main>
        
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
