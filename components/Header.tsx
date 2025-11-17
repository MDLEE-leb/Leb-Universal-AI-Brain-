import React from 'react';
import { MenuIcon, ChevronDownIcon, UserCircleIcon } from './icons.js';
import { BrainType } from '../types.js';
import { useAuth } from '../hooks/useAuth.js';

interface HeaderProps {
  toggleSidebar: () => void;
  setActiveBrain: (brain: BrainType) => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, setActiveBrain }) => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-gray-800 border-b border-gray-700/50 p-4 flex items-center justify-between flex-shrink-0">
      {/* Left side: Toggle and Dashboards */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setActiveBrain(BrainType.DASHBOARD)}
          className="flex items-center gap-2 text-white font-semibold p-2 rounded-md hover:bg-gray-700 transition-colors">
          <span>Dashboards</span>
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Right side: User Profile / Logout */}
      <div className="flex items-center">
        <div className="relative group">
          <button className="flex items-center gap-3 text-white p-2 rounded-md hover:bg-gray-700 transition-colors">
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
            <span className="font-medium hidden sm:block">{currentUser?.email}</span>
            <ChevronDownIcon className="w-4 h-4 hidden sm:block" />
          </button>
          <div className="absolute right-0 mt-1 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;