import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.ts';
import { BrainIcon, EyeIcon, EyeSlashIcon } from './icons.tsx';

interface RegistrationPanelProps {
  onSwitchToLogin: (message: string) => void;
}

const PasswordRequirement: React.FC<{met: boolean; text: string}> = ({ met, text }) => (
    <li className={`flex items-center transition-colors ${met ? 'text-green-400' : 'text-gray-400'}`}>
        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            {met ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
        </svg>
        <span>{text}</span>
    </li>
);

const PasswordStrengthIndicator: React.FC<{ password?: string }> = ({ password = '' }) => {
    const checks = {
        length: password.length >= 4 && password.length <= 7,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password),
    };

    return (
        <ul className="text-xs mt-2 space-y-1">
            <PasswordRequirement met={checks.length} text="4 to 7 characters long" />
            <PasswordRequirement met={checks.uppercase} text="At least one uppercase letter" />
            <PasswordRequirement met={checks.lowercase} text="At least one lowercase letter" />
            <PasswordRequirement met={checks.number} text="At least one number" />
            <PasswordRequirement met={checks.special} text="At least one special character (@$!%*?&)" />
        </ul>
    );
};

const RegistrationPanel: React.FC<RegistrationPanelProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const appTitle = 'Leb Universal AI Brain';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    const passwordChecks = {
        length: password.length >= 4 && password.length <= 7,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password),
    };

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    if (!isPasswordValid) {
        setError('Please ensure your password meets all the requirements.');
        return;
    }
    
    setIsLoading(true);

    try {
      const result = await register(email, password);
      if (result.success) {
        onSwitchToLogin(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-2xl border border-gray-700/50">
        <div className="text-center">
            <BrainIcon className="w-16 h-16 mx-auto text-indigo-400" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
                Create an Account
            </h1>
            <p className="mt-2 text-sm text-gray-400">Join the {appTitle}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-300">Email address</label>
              <div className="mt-1">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-300 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-300 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {(isPasswordFocused || password.length > 0) && <PasswordStrengthIndicator password={password} />}
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">Confirm Password</label>
              <div className="mt-1 relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-300 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <button onClick={() => onSwitchToLogin('')} type="button" className="font-medium text-indigo-400 hover:text-indigo-300">
                Already have an account?
              </button>
            </div>
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
                'Sign Up'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPanel;