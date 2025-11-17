import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon } from './icons';

// Fix: Add type definitions for the Web Speech API to resolve "Cannot find name 'SpeechRecognition'".
// These interfaces are based on the standard Web Speech API for browser compatibility.
interface SpeechRecognitionErrorEvent {
  readonly error: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionResult extends ReadonlyArray<SpeechRecognitionAlternative> {}

interface SpeechRecognitionResultList extends ReadonlyArray<SpeechRecognitionResult> {}

interface SpeechRecognitionEvent {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechToTextButtonProps {
  onTranscript: (transcript: string) => void;
  isInputDisabled?: boolean;
}

const isBrowser = typeof window !== 'undefined';
const SpeechRecognitionAPI = isBrowser ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({ onTranscript, isInputDisabled }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const newTranscript = event.results[event.results.length - 1][0].transcript;
      if (newTranscript) {
        onTranscript(newTranscript.trim());
      }
    };

    recognition.onstart = () => {
        setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const handleToggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch(e) {
        console.error("Error starting speech recognition:", e);
      }
    }
  };
  
  if (!SpeechRecognitionAPI) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      disabled={isInputDisabled}
      className={`p-2 rounded-full transition-colors focus:outline-none ${
        isListening 
          ? 'text-red-500 bg-red-500/20 animate-pulse' 
          : 'text-gray-400 hover:bg-gray-600 hover:text-white'
      } disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      <MicrophoneIcon className="w-6 h-6" />
    </button>
  );
};

export default SpeechToTextButton;
