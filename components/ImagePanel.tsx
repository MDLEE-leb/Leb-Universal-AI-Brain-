
import React, { useState } from 'react';
import { generateImages } from '../services/geminiService.ts';
import { ImageIcon } from './icons.tsx';
import SpeechToTextButton from './SpeechToTextButton.tsx';

const ImagePanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setPromptError('Prompt cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setPromptError(null);
    setGeneratedImages([]);

    try {
      const imagesB64 = await generateImages(prompt, aspectRatio, numberOfImages);
      setGeneratedImages(imagesB64.map(b64 => `data:image/png;base64,${b64}`));
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-white">Image Brain</h2>
      </header>
      <div className="flex-1 p-6 grid md:grid-cols-2 gap-6">
        <div className="flex flex-col bg-gray-900/50 p-6 rounded-lg border border-gray-700 shadow-2xl">
           <h3 className="text-xl font-semibold mb-4 text-gray-300">Image Generation</h3>
           <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (promptError) setPromptError(null);
              }}
              placeholder="Describe the image you want to create..."
              className={`w-full h-40 p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none resize-none ${promptError ? 'ring-2 ring-red-500' : 'focus:ring-2 focus:ring-indigo-500'}`}
              disabled={isLoading}
            />
            <div className="absolute bottom-2 right-2">
                <SpeechToTextButton
                    onTranscript={(transcript) => setPrompt(prev => `${prev ? prev + ' ' : ''}${transcript}`)}
                    isInputDisabled={isLoading}
                />
            </div>
          </div>
          {promptError && <p className="text-red-400 text-sm mt-2">{promptError}</p>}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="aspect-ratio-select" className="block text-sm font-medium text-gray-400 mb-1">
                Aspect Ratio
              </label>
              <select
                id="aspect-ratio-select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {aspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="number-of-images" className="block text-sm font-medium text-gray-400 mb-1">
                Number of Images
              </label>
              <input
                type="number"
                id="number-of-images"
                value={numberOfImages}
                onChange={(e) => setNumberOfImages(Math.max(1, Math.min(4, parseInt(e.target.value, 10) || 1)))}
                min="1"
                max="4"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full mt-4 px-6 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
          >
            {isLoading ? `Generating ${numberOfImages} image(s)...` : 'Generate'}
          </button>
          {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 overflow-y-auto flex items-center justify-center">
          {isLoading && (
            <div className={`grid ${numberOfImages > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 w-full h-full`}>
                {Array.from({ length: numberOfImages }).map((_, i) => (
                    <div key={i} className="w-full bg-gray-800 rounded-lg flex items-center justify-center animate-pulse">
                         <ImageIcon className="w-12 h-12 text-gray-600" />
                    </div>
                ))}
            </div>
          )}
          {generatedImages.length > 0 && (
             <div className={`grid ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {generatedImages.map((src, index) => (
                    <img key={index} src={src} alt={`Generated by AI ${index + 1}`} className="w-full h-full object-contain rounded-lg shadow-lg" />
                ))}
             </div>
          )}
          {!isLoading && generatedImages.length === 0 && (
             <div className="text-center text-gray-500">
                <ImageIcon className="w-24 h-24 mx-auto mb-4" />
                <p>The generated image(s) will appear here.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePanel;