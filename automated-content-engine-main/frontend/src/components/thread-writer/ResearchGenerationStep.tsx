'use client';

import React, { useState, useEffect } from 'react';
import { Box, Title, Text, Button, Paper, Accordion, Group, Alert, Loader, useMantineTheme } from '@mantine/core';
import { IconInfoCircle, IconAlertCircle, IconArrowRight, IconChevronDown, IconArrowLeft } from '@tabler/icons-react';
import { useDarkMode } from '../DarkModeProvider';
import { ResearchService, ResearchResponse } from '../../utils/researchService';
import { Article } from '../../utils/newsService';
import ReactMarkdown from 'react-markdown';

interface ResearchGenerationStepProps {
  topic: string;
  selectedArticle?: Article;
  onResearchComplete: (research: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}

/**
 * Component for displaying in-depth research on a topic
 */
export function ResearchGenerationStep({ topic, selectedArticle, onResearchComplete, onContinue, onBack }: ResearchGenerationStepProps) {
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [research, setResearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();

  useEffect(() => {
    const fetchResearch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch research using ResearchService
        const response = await ResearchService.getResearchForTopic(topic, selectedArticle);
        
        setResearch(response.research);
        onResearchComplete(response.research);
        
      } catch (err: any) {
        console.error('Failed to fetch research:', err);
        setError(err.message || 'Failed to get research. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResearch();
  }, [topic, selectedArticle, onResearchComplete]);

  const handleContinue = () => {
    onContinue();
  };

  return (
    <Box>
      <Title order={3} mb="md" style={{ color: isDarkMode ? theme.colors.gray[2] : undefined }}>
        In-Depth Research
      </Title>
      
      <Text mb="lg" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>
        Detailed research about <b>{topic}</b> {selectedArticle ? `related to "${selectedArticle.title}"` : ''}
      </Text>

      {loading ? (
        <Paper 
          p="xl"
          withBorder
          style={{
            borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.2)' : undefined,
            backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.5)' : undefined,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '50px 0'
          }}
        >
          <Loader color={isDarkMode ? "grape.4" : "blue"} size="md" mb="md" />
          <Text style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>
            Researching deeper insights on this topic...
          </Text>
          <Text size="xs" mt="xs" opacity={0.7} style={{ color: isDarkMode ? theme.colors.gray[5] : undefined }}>
            This may take a moment as we analyze the latest information
          </Text>
        </Paper>
      ) : error ? (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Error" 
          color="red" 
          mb="xl"
          styles={{
            root: {
              backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : undefined,
              color: isDarkMode ? '#FCA5A5' : undefined,
              borderColor: isDarkMode ? 'rgba(220, 38, 38, 0.25)' : undefined,
            },
            title: {
              color: isDarkMode ? '#FCA5A5' : undefined,
            },
            message: {
              color: isDarkMode ? '#FCA5A5' : undefined,
            },
          }}
        >
          {error}
        </Alert>
      ) : (
        <>
          <Accordion
            value={expanded ? 'research' : undefined}
            onChange={(value) => setExpanded(value === 'research')}
            mb="xl"
            styles={{
              item: {
                borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.2)' : undefined,
                backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.5)' : undefined,
                marginBottom: 0,
              },
              control: {
                backgroundColor: isDarkMode ? 'rgba(50, 50, 60, 0.5)' : undefined,
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(60, 60, 70, 0.5)' : undefined,
                },
              },
              content: {
                backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.3)' : undefined,
                paddingTop: '16px',
              },
              chevron: {
                color: isDarkMode ? theme.colors.gray[4] : undefined,
              },
            }}
          >
            <Accordion.Item value="research">
              <Accordion.Control icon={<IconInfoCircle size={20} color={isDarkMode ? theme.colors.grape[4] : undefined} />}>
                <Text fw={500} style={{ color: isDarkMode ? theme.colors.gray[2] : undefined }}>
                  Research on {topic}
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Paper 
                  p="md" 
                  withBorder={false}
                  bg={isDarkMode ? 'rgba(30, 30, 40, 0.3)' : 'white'}
                >
                  <Box 
                    className="markdown-content"
                    style={{ 
                      color: isDarkMode ? theme.colors.gray[4] : undefined,
                      lineHeight: 1.6
                    }}
                  >
                    <ReactMarkdown>
                    {research}
                    </ReactMarkdown>
                  </Box>
                </Paper>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          
          <Group justify="space-between" mt="xl">
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
              onClick={handleContinue}
              rightSection={<IconArrowRight size={16} />}
              color={isDarkMode ? 'grape.4' : 'indigo'}
              styles={{
                root: {
                  backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.8)' : undefined,
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.9)' : undefined,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  },
                  transition: 'all 0.2s ease',
                },
              }}
            >
              Continue
            </Button>
          </Group>
        </>
      )}
    </Box>
  );
} 