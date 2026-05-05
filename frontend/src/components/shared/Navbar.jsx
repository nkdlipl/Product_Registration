import { Menu } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 z-30 transition-all">
      <div
        className="h-full px-4 md:px-8 flex items-center justify-between"
        style={{
          background: 'var(--grad-header)',
          borderBottom: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <button
          onClick={onMenuClick}
          className="md:hidden p-3 rounded-xl transition-all bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--accent)]"
        >
          <Menu size={20} strokeWidth={3} />
        </button>
        <div className="hidden md:block" />
        
        <div className="flex items-center gap-4 md:gap-6">
          {/* Theme toggle removed per user request */}


        </div>
      </div>
    </header>
  );
};

export default Navbar;
