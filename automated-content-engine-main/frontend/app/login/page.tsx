'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDarkMode } from '../../src/components/DarkModeProvider';
import { useAuth } from '../../src/components/AuthProvider';
import { apiClient } from '../../src/utils/apiClient';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useDarkMode();
  const { login } = useAuth();

  const performLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      interface LoginResponse {
        access_token: string;
      }

      console.log('Sending login request with:', { username, password });
      
      const data = await apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response:', data);
      
      // Use the login function from AuthProvider
      login(data.access_token);
      console.log('Logged in successfully, token stored');
      // Navigation will be handled by the AuthProvider
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    console.log('Form submit event triggered');
    e.preventDefault();
    performLogin();
  };

  // Button click handler for enhanced compatibility
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('Button click event triggered');
    e.preventDefault();
    performLogin();
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'
    }`}>
      <div className={`w-full max-w-md p-8 rounded-xl shadow-lg transition-all duration-200 ${
        isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display text-lg">V</div>
            <span className={`text-2xl font-display group-hover:text-primary transition-colors ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              VyraLab
            </span>
          </div>
        </div>
        
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white mb-3">Automated Content Engine</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to your account</p>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-800 focus:bg-gray-50'
              }`}
              placeholder="Enter your username"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-800 focus:bg-gray-50'
              }`}
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="button" 
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-3 px-4 rounded-md text-base font-medium 
              text-white bg-primary relative overflow-hidden
              border border-gray-300 dark:border-gray-700 
              shadow-md hover:shadow-xl 
              hover:-translate-y-1 
              transition-all duration-200
              hover:bg-purple-700 dark:hover:bg-purple-800
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
            `}
            onClick={handleButtonClick}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <svg className="ml-2 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </>
            )}
            
            {/* Add a gradient border at the bottom that appears on hover */}
            <div className="absolute bottom-0 left-0 w-full h-2 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left shadow-lg"></div>
          </button>
        </form>
      </div>
    </div>
  );
} 