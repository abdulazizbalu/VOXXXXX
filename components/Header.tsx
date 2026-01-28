
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/90 glass border-b border-emerald-100/30 py-6 px-8 sticky top-0 z-50 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter lowercase">
          voxly<span className="text-emerald-500">.</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
