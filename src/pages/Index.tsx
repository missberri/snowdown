import { useState, useRef } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ScheduleView from '@/components/ScheduleView';
import MapView from '@/components/MapView';
import AboutView from '@/components/AboutView';
import MyEventsView from '@/components/MyEventsView';
import SnowEffect from '@/components/SnowEffect';
import { useLikedEvents } from '@/hooks/useLikedEvents';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'my-events' | 'map' | 'about'>('schedule');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [scheduleActiveDate, setScheduleActiveDate] = useState<string>('all-week');
  const { likedEventIds, toggleLike, isLiked, likedCount } = useLikedEvents();
  const scheduleScrollPosition = useRef(0);

  const handleEventSelect = (eventId: string) => {
    // Toggle selection - if clicking same event, deselect; otherwise select new one
    setSelectedEventId((prev) => (prev === eventId ? null : eventId));
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
              isLiked={isLiked}
              onToggleLike={toggleLike}
              scrollPosition={scheduleScrollPosition}
              activeDate={scheduleActiveDate}
              onActiveDateChange={setScheduleActiveDate}
            />
          )}
          {activeTab === 'my-events' && (
            <MyEventsView
              likedEventIds={likedEventIds}
              onToggleLike={toggleLike}
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
        
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} likedCount={likedCount} />
      </div>
    </div>
  );
};

export default Index;
