import React from 'react';
import { BrainType } from '../types.ts';
import { BrainIcon, ChatIcon, CodeIcon, VisionIcon, AudioIcon, ImageIcon, EditIcon, DashboardIcon, HtmlIcon, TaskIcon, QrCodeIcon, VideoIcon, LiveIcon } from './icons.tsx';

interface SidebarProps {
  activeBrain: BrainType;
  setActiveBrain: (brain: BrainType) => void;
  isSidebarOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeBrain, setActiveBrain, isSidebarOpen }) => {
  const appTitle = 'Leb Universal AI Brain';
  const navItems = [
    { type: BrainType.DASHBOARD, Icon: DashboardIcon },
    { type: BrainType.CHAT, Icon: ChatIcon },
    { type: BrainType.CODE, Icon: CodeIcon },
    { type: BrainType.HTML, Icon: HtmlIcon },
    { type: BrainType.VISION, Icon: VisionIcon },
    { type: BrainType.AUDIO, Icon: AudioIcon },
    { type: BrainType.LIVE, Icon: LiveIcon },
    { type: BrainType.IMAGE, Icon: ImageIcon },
    { type: BrainType.EDIT, Icon: EditIcon },
    { type: BrainType.VIDEO, Icon: VideoIcon },
    { type: BrainType.TASK, Icon: TaskIcon },
    { type: BrainType.QR, Icon: QrCodeIcon },
  ];

  return (
    <div className={`bg-gray-900 border-r border-gray-700/50 flex flex-col p-4 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center mb-8">
        <BrainIcon className="w-10 h-10 text-indigo-400 flex-shrink-0" />
        {isSidebarOpen && <h1 className="text-xl font-bold ml-3 whitespace-nowrap">{appTitle}</h1>}
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map(({ type, Icon }) => (
          <button
            key={type}
            onClick={() => setActiveBrain(type)}
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
              activeBrain === type
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
            } ${!isSidebarOpen && 'justify-center'}`}
            title={type}
          >
            <Icon className={`w-6 h-6 flex-shrink-0 ${isSidebarOpen && 'mr-4'}`} />
            {isSidebarOpen && <span className="font-medium">{type}</span>}
          </button>
        ))}
      </nav>
      {isSidebarOpen && (
        <div className="mt-auto text-center text-gray-500 text-xs space-y-3">
          <div className="border-t border-gray-700/50 pt-4">
            <p className="font-bold text-sm text-gray-300">MD LEBAKENG</p>
            <p className="text-indigo-400">Founder & Lead Developer</p>
          </div>
          <div className="text-gray-400">
            <p>adntrading@zohomail.com</p>
            <p>0691082020</p>
            <p>123 Innovation Drive, Centurion</p>
            <p>Gauteng, South Africa</p>
          </div>
          <p className="pt-2 text-gray-600">&copy; 2024 {appTitle}</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;