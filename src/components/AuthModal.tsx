import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'reset'; // Add 'reset' mode
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode); // Add 'reset' mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // For success/info messages
  
  // TODO: Add resetPassword function to authStore
  const { signIn, signUp, loading, resetPassword } = useAuthStore(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null); // Clear previous messages

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose(); // Close modal on successful sign in
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          throw new Error('Full name is required');
        }
        await signUp(email, password, fullName);
        setMessage('Sign up successful! Please check your email to verify your account.');
        // Don't close automatically on sign up, show message
      } else { // mode === 'reset'
        // TODO: Implement resetPassword in authStore
        if (resetPassword) {
            await resetPassword(email);
            setMessage('If an account exists for this email, a password reset link has been sent.');
            // Optionally switch back to signin mode or keep showing the message
            // setMode('signin'); 
        } else {
            throw new Error("Password reset functionality not available.");
        }
      }
      // Only close modal automatically on sign in
      // onClose(); 
    } catch (err) {
      if (err instanceof Error) {
        // Specific error handling for sign up
        if (err.message.includes('User already registered') || 
            err.message.includes('User already exists')) {
          setError('This email is already registered. Please sign in instead.');
          setMode('signin');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
        <button
          onClick={() => {
            // Reset state when closing
            setError(null);
            setMessage(null);
            setEmail('');
            setPassword('');
            setFullName('');
            setMode(initialMode); // Reset mode if needed, or just close
            onClose();
          }}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>

        {/* Display Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Display Success/Info Message */}
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sign Up specific field */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          {/* Email field (used in all modes) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password field (only for signin/signup) */}
          {mode !== 'reset' && (
            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              placeholder="••••••••"
              required={mode !== 'reset'} // Only required if not in reset mode
            />
            {/* Add Forgot Password link for signin mode */}
            {mode === 'signin' && (
              <div className="text-right mt-1">
                <button
                  type="button" // Important: type="button" to prevent form submission
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Forgot Password?
                </button>
              </div>
            )}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {loading
              ? 'Loading...'
              : mode === 'signin'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Create Account'
              : 'Send Reset Link'}
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        {mode !== 'reset' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        )}

        {/* Link back to Sign In from Reset Password */}
        {mode === 'reset' && (
           <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
