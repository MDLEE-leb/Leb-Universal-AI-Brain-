import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BrainIcon } from './icons';

interface PasswordRecoveryPanelProps {
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
}

const PasswordRecoveryPanel: React.FC<PasswordRecoveryPanelProps> = ({ onSwitchToLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { recoverPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    const result = await recoverPassword(email);
    // The result is always presented as successful to the user
    // to prevent email enumeration attacks.
    setMessage(result.message);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-2xl border border-gray-700/50">
        <div className="text-center">
            <BrainIcon className="w-16 h-16 mx-auto text-indigo-400" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
                Recover Password
            </h1>
            <p className="mt-2 text-sm text-gray-400">Enter your email to receive a recovery link.</p>
        </div>
        
        {message ? (
            <div className="text-center">
                <p className="text-green-300 bg-green-900/50 p-4 rounded-md border border-green-700/50">{message}</p>
                <button onClick={onSwitchToLogin} type="button" className="mt-6 font-medium text-indigo-400 hover:text-indigo-300">
                    &larr; Back to Sign In
                </button>
            </div>
        ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm">
                <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : (
                    'Send Recovery Link'
                )}
                </button>
            </div>
            <div className="text-center text-sm flex justify-between">
                <button onClick={onSwitchToLogin} type="button" className="font-medium text-indigo-400 hover:text-indigo-300">
                    Remembered your password?
                </button>
                 <button onClick={onSwitchToRegister} type="button" className="font-medium text-indigo-400 hover:text-indigo-300">
                    Create an account
                </button>
            </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default PasswordRecoveryPanel;