'use client';

import React, { useState } from 'react';
import { Box, Title, Text, TextInput, Button, Group, Chip, Alert, Notification, useMantineTheme } from '@mantine/core';
import { IconAlertCircle, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import { Client } from '../../utils/clientService';
import { useDarkMode } from '../DarkModeProvider';

interface TopicSelectionStepProps {
  client: Client | null;
  onSelectTopic: (topic: string) => void;
  onContinue?: () => void;
  onBack?: () => void;
}

/**
 * Component for selecting a topic for thread writing based on client niche tags
 */
export function TopicSelectionStep({ client, onSelectTopic, onContinue, onBack }: TopicSelectionStepProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();

  // Default placeholder tags if client or niche tags aren't available
  const defaultTags = ['Marketing', 'Engagement', 'Lead Generation', 'Sales', 'Brand Awareness'];
  
  // Get niche tags from client or use default tags
  const nicheTags = client?.nicheTags?.length ? client.nicheTags : (client?.tags?.length ? client.tags : defaultTags);
  
  const handleNicheTagClick = (tag: string) => {
    setSelectedTopic(tag);
    setCustomTopic('');
    setValidationError(null);
    onSelectTopic(tag);
  };
  
  const handleCustomTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTopic(e.target.value);
    if (selectedTopic) {
      setSelectedTopic(''); // Clear selected tag when entering custom topic
    }
    
    if (e.target.value.trim()) {
      setValidationError(null);
    }
  };
  
  const handleSubmit = () => {
    const finalTopic = selectedTopic || customTopic.trim();
    if (!finalTopic) {
      setValidationError('Please select a topic or enter a custom one before continuing.');
      return;
    }
    
    onSelectTopic(finalTopic);
    
    if (onContinue) {
      onContinue();
    }
  };

  // Handle Chip.Group onChange with correct typing
  const handleChipGroupChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setSelectedTopic(value);
    }
  };
  
  return (
    <Box>
      <Title order={3} mb="md" style={{ color: isDarkMode ? theme.colors.gray[2] : undefined }}>Select a Topic</Title>
      <Text mb="lg" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>
        Choose a topic for your thread {client ? `based on ${client.name}'s interests` : ''}:
      </Text>
      
      {validationError && (
        <Notification 
          color="red" 
          title="Action Required" 
          withCloseButton
          onClose={() => setValidationError(null)}
          mb="md"
          icon={<IconAlertCircle size={18} />}
          styles={{
            root: {
              backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : undefined,
              color: isDarkMode ? '#FCA5A5' : undefined,
              borderColor: isDarkMode ? 'rgba(220, 38, 38, 0.25)' : undefined,
            },
            title: {
              color: isDarkMode ? '#FCA5A5' : undefined,
            },
            description: {
              color: isDarkMode ? '#FCA5A5' : undefined,
            },
          }}
        >
          {validationError}
        </Notification>
      )}
      
      {!client && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="No client selected" 
          color="yellow" 
          mb="md"
          styles={{
            root: {
              backgroundColor: isDarkMode ? 'rgba(250, 204, 21, 0.15)' : undefined,
              borderColor: isDarkMode ? 'rgba(250, 204, 21, 0.25)' : undefined,
            },
            title: {
              color: isDarkMode ? theme.colors.yellow[4] : undefined,
            },
            message: {
              color: isDarkMode ? theme.colors.gray[4] : undefined,
            },
          }}
        >
          No client is currently selected. The default topic tags are shown below.
        </Alert>
      )}
      
      <Box mb="xl">
        <Text fw={500} mb="xs" style={{ color: isDarkMode ? theme.colors.gray[3] : undefined }}>Suggested Topics:</Text>
        <Chip.Group value={selectedTopic} onChange={handleChipGroupChange}>
          <Group>
            {nicheTags.map((tag, index) => (
              <Chip
                key={index}
                value={tag}
                checked={selectedTopic === tag}
                onClick={() => handleNicheTagClick(tag)}
                color={isDarkMode ? 'grape.9' : 'indigo'}
                styles={{
                  label: {
                    color: isDarkMode 
                      ? selectedTopic === tag 
                        ? theme.colors.gray[2] 
                        : theme.colors.gray[4]
                      : undefined,
                    backgroundColor: isDarkMode 
                      ? selectedTopic === tag 
                        ? 'rgba(90, 50, 140, 0.6)' 
                        : 'rgba(30, 30, 40, 0.5)'
                      : undefined,
                    borderColor: isDarkMode 
                      ? selectedTopic === tag 
                        ? 'rgba(90, 50, 140, 0.8)' 
                        : 'rgba(90, 50, 140, 0.3)'
                      : undefined,
                    fontWeight: selectedTopic === tag ? 600 : 400,
                    transition: 'all 0.2s ease',
                    padding: '8px 16px',
                    '&:hover': {
                      backgroundColor: isDarkMode 
                        ? 'rgba(90, 50, 140, 0.5)' 
                        : theme.colors.indigo[0],
                      borderColor: isDarkMode 
                        ? 'rgba(130, 80, 220, 0.6)' 
                        : theme.colors.indigo[5],
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      color: isDarkMode ? theme.colors.gray[2] : undefined,
                      cursor: 'pointer'
                    },
                  },
                  checkIcon: {
                    color: isDarkMode ? theme.colors.grape[3] : undefined,
                  },
                  iconWrapper: {
                    color: isDarkMode ? theme.colors.gray[2] : undefined,
                  },
                }}
              >
                {tag}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Box>
      
      <Box mb="xl">
        <TextInput
          label="Or enter a custom topic"
          placeholder="e.g., Instagram Growth Strategy"
          value={customTopic}
          onChange={handleCustomTopicChange}
          mb="md"
          styles={{
            label: {
              color: isDarkMode ? theme.colors.gray[3] : undefined,
            },
            input: {
              backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.5)' : undefined,
              borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
              color: isDarkMode ? theme.colors.gray[3] : undefined,
              '&:focus': {
                borderColor: isDarkMode ? theme.colors.grape[8] : undefined,
              },
            },
          }}
        />
      </Box>
      
      <Group justify="space-between">
        {onBack && (
          <Button 
            variant="outline" 
            onClick={onBack} 
            leftSection={<IconArrowLeft size={16} />}
            color={isDarkMode ? 'grape.4' : 'indigo'}
            styles={{
              root: {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : undefined,
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.15)' : undefined,
                },
              },
            }}
          >
            Back
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          rightSection={<IconArrowRight size={16} />}
          disabled={!selectedTopic && !customTopic.trim()}
          color={isDarkMode ? 'grape.4' : 'indigo'}
          styles={{
            root: {
              backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.8)' : undefined,
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.9)' : undefined,
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              '&:disabled': {
                backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.5)' : undefined,
                color: isDarkMode ? theme.colors.gray[5] : undefined,
                cursor: 'not-allowed',
                transform: 'none',
                boxShadow: 'none',
              },
              transition: 'all 0.2s ease',
            },
          }}
        >
          Continue with {selectedTopic || customTopic || 'Selected Topic'}
        </Button>
      </Group>
    </Box>
  );
} 