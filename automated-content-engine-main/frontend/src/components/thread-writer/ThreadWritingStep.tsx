import React, { useState, useEffect } from 'react';
import { useMantineTheme } from '@mantine/core';
import { ContentGenerationService, ThreadRequest } from '../../utils/contentGenerationService';
import { LoadingErrorState } from './LoadingErrorState';
import { useDarkMode } from '../DarkModeProvider';
import { apiHelpers } from '../../utils/apiClient';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isHidden?: boolean;
}

interface ThreadWritingStepProps {
  threadData: ThreadRequest;
  onSaveThread: (thread: any) => void;
  onComplete: () => void;
}

export function ThreadWritingStep({
  threadData,
  onSaveThread,
  onComplete
}: ThreadWritingStepProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();

  const contentService = ContentGenerationService.getInstance();

  useEffect(() => {
    const createThreadChat = async () => {
      try {
        setLoading(true);
        
        // Create a thread writer chat instead of directly generating a thread
        const { chatId } = await apiHelpers.post<{ chatId: string }>('/api/thread-writer/chats/create', {
          topic: threadData.topic,
          clientId: threadData.clientInfo.id, // Extract clientId from clientInfo
          research: threadData.research,
          selectedArticle: threadData.selectedArticle,
          selectedAngle: threadData.selectedAngle,
          selectedHook: threadData.selectedHook,
        });
        
        // Show loading for 2 seconds then redirect to chat page
        setTimeout(() => {
          window.location.href = `/chats/${chatId}`;
        }, 2000);
        
      } catch (err: any) {
        setError(err.message || 'Failed to create thread chat');
        setLoading(false);
      }
    };

    createThreadChat();
  }, [threadData]);

  if (loading) {
    return (
      <LoadingErrorState
        loading={true}
        error={null}
        loadingMessage="Just a moment... we're weaving your perfect X thread"
        fullHeight
      />
    );
  }

  if (error) {
    return (
      <LoadingErrorState
        loading={false}
        error={error}
        loadingMessage="We encountered a problem while generating your thread."
      />
    );
  }

  // We should never reach this point since we always redirect after success
  return null;
} 