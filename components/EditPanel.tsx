import React, { useState, useRef, useEffect } from 'react';
import { editImage } from '../services/geminiService.js';
import { EditIcon } from './icons.js';
import SpeechToTextButton from './SpeechToTextButton.js';

const FILTERS: { [key: string]: string } = {
  none: 'None',
  'grayscale(100%)': 'Grayscale',
  'sepia(100%)': 'Sepia',
  'invert(100%)': 'Invert',
  'blur(4px)': 'Blur',
  'brightness(150%)': 'Brighten',
  'contrast(200%)': 'High Contrast',
};

const EditPanel: React.FC = () => {
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  const [originalImagePreviews, setOriginalImagePreviews] = useState<string[]>([]);
  const [editedImages, setEditedImages] = useState<string[]>([]);
  const [sliderValues, setSliderValues] = useState<number[]>([]);
  const [prompt, setPrompt] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      originalImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [originalImagePreviews]);

  const processFiles = (files: FileList | File[]) => {
    if (files && files.length > 0) {
      const imageFiles = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .slice(0, 6);

      if (imageFiles.length === 0) return;
      
      setOriginalImages(imageFiles);
      
      originalImagePreviews.forEach(url => URL.revokeObjectURL(url));
      const newPreviews = imageFiles.map(file => URL.createObjectURL(file as Blob));
      setOriginalImagePreviews(newPreviews);
      
      setEditedImages([]);
      setError(null);
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

  const fileToB64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setPromptError('Prompt cannot be empty.');
      return;
    }
    if (originalImages.length === 0) return;

    setIsLoading(true);
    setEditedImages([]);
    setError(null);
    setPromptError(null);
    setActiveFilter('none');
    
    try {
      const promises = originalImages.map(async (file) => {
        const base64Image = await fileToB64(file);
        const resultB64 = await editImage(prompt, base64Image, file.type);
        return `data:image/png;base64,${resultB64}`;
      });
      const results = await Promise.all(promises);
      setEditedImages(results);
      setSliderValues(new Array(results.length).fill(50));
    } catch (err) {
      console.error('Error editing images:', err);
      setError('Sorry, I was unable to edit one or more images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-white">Edit Brain</h2>
      </header>
      <div className="flex-1 p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
        <div className="flex flex-col bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div
            className={`flex-1 flex flex-col min-h-[200px] transition-colors ${
              isDragging ? 'bg-gray-700/50 rounded-lg' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {originalImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto p-2 bg-black/20 rounded-lg">
                    {originalImagePreviews.map((src, index) => (
                        <img key={index} src={src} alt={`Original ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                    ))}
                </div>
            ) : (
                <div
                    className={`flex-1 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging ? 'border-indigo-500' : 'border-gray-600 hover:border-indigo-500'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="text-center text-gray-500">
                        <EditIcon className="w-16 h-16 mx-auto mb-2" />
                        <p className="font-semibold">{isDragging ? 'Drop images here' : 'Click or drag & drop to upload'}</p>
                        <p className="text-sm">(Up to 6 images: PNG, JPG, WEBP)</p>
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
            {originalImages.length > 0 && (
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-center py-2 mt-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
                 >
                    Change Selection ({originalImages.length}/6)
                 </button>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center bg-gray-700 rounded-lg p-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (promptError) setPromptError(null);
                }}
                placeholder="How should I edit the image(s)?"
                className={`flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none px-2 ${promptError ? 'ring-2 ring-red-500 rounded-md' : 'focus:ring-2 focus:ring-indigo-500'}`}
                disabled={isLoading || originalImages.length === 0}
              />
              <SpeechToTextButton
                onTranscript={(transcript) => setPrompt(prev => `${prev ? prev + ' ' : ''}${transcript}`)}
                isInputDisabled={isLoading || originalImages.length === 0}
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading || originalImages.length === 0}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
            {promptError && <p className="text-red-400 text-sm mt-2">{promptError}</p>}
            {error && <p className="text-red-400 text-center mt-3">{error}</p>}
          </div>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-300">Edited Results</h3>
                {editedImages.length > 0 && !isLoading && (
                    <div className="flex items-center gap-2">
                    <label htmlFor="filter-select" className="text-sm font-medium text-gray-400">Filter:</label>
                    <select
                        id="filter-select"
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-md text-white text-sm p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {Object.entries(FILTERS).map(([value, name]) => (
                        <option key={value} value={value}>{name}</option>
                        ))}
                    </select>
                    </div>
                )}
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: originalImages.length }).map((_, i) => (
                    <div key={i} className="w-full aspect-square bg-gray-800 rounded-lg animate-pulse"></div>
                ))}
              </div>
            )}
            {editedImages.length > 0 && (
               <div className={`grid grid-cols-1 ${editedImages.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
                 {editedImages.map((editedSrc, index) => {
                    const sliderPosition = sliderValues[index] ?? 50;
                    const handleSliderChange = (value: number) => {
                        setSliderValues(currentValues => {
                            const newValues = [...currentValues];
                            newValues[index] = value;
                            return newValues;
                        });
                    };
                    
                    const imageStyle = { filter: activeFilter !== 'none' ? activeFilter : undefined };
        
                    return (
                        <div key={index} className="bg-gray-800/50 p-3 rounded-lg flex flex-col items-center">
                            <div className="relative w-full aspect-square overflow-hidden rounded-md group">
                                {/* Original Image (bottom layer) */}
                                <img
                                    src={originalImagePreviews[index]}
                                    alt={`Original ${index + 1}`}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    style={imageStyle}
                                />
                                {/* Edited Image (top layer, clipped) */}
                                <img
                                    src={editedSrc}
                                    alt={`Edited by AI ${index + 1}`}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    style={{
                                        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                                        ...imageStyle,
                                    }}
                                />
                                {/* Divider Line */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-indigo-400/70 pointer-events-none transition-all duration-100"
                                    style={{ left: `${sliderPosition}%` }}
                                >
                                    <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-4 h-4 rounded-full bg-indigo-400 border-2 border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                            <div className="w-full mt-3">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={sliderPosition}
                                    onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    aria-label="Image comparison slider"
                                />
                                <div className="w-full text-center text-xs text-gray-400 mt-1 px-1 flex justify-between">
                                    <span>Original</span>
                                    <span>Edited</span>
                                </div>
                            </div>
                        </div>
                    );
                 })}
               </div>
            )}
            {!isLoading && editedImages.length === 0 && (
               <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                  <EditIcon className="w-24 h-24 mx-auto mb-4" />
                  <p>The edited image(s) will appear here.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EditPanel;