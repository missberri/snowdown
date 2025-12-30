import { Calendar, Map, Info } from 'lucide-react';

interface NavigationProps {
  activeTab: 'schedule' | 'map' | 'about';
  onTabChange: (tab: 'schedule' | 'map' | 'about') => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
    { id: 'map' as const, label: 'Map', icon: Map },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon 
                className={`w-5 h-5 mb-1 transition-transform duration-300 ${
                  isActive ? 'scale-110' : ''
                }`} 
              />
              <span className={`text-xs font-medium ${isActive ? 'text-primary' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-8 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
