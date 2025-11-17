import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage } from '../services/geminiService.js';
import { VisionIcon } from './icons.js';
import SpeechToTextButton from './SpeechToTextButton.js';

const VisionPanel: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const sampleImages = [
    { url: 'https://images.unsplash.com/photo-1526374965328-7b61b4ae2826?w=500&auto=format&fit=crop&q=60', alt: 'Green computer code on a screen' },
    { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60', alt: 'A computer motherboard with circuits' },
    { url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726a?w=500&auto=format&fit=crop&q=60', alt: 'A retro gaming setup with neon lights' },
  ];

  const processFiles = (files: FileList | File[]) => {
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      setImages(imageFiles);
      
      setImagePreviews(currentPreviews => {
        currentPreviews.forEach(url => URL.revokeObjectURL(url));
        return imageFiles.map(file => URL.createObjectURL(file as Blob));
      });

      setResponse('');
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  };

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      setPromptError('Prompt cannot be empty.');
      return;
    }
    if (images.length === 0) return;

    setIsLoading(true);
    setResponse('');
    
    try {
      const imagePayloads = await Promise.all(
        images.map(file => {
          return new Promise<{ imageBase64: string; mimeType: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const imageBase64 = (reader.result as string).split(',')[1];
              if (imageBase64) {
                resolve({ imageBase64, mimeType: file.type });
              } else {
                reject(new Error(`Failed to read file: ${file.name}`));
              }
            };
            reader.onerror = error => reject(error);
          });
        })
      );
      
      const result = await analyzeImage(prompt, imagePayloads);
      setResponse(result);
    } catch (error) {
      console.error('Error analyzing images:', error);
      setResponse('Sorry, I was unable to analyze the images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-white">Vision Brain</h2>
      </header>
      <div className="flex-1 p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
        <div className="flex flex-col bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors ${
              isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {imagePreviews.length > 0 ? (
              <div className="w-full h-full p-2 grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto">
                {imagePreviews.map((src, index) => (
                    <img key={src} src={src} alt={`Preview ${index + 1}`} className="w-full aspect-square object-cover rounded-md" />
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col p-4 text-center">
                <div className="text-gray-400 mb-4">
                    <p className="font-semibold text-lg">{isDragging ? 'Drop images here' : 'Upload an image to analyze'}</p>
                    <p className="text-sm text-gray-500">Drag & drop or click an example below</p>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {sampleImages.map((img, index) => (
                        <div 
                            key={index} 
                            className="relative group cursor-pointer bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <img 
                                src={img.url} 
                                alt={img.alt} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className='text-center'>
                                    <VisionIcon className="w-8 h-8 mx-auto text-white/80" />
                                    <p className="text-white text-md font-bold mt-1">Upload</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              multiple
            />
          </div>
           {imagePreviews.length > 0 && (
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-center py-2 mt-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
                 >
                    Change Selection ({images.length} image{images.length > 1 ? 's' : ''})
                 </button>
            )}
          <div className="mt-4">
            <div className="flex items-center bg-gray-700 rounded-lg p-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (promptError) setPromptError(null);
                }}
                placeholder="What do you want to know about the image(s)?"
                className={`flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none px-2 ${promptError ? 'ring-2 ring-red-500 rounded-md' : 'focus:ring-2 focus:ring-indigo-500'}`}
                disabled={isLoading || images.length === 0}
              />
               <SpeechToTextButton
                onTranscript={(transcript) => setPrompt(prev => `${prev ? prev + ' ' : ''}${transcript}`)}
                isInputDisabled={isLoading || images.length === 0}
              />
              <button
                onClick={handleAnalyze}
                disabled={isLoading || images.length === 0}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
              >
                {isLoading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            {promptError && <p className="text-red-400 text-sm mt-2">{promptError}</p>}
          </div>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Analysis Result</h3>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
          )}
          {response ? (
            <p className="whitespace-pre-wrap text-gray-200">{response}</p>
          ) : (
            !isLoading && <p className="text-gray-500">The AI's response will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionPanel;