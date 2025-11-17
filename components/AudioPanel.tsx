import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';
import { VoiceOption } from '../types';
import { AudioIcon } from './icons';
import SpeechToTextButton from './SpeechToTextButton';

const AudioPanel: React.FC = () => {
  const [text, setText] = useState('');
  const [textError, setTextError] = useState<string | null>(null);
  const [voice, setVoice] = useState<VoiceOption>('Zephyr');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voices: VoiceOption[] = ['Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir'];

  const handleGenerateAndPlay = async () => {
    if (!text.trim()) {
      setTextError('Text cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setTextError(null);

    try {
      const audioData = await generateSpeech(text, voice);
      
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const decode = (base64: string) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      const decodeAudioData = async (
        data: Uint8Array,
        ctx: AudioContext,
        sampleRate: number,
        numChannels: number,
      ): Promise<AudioBuffer> => {
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
      };
      
      const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
      const source = outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContext.destination);
      source.start();

    } catch (err) {
      console.error('Error generating or playing speech:', err);
      setError('Failed to generate audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-white">Audio Brain</h2>
      </header>
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl bg-gray-900/50 p-8 rounded-lg border border-gray-700 shadow-2xl">
          <AudioIcon className="w-16 h-16 mx-auto mb-6 text-indigo-400" />
          <h3 className="text-xl font-semibold mb-4 text-center text-gray-300">Text-to-Speech</h3>
          
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (textError) setTextError(null);
              }}
              placeholder="Enter text to convert to speech..."
              className={`w-full h-40 p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none resize-none ${textError ? 'ring-2 ring-red-500' : 'focus:ring-2 focus:ring-indigo-500'}`}
              disabled={isLoading}
            />
            <div className="absolute bottom-2 right-2">
                <SpeechToTextButton
                    onTranscript={(transcript) => setText(prev => `${prev ? prev + ' ' : ''}${transcript}`)}
                    isInputDisabled={isLoading}
                />
            </div>
          </div>
          {textError && <p className="text-red-400 text-sm mt-2">{textError}</p>}

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label htmlFor="voice-select" className="block text-sm font-medium text-gray-400 mb-1">
                Select Voice
              </label>
              <select
                id="voice-select"
                value={voice}
                onChange={(e) => setVoice(e.target.value as VoiceOption)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {voices.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <button
              onClick={handleGenerateAndPlay}
              disabled={isLoading}
              className="w-full sm:w-auto mt-4 sm:mt-0 sm:self-end px-6 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate & Play'}
            </button>
          </div>
           {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default AudioPanel;