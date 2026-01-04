import { Mountain, Snowflake, Users, Calendar, MapPin } from 'lucide-react';

const AboutView = () => {
  return (
    <div className="relative z-10 h-full overflow-y-auto px-4 pb-24">
      {/* Hero Section */}
      <div className="py-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-accent mb-4">
          <Snowflake className="w-10 h-10 text-accent-foreground" />
        </div>
        <h2 className="font-display text-3xl text-foreground mb-2">
          About SNOWDOWN
        </h2>
        <p className="text-muted-foreground">
          Celebrating Colorado Heritage Since 1979
        </p>
      </div>

      {/* Theme Card */}
      <div className="glass-card rounded-xl p-6 mb-4">
        <h3 className="font-display text-xl text-accent mb-3">
          2026 Theme
        </h3>
        <p className="text-2xl font-display text-foreground mb-2">
          Uniquely Colorado
        </p>
        <p className="text-lg text-primary font-semibold">
          Then & Wow!
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          This year we celebrate the wild spirit, rugged beauty, and 
          one-of-a-kind traditions that make Colorado truly special. 
          From the mining days to mountain legends, experience the 
          history and wonder of the Centennial State.
        </p>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <Calendar className="w-6 h-6 text-secondary mx-auto mb-2" />
          <p className="font-display text-lg text-foreground">10 Days</p>
          <p className="text-xs text-muted-foreground">Jan 23 - Feb 1, 2026</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <MapPin className="w-6 h-6 text-accent mx-auto mb-2" />
          <p className="font-display text-lg text-foreground">Durango</p>
          <p className="text-xs text-muted-foreground">Colorado, USA</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="font-display text-lg text-foreground">200+</p>
          <p className="text-xs text-muted-foreground">Events</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Mountain className="w-6 h-6 text-pine mx-auto mb-2" />
          <p className="font-display text-lg text-foreground">47 Years</p>
          <p className="text-xs text-muted-foreground">Of Tradition</p>
        </div>
      </div>

      {/* History Section */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-xl text-accent mb-3">
          Our History
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          SNOWDOWN began in 1979 as Durango's answer to cabin fever. What 
          started as a small community gathering has grown into Southwest 
          Colorado's most beloved winter festival. Each year features a 
          unique theme that brings out the creative spirit of locals and 
          visitors alike.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          From skijoring down Main to the legendary polar plunge, SNOWDOWN 
          has embodied the adventurous and daring spirit that defines Durango.
        </p>
      </div>
    </div>
  );
};

export default AboutView;
