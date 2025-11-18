

import React, { useState, useRef, useEffect } from 'react';
import { generateText, generateSpeech } from '../services/geminiService.ts';
import { ChatMessage, MessageAuthor } from '../types.ts';
import { BrainIcon, SendIcon, TrashIcon, CopyIcon, CheckIcon, PaperClipIcon, XCircleIcon, AudioIcon, StopCircleIcon } from './icons.tsx';
import SpeechToTextButton from './SpeechToTextButton.tsx';

interface ChatPanelProps {
  modelName: string;
  setModelName?: (model: string) => void;
  availableModels?: string[];
  systemInstruction: string;
  setSystemInstruction?: (instruction: string) => void;
  showSystemInstructionInput?: boolean;
  title: string;
  placeholder: string;
  allowImageUpload?: boolean;
}

const CodeBlock: React.FC<{ text: string }> = ({ text }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    const content = text.startsWith('```') && text.endsWith('```') ? text.slice(3, -3) : text;
    const firstLineEnd = content.indexOf('\n');
    let language = '';
    let code = '';

    if (firstLineEnd !== -1 && !content.substring(0, firstLineEnd).trim().includes(' ')) {
        language = content.substring(0, firstLineEnd).trim();
        code = content.substring(firstLineEnd + 1);
    } else {
        code = content;
        language = 'code'; 
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => console.error('Failed to copy text: ', err));
    };

    return (
        <div className="bg-gray-950 rounded-lg my-2 overflow-hidden border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-xs text-gray-400">
                <span className="font-mono uppercase bg-gray-700 px-2 py-0.5 rounded-md text-gray-300">{language}</span>
                <button 
                    onClick={handleCopy}
                    className="font-sans p-1.5 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-gray-300"
                    aria-label="Copy code"
                >
                    {isCopied ? (
                        <>
                            <CheckIcon className="h-4 w-4 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <CopyIcon className="h-4 w-4" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm bg-black/30"><code className="font-mono text-cyan-300">{code}</code></pre>
        </div>
    );
};


const ChatPanel: React.FC<ChatPanelProps> = ({ modelName, setModelName, availableModels, systemInstruction, setSystemInstruction, showSystemInstructionInput, title, placeholder, allowImageUpload }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    // Cleanup object URLs and audio
    return () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        messages.forEach(msg => {
            if (msg.image?.url) URL.revokeObjectURL(msg.image.url);
        });
        if (audioSourceRef.current) audioSourceRef.current.stop();
        if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
    };
  }, [imagePreview, messages]);

  const handleClearChat = () => {
    messages.forEach(msg => {
        if (msg.image && msg.image.url) URL.revokeObjectURL(msg.image.url);
    });
    setMessages([]);
    handleStopAudio();
  };
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSystemInstructionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setSystemInstruction) setSystemInstruction(e.target.value);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setModelName) {
      setModelName(e.target.value);
      handleClearChat();
    }
  };

  const handleStopAudio = () => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
    }
    setPlayingMessageIndex(null);
  };

  const handlePlayAudio = async (text: string, index: number) => {
    if (playingMessageIndex === index) {
        handleStopAudio();
        return;
    }
    if (loadingAudioIndex !== null) return;

    handleStopAudio();
    setLoadingAudioIndex(index);

    try {
        const audioData = await generateSpeech(text.replace(/```[\s\S]*?```/g, 'Code block.'), 'Zephyr');
        
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const context = audioContextRef.current;

        const decode = (base64: string) => {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        };

        const decodeAudioData = async (data: Uint8Array): Promise<AudioBuffer> => {
            const dataInt16 = new Int16Array(data.buffer);
            const frameCount = dataInt16.length;
            const buffer = context.createBuffer(1, frameCount, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i] / 32768.0;
            }
            return buffer;
        };
        
        const audioBuffer = await decodeAudioData(decode(audioData));
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);
        source.onended = () => {
            if (playingMessageIndex === index) {
                handleStopAudio();
            }
        };
        source.start();
        audioSourceRef.current = source;
        setPlayingMessageIndex(index);

    } catch (err) {
        console.error('Error generating or playing speech:', err);
    } finally {
        setLoadingAudioIndex(null);
    }
  };

  const handleSend = async () => {
    if ((input.trim() === '' && !imageFile) || isLoading) return;
    handleStopAudio();
    const userMessage: ChatMessage = { 
        author: MessageAuthor.USER, 
        text: input,
        image: imageFile && imagePreview ? { url: imagePreview, file: imageFile } : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    const currentImageFile = imageFile;
    const aiMessageIndex = messages.length + 1;

    setInput('');
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    
    setIsLoading(true);

    try {
      const aiResponseText = await generateText(currentInput, modelName, systemInstruction, messages, currentImageFile);
      const aiMessage: ChatMessage = { author: MessageAuthor.AI, text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);

      if (isTtsEnabled && aiResponseText) {
        handlePlayAudio(aiResponseText, aiMessageIndex);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: ChatMessage = { author: MessageAuthor.AI, text: 'Sorry, something went wrong. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g).filter(Boolean);

    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        return <CodeBlock key={i} text={part} />;
      }
      return <div key={i} className="whitespace-pre-wrap p-4">{part}</div>;
    });
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.author === MessageAuthor.USER;
    
    return (
      <div key={index} className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} mb-4 gap-2`}>
        {!isUser && (
             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mt-1">
                <BrainIcon className="w-5 h-5 text-indigo-300" />
             </div>
        )}
        <div className={`rounded-lg shadow-md ${isUser ? 'bg-indigo-600 text-white max-w-xl' : 'bg-gray-700 text-gray-200 max-w-3xl w-full'}`}>
           {isUser ? (
             <div className="flex flex-col">
               {msg.image && (
                 <img src={msg.image.url} alt="User upload" className="rounded-t-lg max-h-80 w-auto object-contain bg-black/20" />
               )}
               {msg.text && <p className="whitespace-pre-wrap p-4">{msg.text}</p>}
             </div>
           ) : renderMessageContent(msg.text)}
        </div>
        {!isUser && msg.text && (
            <button
                onClick={() => handlePlayAudio(msg.text, index)}
                disabled={loadingAudioIndex !== null}
                className="p-2 mt-1 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-center"
                aria-label="Play message audio"
            >
                {loadingAudioIndex === index ? (
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : playingMessageIndex === index ? (
                    <StopCircleIcon className="w-5 h-5 text-red-400" />
                ) : (
                    <AudioIcon className="w-5 h-5" />
                )}
            </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-4 border-b border-gray-700/50">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <label htmlFor="tts-toggle" className="text-sm font-medium text-gray-400 whitespace-nowrap">
                    Auto-Speak AI
                </label>
                <button
                    id="tts-toggle"
                    onClick={() => {
                        const newTtsState = !isTtsEnabled;
                        setIsTtsEnabled(newTtsState);
                        if (!newTtsState) {
                            handleStopAudio();
                        }
                    }}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
                        isTtsEnabled ? 'bg-indigo-600' : 'bg-gray-600'
                    }`}
                    aria-pressed={isTtsEnabled}
                >
                    <span className="sr-only">Enable Auto-Speak AI</span>
                    <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        isTtsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
            <button
                onClick={handleClearChat}
                disabled={messages.length === 0}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                aria-label="Clear chat"
            >
                <TrashIcon className="w-6 h-6" />
            </button>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {showSystemInstructionInput && (
            <div>
              <label htmlFor="system-instruction" className="block text-sm font-medium text-gray-400 mb-1">
                System Instruction (persona)
              </label>
              <div className="relative flex items-center">
                <input
                  id="system-instruction"
                  type="text"
                  value={systemInstruction}
                  onChange={handleSystemInstructionChange}
                  placeholder="e.g., You are a pirate who says 'Ahoy!'"
                  className="w-full bg-gray-700 rounded-md p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                />
                 <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                    <SpeechToTextButton
                        onTranscript={(transcript) => {
                            if (setSystemInstruction) {
                                // Fix: Use the `systemInstruction` prop for concatenation instead of a functional update
                                // to match the prop type `(instruction: string) => void`.
                                setSystemInstruction(`${systemInstruction ? systemInstruction + ' ' : ''}${transcript}`);
                            }
                        }}
                    />
                </div>
              </div>
            </div>
          )}
          {availableModels && setModelName && (
            <div>
              <label htmlFor="model-select" className="block text-sm font-medium text-gray-400 mb-1">
                AI Model
              </label>
              <select
                id="model-select"
                value={modelName}
                onChange={handleModelChange}
                className="w-full bg-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
        </div>
      </header>
      <div className="flex-1 p-6 overflow-y-auto">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <BrainIcon className="w-24 h-24 mb-4" />
            <p>Start the conversation</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="max-w-xl p-4 rounded-lg shadow-md bg-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700/50">
        {imagePreview && (
            <div className="relative inline-block mb-2 group">
                <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-md border-2 border-gray-600"/>
                <button 
                    onClick={handleRemoveImage} 
                    className="absolute -top-2 -right-2 bg-gray-900 rounded-full text-gray-400 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
                    aria-label="Remove image"
                >
                    <XCircleIcon className="h-6 w-6" />
                </button>
            </div>
        )}
        <div className="flex items-center bg-gray-700 rounded-lg p-2">
          {allowImageUpload && (
            <>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isLoading}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                    aria-label="Attach image"
                >
                    <PaperClipIcon className="w-6 h-6" />
                </button>
            </>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none px-2"
            disabled={isLoading}
          />
          <SpeechToTextButton 
            onTranscript={(transcript) => setInput(prev => `${prev ? prev + ' ' : ''}${transcript}`)}
            isInputDisabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (input.trim() === '' && !imageFile)}
            className="p-2 rounded-full bg-indigo-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
