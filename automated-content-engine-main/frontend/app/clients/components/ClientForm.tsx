'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '../../../src/components/DarkModeProvider';
import { apiClient } from '../../../src/utils/apiClient';

interface ClientFormProps {
  client?: {
    _id?: string;
    name: string;
    businessInfo: string;
    goals: string;
    voice: string;
    voiceAnalysis: string;
    feedback: string;
    nicheTags: string[];
    bio: string;
  };
  isEditing?: boolean;
}

// Define Client type for reuse
interface Client {
  _id?: string;
  name: string;
  businessInfo: string;
  goals: string;
  voice: string;
  voiceAnalysis: string;
  feedback: string;
  nicheTags: string[];
  bio: string;
}

export default function ClientForm({ client, isEditing = false }: ClientFormProps) {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessInfo: '',
    goals: '',
    voice: '',
    voiceAnalysis: '',
    feedback: '',
    nicheTags: [] as string[],
    bio: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        businessInfo: client.businessInfo || '',
        goals: client.goals || '',
        voice: client.voice || '',
        voiceAnalysis: client.voiceAnalysis || '',
        feedback: client.feedback || '',
        nicheTags: client.nicheTags || [],
        bio: client.bio || '',
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
  };

  const toggleGuide = () => {
    setIsOpen(!isOpen);
  };

  const updateNicheTags = async () => {
    if (!client?._id) return;
    
    setIsUpdatingTags(true);
    try {
      const updatedClient = await apiClient<Client>(`/clients/${client._id}/niche-tags`, {
        method: 'PATCH',
      });
      
      setFormData((prev: typeof formData) => ({
        ...prev,
        nicheTags: updatedClient.nicheTags || [],
      }));
    } catch (error) {
      console.error('Failed to update niche tags:', error);
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && client?._id) {
        await apiClient<Client>(`/clients/${client._id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
      } else {
        await apiClient<Client>('/clients', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      
      router.push('/clients');
      router.refresh();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
      <h1 className="text-2xl font-semibold mb-6">{isEditing ? 'Edit Client' : 'Add New Client'}</h1>
      
      {/* Information Guide Accordion */}
      <div className={`mb-6 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <button
          onClick={toggleGuide}
          className={`w-full px-4 py-3 flex justify-between items-center font-medium ${
            isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          How to add client information
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        
        {isOpen && (
          <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="text-lg font-medium mb-3">Guidelines for adding client information:</h3>
            
            <div className="space-y-4">
              <div className="pl-4 border-l-4 border-purple-500">
                <h4 className="font-medium">1. Information about client's business + ICP</h4>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Run information from your client's "second brain" through the Information Distiller to
                  extract the most important pieces of information while staying under the token limit.
                </p>
              </div>
              
              <div className="pl-4 border-l-4 border-purple-500">
                <h4 className="font-medium">2. Client Goals</h4>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  If your client goals exceed the token limit, use the Information Distiller to condense them
                  while preserving the key objectives.
                </p>
              </div>
              
              <div className="pl-4 border-l-4 border-purple-500">
                <h4 className="font-medium">3. Client Voice <span className="text-red-400">★ IMPORTANT</span></h4>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Use a written sample of your client's writing that stays under the token limit. Do not use
                  excessively long samples as they will negatively impact AI performance.
                </p>
              </div>
              
              <div className="pl-4 border-l-4 border-purple-500">
                <h4 className="font-medium">4. Client Feedback</h4>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  For feedback from Grain recordings, use the Information Distiller to extract key
                  points rather than including entire transcriptions.
                </p>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  For Slack feedback, only include the most important messages to avoid exceeding
                  the token limit.
                </p>
              </div>
            </div>
            
            <div className={`mt-4 p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-sm font-medium">Note:</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Staying within token limits ensures optimal AI performance and better content
                generation.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Name */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="name" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Client Name
            </label>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.name.length}/4000 tokens
            </span>
          </div>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={`w-full rounded-md border p-2 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-800'
            }`}
          />
        </div>
        
        {/* Bio */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="bio" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Bio
            </label>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.bio.length}/4000 tokens
            </span>
          </div>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            required
            rows={2}
            className={`w-full rounded-md border p-2 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-800'
            }`}
          />
        </div>
        
        {/* Business Information */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="businessInfo" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Information about client's business + ICP
            </label>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.businessInfo.length}/4000 tokens
            </span>
          </div>
          <textarea
            id="businessInfo"
            name="businessInfo"
            value={formData.businessInfo}
            onChange={handleChange}
            required
            rows={5}
            className={`w-full rounded-md border p-2 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-800'
            }`}
          />
        </div>
        
        {/* Client Goals */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="goals" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Client Goals
            </label>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.goals.length}/4000 tokens
            </span>
          </div>
          <textarea
            id="goals"
            name="goals"
            value={formData.goals}
            onChange={handleChange}
            required
            rows={4}
            className={`w-full rounded-md border p-2 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-800'
            }`}
          />
        </div>
        
        {/* Client Voice */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="voice" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Client Voice
            </label>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.voice.length}/4000 tokens
            </span>
          </div>
          <textarea
            id="voice"
            name="voice"
            value={formData.voice}
            onChange={handleChange}
            placeholder="Enter a sample of the client's voice..."
            rows={4}
            className={`w-full rounded-md border p-2 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' 
                : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400'
            }`}
          />
        </div>
        
        {/* Voice Analysis - Read Only */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="voiceAnalysis" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Client Voice Analysis
            </label>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.voiceAnalysis.length}/4000 tokens
            </span>
          </div>
          <textarea
            id="voiceAnalysis"
            name="voiceAnalysis"
            value={formData.voiceAnalysis}
            readOnly
            placeholder="Voice analysis will appear here after generation..."
            rows={3}
            className={`w-full rounded-md border p-2 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' 
                : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400'
            }`}
          />
          {isEditing && client?.voice && (
            <button
              type="button"
              className={`mt-2 px-3 py-1 text-sm rounded-md ${
                isDarkMode 
                  ? 'bg-purple-700 hover:bg-purple-600 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              Generate Analysis
            </button>
          )}
        </div>
        
        {/* Client Feedback */}
        <div>
          <div className="flex justify-between mb-1">
            <label htmlFor="feedback" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Client Feedback
            </label>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.feedback.length}/4000 tokens
            </span>
          </div>
          <textarea
            id="feedback"
            name="feedback"
            value={formData.feedback}
            onChange={handleChange}
            placeholder="Enter feedback about the client's content preferences..."
            rows={3}
            className={`w-full rounded-md border p-2 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' 
                : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400'
            }`}
          />
        </div>
        
        {/* Niche Tags */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Niche Tags
            </label>
            {isEditing && (
              <button
                type="button"
                onClick={updateNicheTags}
                disabled={isUpdatingTags}
                className={`px-3 py-1 text-sm rounded-md flex items-center ${
                  isDarkMode 
                    ? 'bg-purple-700 hover:bg-purple-600 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                } ${isUpdatingTags ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isUpdatingTags && (
                  <svg className="animate-spin -ml-0.5 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isUpdatingTags ? 'Updating...' : 'Update Niche Tags'}
              </button>
            )}
          </div>
          
          <div className={`p-3 rounded-md min-h-12 border ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-white border-gray-300'
          }`}>
            <div className="flex flex-wrap gap-2">
              {formData.nicheTags.length > 0 ? (
                formData.nicheTags.map((tag, index) => (
                  <span 
                    key={index} 
                    className={`px-2 py-1 text-xs rounded-full ${
                      isDarkMode 
                        ? 'bg-purple-900/50 text-purple-200 border border-purple-700' 
                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isEditing 
                    ? 'No niche tags yet. Click "Update Niche Tags" to generate.' 
                    : 'Save the client first, then you can generate niche tags.'}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/clients')}
            className={`px-4 py-2 rounded-md ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md flex items-center ${
              isDarkMode 
                ? 'bg-purple-700 hover:bg-purple-600 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
} 