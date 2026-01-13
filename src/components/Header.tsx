import snowdownLogo from '@/assets/snowdown-logo.avif';

const Header = () => {
  return (
    <header className="relative z-10 px-4 pt-8 pb-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <img src={snowdownLogo} alt="Snowdown" className="w-6 h-6" />
          <img src={snowdownLogo} alt="Snowdown" className="w-6 h-6" />
        </div>
        
        <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-2">
          <span className="text-gradient">SNOWDOWN</span>
        </h1>
        
        <p className="text-lg font-display text-foreground/90 tracking-wide">
          Uniquely Colorado
        </p>
        <p className="text-sm text-accent font-semibold tracking-widest uppercase mt-1">
          Then & Wow!
        </p>
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mt-2">
          January 23 - February 1, 2026
        </p>
      </div>
    </header>
  );
};

export default Header;
