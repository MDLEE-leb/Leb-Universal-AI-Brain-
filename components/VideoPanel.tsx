

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { VideoIcon } from './icons.tsx';
import SpeechToTextButton from './SpeechToTextButton.tsx';

const loadingMessages = [
    "Warming up the video generators...",
    "Assembling pixels into a narrative...",
    "Rendering the initial frames...",
    "Adding a touch of cinematic magic...",
    "Syncing audio and visuals...",
    "This is taking a bit longer than usual, but good things take time!",
    "Polishing the final cut...",
    "Almost there, preparing for the premiere..."
];

const VideoPanel: React.FC = () => {
    const [prompt, setPrompt] = useState('A neon hologram of a cat driving at top speed');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [resolution, setResolution] = useState('720p');
    
    const [status, setStatus] = useState<'idle' | 'generating' | 'polling' | 'success' | 'error'>('idle');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [isKeyCheckLoading, setIsKeyCheckLoading] = useState(true);

    const videoUrlRef = useRef<string | null>(null);

    useEffect(() => {
        const checkApiKey = async () => {
            if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
                setIsKeyCheckLoading(true);
                try {
                    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                    setApiKeySelected(hasKey);
                } catch (e) {
                    console.error("Error checking for API key", e);
                    setApiKeySelected(false);
                } finally {
                    setIsKeyCheckLoading(false);
                }
            } else {
                console.warn("aistudio API not found. Assuming API key is set via environment.");
                setApiKeySelected(true);
                setIsKeyCheckLoading(false);
            }
        };
        checkApiKey();
    }, []);

    useEffect(() => {
        return () => {
            if (videoUrlRef.current) {
                URL.revokeObjectURL(videoUrlRef.current);
                videoUrlRef.current = null;
            }
        };
    }, []);

    const handleSelectKey = async () => {
        try {
            await (window as any).aistudio.openSelectKey();
            setApiKeySelected(true);
            setErrorMessage('');
        } catch (e) {
            console.error("Could not open API key selection dialog", e);
            setErrorMessage("Failed to open the API key selection dialog.");
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setErrorMessage('Please enter a prompt.');
            return;
        }

        if (videoUrlRef.current) {
            URL.revokeObjectURL(videoUrlRef.current);
            videoUrlRef.current = null;
        }

        setStatus('generating');
        setGeneratedVideoUrl(null);
        setErrorMessage('');
        setLoadingMessage(loadingMessages[0]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: resolution as '720p' | '1080p',
                    aspectRatio: aspectRatio as '16:9' | '9:16',
                }
            });

            setStatus('polling');
            let messageIndex = 1;
            const updateMessage = () => {
                setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
                messageIndex++;
            };
            updateMessage();
            const intervalId = setInterval(updateMessage, 8000);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation });
            }

            clearInterval(intervalId);

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink && process.env.API_KEY) {
                const videoUrlWithKey = `${downloadLink}&key=${process.env.API_KEY}`;
                const response = await fetch(videoUrlWithKey);
                if (!response.ok) throw new Error(`Failed to fetch video data: ${response.statusText}`);
                const videoBlob = await response.blob();
                const objectUrl = URL.createObjectURL(videoBlob);
                videoUrlRef.current = objectUrl;
                setGeneratedVideoUrl(objectUrl);
                setStatus('success');
            } else {
                throw new Error("Video generation completed, but no download link was provided or API key is missing.");
            }

        } catch (error: any) {
            console.error('Error generating video:', error);
            const errorText = error.message || 'An unknown error occurred.';
            if (errorText.includes("Requested entity was not found")) {
                setErrorMessage("Your API key may be invalid. Please select a valid key and try again.");
                setApiKeySelected(false);
            } else {
                setErrorMessage(`Failed to generate video. Please try again. Error: ${errorText}`);
            }
            setStatus('error');
        }
    };

    const renderApiKeyPrompt = () => (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10 p-4">
            <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg text-center max-w-lg shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-4">API Key Required</h3>
                <p className="text-gray-400 mb-6">
                    Video generation with Veo requires a project with billing enabled. Please select an API key associated with a valid project to continue.
                </p>
                <button
                    onClick={handleSelectKey}
                    className="w-full px-6 py-3 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
                >
                    Select API Key
                </button>
                <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block mt-4 text-sm text-indigo-400 hover:text-indigo-300"
                >
                    Learn more about billing
                </a>
                 {errorMessage && <p className="text-red-400 text-sm mt-4">{errorMessage}</p>}
            </div>
        </div>
    );
    
    if (isKeyCheckLoading) {
        return (
            <div className="flex flex-col h-full bg-gray-800 items-center justify-center">
                 <div className="w-12 h-12 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="relative flex flex-col h-full bg-gray-800">
            {!apiKeySelected && renderApiKeyPrompt()}
            <header className="p-4 border-b border-gray-700/50">
                <h2 className="text-2xl font-bold text-white">Video Brain</h2>
            </header>
            <div className={`flex-1 p-6 grid md:grid-cols-2 gap-6 overflow-y-auto transition-opacity duration-300 ${!apiKeySelected ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                <div className="flex flex-col bg-gray-900/50 p-6 rounded-lg border border-gray-700 shadow-2xl">
                    <h3 className="text-xl font-semibold mb-4 text-gray-300">Video Generation</h3>
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the video you want to create..."
                            className="w-full h-40 p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none resize-none focus:ring-2 focus:ring-indigo-500"
                            disabled={status === 'generating' || status === 'polling'}
                        />
                        <div className="absolute bottom-2 right-2">
                            <SpeechToTextButton
                                onTranscript={(transcript) => setPrompt(prev => `${prev ? prev + ' ' : ''}${transcript}`)}
                                isInputDisabled={status === 'generating' || status === 'polling'}
                            />
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="aspect-ratio-select" className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
                            <select
                                id="aspect-ratio-select"
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={status === 'generating' || status === 'polling'}
                            >
                                <option value="16:9">16:9 (Landscape)</option>
                                <option value="9:16">9:16 (Portrait)</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="resolution-select" className="block text-sm font-medium text-gray-400 mb-1">Resolution</label>
                            <select
                                id="resolution-select"
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={status === 'generating' || status === 'polling'}
                            >
                                <option value="720p">720p</option>
                                <option value="1080p">1080p</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={status === 'generating' || status === 'polling'}
                        className="w-full mt-4 px-6 py-3 rounded-md bg-indigo-600 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
                    >
                        {status === 'generating' || status === 'polling' ? 'Generating...' : 'Generate Video'}
                    </button>
                    {errorMessage && status === 'error' && <p className="text-red-400 text-center mt-4">{errorMessage}</p>}
                </div>
                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex items-center justify-center">
                    {status === 'generating' || status === 'polling' ? (
                        <div className="text-center text-gray-400">
                            <div className="w-12 h-12 border-4 border-white/50 border-t-white rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-lg font-semibold text-gray-300">Generating your video</p>
                            <p className="mt-2 text-sm">{loadingMessage}</p>
                            <p className="mt-1 text-xs text-gray-500">(This can take a few minutes)</p>
                        </div>
                    ) : generatedVideoUrl ? (
                        <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
                    ) : (
                        <div className="text-center text-gray-500">
                            <VideoIcon className="w-24 h-24 mx-auto mb-4" />
                            <p>The generated video will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoPanel;