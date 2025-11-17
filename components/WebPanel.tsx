import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import { SendIcon, CodeIcon, VisionIcon } from './icons';
import SpeechToTextButton from './SpeechToTextButton';

const WebPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Preview</title>
</head>
<body class="bg-white flex items-center justify-center h-screen">
  <div class="text-center p-4">
    <h1 class="text-4xl font-bold text-gray-800">HTML Brain</h1>
    <p class="text-gray-600 mt-2">Your live preview will appear here. Describe a webpage below to get started!</p>
  </div>
</body>
</html>`);
  const [isLoading, setIsLoading] = useState(false);
  const [modelName, setModelName] = useState('gemini-2.5-pro');
  const availableModels = ['gemini-2.5-pro', 'gemini-2.5-flash'];
  
  const systemInstruction = "You are an expert web developer specializing in Tailwind CSS. Generate a single, complete, and responsive HTML file. The HTML should include a <style> tag in the <head> for any custom CSS, but prefer Tailwind classes for all styling. The entire response must be a single HTML code block with the language identifier. For example: ```html\n<!DOCTYPE html>...</html>\n```";

  const extractHtmlFromResponse = (text: string): string => {
    const match = text.match(/```html\n([\s\S]*?)```/);
    if (match && match[1]) {
      return match[1].trim();
    }
    const fallbackMatch = text.match(/```([\s\S]*?)```/);
    if (fallbackMatch && fallbackMatch[1]) {
        return fallbackMatch[1].trim();
    }
    return text;
  };
  
  const handleGenerate = async () => {
    if (prompt.trim() === '' || isLoading) return;
    
    setIsLoading(true);
    try {
      const aiResponseText = await generateText(prompt, modelName, systemInstruction, []);
      const extractedCode = extractHtmlFromResponse(aiResponseText);
      setCode(extractedCode);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Error generating HTML:', error);
        setCode(`<!-- Error generating HTML. Please try again. \n\n${errorMessage} -->`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-4 border-b border-gray-700/50 flex justify-between items-center flex-shrink-0">
        <h2 className="text-2xl font-bold text-white">HTML Brain</h2>
        <div className="flex items-center gap-2">
            <label htmlFor="model-select" className="text-sm font-medium text-gray-400">
                AI Model
            </label>
            <select
                id="model-select"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                disabled={isLoading}
                className="bg-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 overflow-hidden">
        <div className="flex flex-col bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-gray-800/70 flex-shrink-0">
                <CodeIcon className="w-5 h-5 text-gray-400"/>
                <h3 className="text-sm font-semibold text-gray-300">Code Editor</h3>
            </div>
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Your HTML code..."
                className="flex-1 w-full p-3 bg-gray-900 text-cyan-300 font-mono text-sm focus:outline-none resize-none"
                spellCheck="false"
            />
        </div>

        <div className="flex flex-col bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-gray-800/70 flex-shrink-0">
                <VisionIcon className="w-5 h-5 text-gray-400"/>
                <h3 className="text-sm font-semibold text-gray-300">Live Preview</h3>
            </div>
            <iframe
                srcDoc={code}
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
                className="flex-1 w-full h-full bg-white"
            />
        </div>
      </main>

      <footer className="p-4 border-t border-gray-700/50 flex-shrink-0">
        <div className="flex items-center bg-gray-700 rounded-lg p-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe the web page you want to create..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none px-2"
            disabled={isLoading}
          />
          <SpeechToTextButton 
            onTranscript={(transcript) => setPrompt(prev => `${prev ? prev + ' ' : ''}${transcript}`)}
            isInputDisabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || prompt.trim() === ''}
            className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
            aria-label="Generate HTML"
          >
            {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            ) : (
                <SendIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default WebPanel;
