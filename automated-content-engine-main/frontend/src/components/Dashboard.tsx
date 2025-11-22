import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  // Default username since user data is not available in AuthProvider
  const username = "Ali";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Main Heading Section - Center Aligned */}
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white mb-3">Automated Content Engine</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">Streamline your ghostwriting process with AI-powered X thread creation.</p>
        <h2 className="text-xl font-medium text-gray-800 dark:text-primary-light mt-8">Welcome back, {username} 👋</h2>
        <h2 className="text-xl font-medium text-gray-800 dark:text-primary-light">What would you like to work on today?</h2>
      </div>
      
      <div className="space-y-6 mt-4">
        <div className="grid grid-cols-1 gap-6">
          <FeatureCard
            icon={
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            }
            title="Client Management"
            description="Add, edit, and delete client profiles with detailed information about their business, goals, and niche areas."
            href="/clients"
            color="indigo"
          />
          
          {/* Enhanced Thread Writer Card */}
          <FeatureCard
            icon={
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
              </div>
            }
            title="Thread Writer"
            description="Create engaging, research-backed X threads in minutes. Our step-by-step wizard guides you through client selection, topic research, angle generation, and thread crafting - all optimized for maximum engagement."
            href="/thread-writer"
            color="indigo"
          />
          
          <FeatureCard
            icon={
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22a8 8 0 0 0 8-8 4 4 0 0 0-4-4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0-4 4 8 8 0 0 0 8 8z"></path>
                </svg>
              </div>
            }
            title="Hook Polisher"
            description="Refine hooks based on clarity, engagement, and tone. Get expert critique and suggestions from the swipe file."
            href="/hooks"
            color="indigo"
          />
          
          <FeatureCard
            icon={
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"></path>
                  <path d="M15 3v6l-3-3-3 3V3"></path>
                </svg>
              </div>
            }
            title="Thread → LinkedIn Post Generator"
            description="Transform your content into engaging LinkedIn posts"
            href="/linkedin-posts"
            color="indigo"
          />
        </div>
      </div>
    </div>
  );
}

// Feature Card Component - Redesigned with modern look and higher contrast
function FeatureCard({ 
  icon, 
  title, 
  description, 
  href, 
  color = "purple",
  featured = false,
  tag
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  href: string; 
  color?: string;
  featured?: boolean;
  tag?: string;
}) {
  const getColorClasses = (colorName: string) => {
    const colorMap: Record<string, {bg: string, hover: string, border: string, text: string, dark: {bg: string, border: string, text: string}}> = {
      purple: {
        bg: 'bg-purple-50',
        hover: 'hover:bg-purple-100 hover:border-purple-300',
        border: 'border-purple-200',
        text: 'text-purple-600',
        dark: {
          bg: 'dark:bg-purple-900/30',
          border: 'dark:border-purple-700',
          text: 'dark:text-purple-400'
        }
      },
      blue: {
        bg: 'bg-blue-50',
        hover: 'hover:bg-blue-100 hover:border-blue-300',
        border: 'border-blue-200',
        text: 'text-blue-600',
        dark: {
          bg: 'dark:bg-blue-900/30',
          border: 'dark:border-blue-700',
          text: 'dark:text-blue-400'
        }
      },
      indigo: {
        bg: 'bg-indigo-50',
        hover: 'hover:bg-indigo-100 hover:border-indigo-300',
        border: 'border-indigo-200',
        text: 'text-indigo-600',
        dark: {
          bg: 'dark:bg-indigo-900/30',
          border: 'dark:border-indigo-700',
          text: 'dark:text-indigo-400'
        }
      }
    };
    
    return colorMap[colorName] || colorMap.purple;
  };
  
  const colorClasses = getColorClasses(color);
  
  return (
    <Link href={href} className="group block">
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border-1 dark:border-1 border-gray-300 dark:border-gray-700 p-6 relative ${featured ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-indigo-400/30' : ''} ${colorClasses.hover} hover:shadow-xl dark:hover:border-indigo-500 hover:-translate-y-1 transition-all duration-200`}>
        {tag && (
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {tag}
            </span>
          </div>
        )}
        
        <div className="flex items-start gap-5">
          {/* Left side - Icon */}
          <div className="flex-shrink-0 mt-1">
            {icon}
          </div>
          
          {/* Right side - Content */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-2">
              <h3 className={`text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:${colorClasses.text} ${colorClasses.dark.text}`}>{title}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
            
            {/* Get Started button matching the screenshot */}
            <div className="mt-4">
              <div className={`${colorClasses.text} ${colorClasses.dark.text} inline-flex items-center text-sm font-medium`}>
                Get Started
                <svg className="ml-1 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Right Arrow */}
          <div className={`absolute right-6 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full ${featured ? 'bg-indigo-500 group-hover:bg-indigo-600' : `bg-${color}-500 group-hover:bg-${color}-600`} flex items-center justify-center text-white group-hover:shadow-md`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
        
        {/* Add a more prominent gradient border at the bottom of each card - VISIBLE ONLY ON HOVER */}
        <div className={`absolute bottom-0 left-0 w-full h-3 ${featured ? 'bg-indigo-500' : `bg-${color}-500`} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left shadow-lg`}></div>
      </div>
    </Link>
  );
} 