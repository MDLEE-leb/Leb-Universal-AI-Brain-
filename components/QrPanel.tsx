
import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { QrCodeIcon } from './icons';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

const QrPanel: React.FC = () => {
  const [text, setText] = useState('https://aistudio.google.com/');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<ErrorCorrectionLevel>('M');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateQrCode = useCallback(async () => {
    if (!text.trim()) {
      setQrCodeDataUrl('');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const options = {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel,
      };
      const dataUrl = await QRCode.toDataURL(text, options);
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code', err);
      setError('Could not generate QR code. The text may be too long for the selected error correction level.');
      setQrCodeDataUrl('');
    } finally {
      setIsLoading(false);
    }
  }, [text, size, fgColor, bgColor, errorCorrectionLevel]);

  useEffect(() => {
    generateQrCode();
  }, [generateQrCode]);
  
  const handleDownload = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-white">QR Code Brain</h2>
      </header>
      <div className="flex-1 p-6 grid md:grid-cols-2 gap-6 overflow-y-auto">
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex flex-col gap-6">
          <div>
            <label htmlFor="qr-text" className="block text-sm font-medium text-gray-300 mb-2">Text or URL</label>
            <textarea
              id="qr-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text or URL to encode"
              className="w-full h-28 p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none resize-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="qr-size" className="block text-sm font-medium text-gray-300 mb-2">Size: {size}px</label>
            <input
              id="qr-size"
              type="range"
              min="128"
              max="1024"
              step="32"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="qr-fg-color" className="block text-sm font-medium text-gray-300 mb-2">Dot Color</label>
              <input
                id="qr-fg-color"
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="qr-bg-color" className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
              <input
                id="qr-bg-color"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="qr-error-correction" className="block text-sm font-medium text-gray-300 mb-2">Error Correction</label>
            <select
              id="qr-error-correction"
              value={errorCorrectionLevel}
              onChange={(e) => setErrorCorrectionLevel(e.target.value as ErrorCorrectionLevel)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="L">Low (L)</option>
              <option value="M">Medium (M)</option>
              <option value="Q">Quartile (Q)</option>
              <option value="H">High (H)</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Preview</h3>
            <div className="w-full max-w-sm aspect-square bg-gray-700 rounded-lg flex items-center justify-center p-4">
              {isLoading ? (
                 <div className="w-12 h-12 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
              ) : qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Generated QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-500">
                  <QrCodeIcon className="w-24 h-24 mx-auto mb-4" />
                  <p>{error || 'Enter text to generate a QR code'}</p>
                </div>
              )}
            </div>
            <button
                onClick={handleDownload}
                disabled={!qrCodeDataUrl || isLoading}
                className="w-full max-w-sm mt-6 px-6 py-2 rounded-md bg-indigo-600 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
            >
                Download PNG
            </button>
        </div>
      </div>
    </div>
  );
};

export default QrPanel;