
import React from 'react';
import { BrainType } from '../types.js';
import {
  ChatIcon,
  CodeIcon,
  VisionIcon,
  AudioIcon,
  ImageIcon,
  EditIcon,
  HtmlIcon,
  TaskIcon,
  QrCodeIcon,
  ZedaIcon,
  LameriaIcon,
  ExternalLinkIcon,
} from './icons.js';

interface DashboardPanelProps {
  setActiveBrain: (brain: BrainType) => void;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ setActiveBrain }) => {
  const brains = [
    {
      type: BrainType.CHAT,
      Icon: ChatIcon,
      description: 'Engage in intelligent conversations, ask questions, and get instant answers.',
      color: 'text-sky-400',
    },
    {
      type: BrainType.CODE,
      Icon: CodeIcon,
      description: 'Generate code snippets, debug issues, and get programming help.',
      color: 'text-emerald-400',
    },
    {
      type: BrainType.HTML,
      Icon: HtmlIcon,
      description: 'Create complete, responsive web pages from a text description.',
      color: 'text-orange-400',
    },
    {
      type: BrainType.VISION,
      Icon: VisionIcon,
      description: 'Upload an image and ask questions about its content.',
      color: 'text-purple-400',
    },
    {
      type: BrainType.AUDIO,
      Icon: AudioIcon,
      description: 'Convert text into natural-sounding speech with various voices.',
      color: 'text-rose-400',
    },
    {
      type: BrainType.IMAGE,
      Icon: ImageIcon,
      description: 'Generate stunning, high-quality images from text prompts.',
      color: 'text-amber-400',
    },
    {
      type: BrainType.EDIT,
      Icon: EditIcon,
      description: 'Edit existing images by providing simple text instructions.',
      color: 'text-indigo-400',
    },
    {
      type: BrainType.TASK,
      Icon: TaskIcon,
      description: 'Organize your to-dos with priorities, due dates, and sorting options.',
      color: 'text-cyan-400',
    },
    {
        type: BrainType.QR,
        Icon: QrCodeIcon,
        description: 'Generate and customize QR codes for links, text, and more.',
        color: 'text-lime-400',
    },
  ];

  const externalTools = [
    {
      name: 'Zeda.AI',
      Icon: ZedaIcon,
      description: 'Your AI-powered product discovery and strategy co-pilot.',
      color: 'text-teal-400',
      href: 'https://zeda.io/',
    },
    {
      name: 'Lameria AI',
      Icon: LameriaIcon,
      description: 'AI-driven design and trend forecasting for the fashion industry.',
      color: 'text-pink-400',
      href: '#', // Placeholder link
    },
  ];

  return (
    <div className="bg-gray-800 h-full p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Welcome to the Leb Universal AI Brain</h1>
          <p className="mt-4 text-lg text-gray-400">Select a capability below to get started.</p>
        </div>

        <h2 className="text-xl font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-6">Internal Brains</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {brains.map(({ type, Icon, description, color }) => (
            <button
              key={type}
              onClick={() => setActiveBrain(type)}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 text-left hover:border-indigo-500 hover:bg-gray-900 transition-all duration-300 transform hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-3">
                <Icon className={`w-8 h-8 ${color}`} />
                <h2 className="text-2xl font-bold text-gray-100">{type}</h2>
              </div>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{description}</p>
            </button>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-6 mt-12">External Tools & Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {externalTools.map(({ name, Icon, description, color, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative bg-gray-900/50 border border-gray-700 rounded-lg p-6 text-left hover:border-gray-500 hover:bg-gray-900 transition-all duration-300 transform hover:-translate-y-1 group block"
            >
              <ExternalLinkIcon className="absolute top-4 right-4 w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
              <div className="flex items-center gap-4 mb-3">
                <Icon className={`w-8 h-8 ${color}`} />
                <h2 className="text-2xl font-bold text-gray-100">{name}</h2>
              </div>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;