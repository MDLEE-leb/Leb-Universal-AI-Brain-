import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenaiBlob, LiveSession } from '@google/genai';
import { LiveIcon, UserCircleIcon, BrainIcon, StopCircleIcon } from './icons.tsx';

// --- Audio Helper Functions from Gemini Documentation ---

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): GenaiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

// --- Component ---

interface Transcript {
  author: 'user' | 'ai';
  text: string;
}

const LivePanel: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    
    const currentUserInputRef = useRef('');
    const currentAiOutputRef = useRef('');
    const [_, setRenderTrigger] = useState(0); // Used to force re-renders for interim transcripts
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts, _]);

    const forceRender = () => setRenderTrigger(v => v + 1);
    
    const cleanup = () => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (inputAudioContextRef.current?.state !== 'closed') {
            inputAudioContextRef.current?.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current?.state !== 'closed') {
            outputAudioContextRef.current?.close();
            outputAudioContextRef.current = null;
        }
        outputSourcesRef.current.forEach(source => source.stop());
        outputSourcesRef.current.clear();
        sessionPromiseRef.current = null;
        setStatus('idle');
    };

    useEffect(() => {
        return cleanup;
    }, []);
    
    const handleConnect = async () => {
        setStatus('connecting');
        setTranscripts([]);
        setErrorMessage('');
        currentUserInputRef.current = '';
        currentAiOutputRef.current = '';
        forceRender();

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setStatus('connected');
                        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            currentAiOutputRef.current += message.serverContent.outputTranscription.text;
                            forceRender();
                        } else if (message.serverContent?.inputTranscription) {
                            currentUserInputRef.current += message.serverContent.inputTranscription.text;
                            forceRender();
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentUserInputRef.current;
                            const fullOutput = currentAiOutputRef.current;
                            
                            // Fix: Explicitly type new entries to match the Transcript[] state type, resolving the type inference issue.
                            const newEntries: Transcript[] = [];
                            if (fullInput) {
                                newEntries.push({ author: 'user', text: fullInput });
                            }
                            if (fullOutput) {
                                newEntries.push({ author: 'ai', text: fullOutput });
                            }

                            if (newEntries.length > 0) {
                                setTranscripts(prev => [...prev, ...newEntries]);
                            }
                            
                            currentUserInputRef.current = '';
                            currentAiOutputRef.current = '';
                            forceRender();
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            const outputContext = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
                            
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputContext, 24000, 1);
                            
                            const source = outputContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContext.destination);
                            source.addEventListener('ended', () => {
                                outputSourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            outputSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setErrorMessage('A connection error occurred. Please try again.');
                        setStatus('error');
                        cleanup();
                    },
                    onclose: (e: CloseEvent) => {
                        cleanup();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                },
            });
        } catch (error) {
            console.error('Failed to start live session:', error);
            setErrorMessage('Could not start the conversation. Check microphone permissions and try again.');
            setStatus('error');
            cleanup();
        }
    };
    
    const handleDisconnect = () => {
        sessionPromiseRef.current?.then(session => session.close());
    };
    
    const renderTranscript = (transcript: Transcript, index: React.Key, isInterim: boolean) => (
      <div key={index} className={`flex items-start gap-3 mb-4 ${isInterim ? 'opacity-60' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mt-1">
            {transcript.author === 'user' ? <UserCircleIcon className="w-5 h-5 text-indigo-300" /> : <BrainIcon className="w-5 h-5 text-indigo-300" />}
        </div>
        <div className={`rounded-lg shadow-md p-4 ${transcript.author === 'user' ? 'bg-indigo-600/80 text-white' : 'bg-gray-700 text-gray-200'}`}>
            <p className="whitespace-pre-wrap">{transcript.text}</p>
        </div>
      </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-800">
            <header className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Live Brain</h2>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full transition-colors ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-gray-400 capitalize">{status}</span>
                </div>
            </header>
            
            <div className="flex-1 p-6 overflow-y-auto">
                {transcripts.length === 0 && !currentUserInputRef.current && status !== 'connecting' && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <LiveIcon className="w-24 h-24 mb-4" />
                        <p className="text-lg">Ready for a conversation</p>
                        <p className="text-sm">Click "Start Conversation" below to begin.</p>
                    </div>
                )}
                {transcripts.map((t, i) => renderTranscript(t, i, false))}
                {currentUserInputRef.current && renderTranscript({ author: 'user', text: currentUserInputRef.current }, 'interim-user', true)}
                {currentAiOutputRef.current && renderTranscript({ author: 'ai', text: currentAiOutputRef.current }, 'interim-ai', true)}
                <div ref={transcriptEndRef} />
            </div>

            <footer className="p-4 border-t border-gray-700/50 flex flex-col items-center gap-3">
                {status === 'idle' || status === 'error' ? (
                    <button onClick={handleConnect} className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors">
                        <LiveIcon className="w-6 h-6" />
                        Start Conversation
                    </button>
                ) : (
                    <button onClick={handleDisconnect} className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors">
                        <StopCircleIcon className="w-6 h-6" />
                        End Conversation
                    </button>
                )}
                {status === 'error' && <p className="text-red-400 text-sm mt-2 text-center">{errorMessage}</p>}
                {status === 'connecting' && <p className="text-gray-400 text-sm">Connecting...</p>}
            </footer>
        </div>
    );
};

export default LivePanel;