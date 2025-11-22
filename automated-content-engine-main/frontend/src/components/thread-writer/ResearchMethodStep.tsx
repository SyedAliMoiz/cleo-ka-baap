'use client';

import React, { useState } from 'react';
import { Box, Title, Text, TextInput, Button, Group, SegmentedControl, Textarea, Alert, Loader, Notification, Paper, Badge, Stack, Card, Anchor, useMantineTheme } from '@mantine/core';
import { IconAlertCircle, IconArrowRight, IconInfoCircle, IconNews, IconArticle, IconCheck, IconCalendar, IconArrowLeft } from '@tabler/icons-react';
import { Client } from '../../utils/clientService';
import { NewsService, Article } from '../../utils/newsService';
import { useDarkMode } from '../DarkModeProvider';
import { LoadingErrorState } from './LoadingErrorState';

interface ResearchMethodStepProps {
  client: Client | null;
  topic: string;
  onResearchComplete: (data: any) => void;
  onContinue?: () => void;
  onBack?: () => void;
  initialCustomInstructions?: string;
}

/**
 * Component for selecting research method (auto vs manual) and handling the research process
 */
export function ResearchMethodStep({ 
  client, 
  topic, 
  onResearchComplete, 
  onContinue, 
  onBack,
  initialCustomInstructions = ''
}: ResearchMethodStepProps) {
  const [method, setMethod] = useState<'auto' | 'manual'>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualResearch, setManualResearch] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [researchCompleted, setResearchCompleted] = useState(false);
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();
  const [customInstructions, setCustomInstructions] = useState(initialCustomInstructions);

  const handleAutoResearch = async () => {
    if (!client?.id || !topic) {
      setValidationError('Missing client ID or topic. Please go back and select them.');
      return;
    }

    setLoading(true);
    setError(null);
    setValidationError(null);
    
    try {
      // Use NewsService to fetch articles
      const articleData = await NewsService.fetchNewsForTopic(
        topic, 
        client.id,
        40,  // maxResults
        customInstructions.trim() || undefined // Optional custom instructions
      );
      setArticles(articleData.articles);
      
      // Pass the research data to the parent component
      onResearchComplete({
        articles: articleData.articles,
        topArticles: articleData.topArticles,
        topic,
        clientId: client.id,
        isAutoResearch: true,
        customInstructions: customInstructions.trim() || undefined
      });
      
      setSuccessMessage(`Successfully found ${articleData.articles.length} articles about "${topic}"`);
      setResearchCompleted(true);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch news articles');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualResearch.trim()) {
      setValidationError('Please enter some research before continuing.');
      return;
    }

    setValidationError(null);
    
    // Pass the manual research to the parent component
    onResearchComplete({ 
      manualResearch,
      topic,
      clientId: client?.id,
      isAutoResearch: false
    });
    
    setSuccessMessage('Manual research saved successfully!');
    
    // Continue after successful submission
    if (onContinue) {
      setTimeout(() => {
        onContinue();
      }, 1500);
    }
  };

  const handleNext = () => {
    if (onContinue) {
      onContinue();
    }
  };

  const renderLoadingState = () => {
    if (!loading) return null;
    
    return (
      <Box mt="xl">
        <LoadingErrorState 
          loading={loading}
          error={error}
          loadingMessage="Searching for articles about this topic..."
          fullHeight={true}
        />
      </Box>
    );
  };

  return (
    <Box>
      <Title order={3} mb="md" style={{ color: isDarkMode ? theme.colors.gray[2] : undefined }}>Research for Your Thread</Title>
      
      <Text mb="lg" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>
        Choose how you'd like to research content for this thread. You can automatically search for recent news
        about "{topic}" or provide your own research.
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
      
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Error" 
          color="red" 
          mb="md"
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
      )}
      
      {successMessage && (
        <Notification 
          color="green" 
          title="Success" 
          withCloseButton
          onClose={() => setSuccessMessage(null)}
          mb="md"
          icon={<IconInfoCircle size={18} />}
          styles={{
            root: {
              backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : undefined,
              color: isDarkMode ? '#86EFAC' : undefined,
              borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.25)' : undefined,
            },
            title: {
              color: isDarkMode ? '#86EFAC' : undefined,
            },
            description: {
              color: isDarkMode ? '#86EFAC' : undefined,
            },
          }}
        >
          {successMessage}
        </Notification>
      )}

      <Box mb="xl">
        <SegmentedControl
          value={method}
          onChange={(value) => setMethod(value as 'auto' | 'manual')}
          data={[
            { label: 'Auto-Research', value: 'auto' },
            { label: 'Manual Input', value: 'manual' },
          ]}
          mb="lg"
          color={isDarkMode ? 'grape.4' : undefined}
          classNames={{
            label: 'segmented-control-label',
          }}
          styles={{
            root: {
              backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.5)' : undefined,
              border: isDarkMode ? '1px solid rgba(90, 50, 140, 0.3)' : undefined,
            },
            control: {
              borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
            },
            indicator: {
              backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
            },
            label: {
              color: isDarkMode ? theme.colors.gray[4] : undefined,
            }
          }}
        />
        
        <style jsx global>{`
          .segmented-control-label[data-active] {
            color: ${isDarkMode ? theme.colors.gray[2] : theme.colors.blue[9]} !important;
          }
        `}</style>
        
        {method === 'auto' ? (
          <Box>
            <Text size="sm" mb="md" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>
              We'll automatically search for recent information about "{topic}" and use it to help generate your thread.
            </Text>
            
            <Paper 
              p="md" 
              withBorder 
              mb="lg"
              style={{ 
                backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.3)' : '#f8f9fa',
                borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.2)' : undefined
              }}
            >
              <Text size="sm" fw={500} mb="xs" style={{ color: isDarkMode ? theme.colors.gray[3] : undefined }}>
                <IconInfoCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Custom Research Instructions (Optional)
              </Text>
              
              <Textarea
                placeholder="Add specific research instructions (e.g., 'Focus on stories about Microsoft's AI investments' or 'Research the impact on small businesses')"
                minRows={3}
                maxRows={5}
                mb="xs"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                styles={{
                  input: {
                    backgroundColor: isDarkMode ? 'rgba(20, 20, 30, 0.4)' : undefined,
                    borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
                    color: isDarkMode ? theme.colors.gray[3] : undefined,
                  },
                }}
              />
              
              <Text size="xs" style={{ color: isDarkMode ? theme.colors.gray[5] : theme.colors.gray[6] }}>
                These instructions will guide our research system to focus on specific aspects of the topic that are important to you.
              </Text>
            </Paper>
            
            {!researchCompleted ? (
              <>
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
                    onClick={handleAutoResearch}
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
                    Research Articles
                  </Button>
                </Group>
              </>
            ) : (
              <>
                <Group justify="center">
                  <Button
                    onClick={handleNext}
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
                    Continue to Next Step
                  </Button>
                </Group>
              </>
            )}
          </Box>
        ) : (
          <Box>
            <Text size="sm" mb="md" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>
              Enter your own research about "{topic}" that will be used to generate the thread.
            </Text>
            
            <Textarea
              placeholder="Enter your research here..."
              value={manualResearch}
              onChange={(e) => setManualResearch(e.target.value)}
              minRows={5}
              maxRows={10}
              styles={{
                input: {
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.5)' : undefined,
                  borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
                  color: isDarkMode ? theme.colors.gray[2] : undefined,
                },
              }}
              mb="xl"
            />
            
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
                onClick={handleManualSubmit}
                disabled={!manualResearch.trim() || loading}
                rightSection={loading ? <Loader size="xs" /> : <IconArrowRight size={16} />}
                color={isDarkMode ? 'grape.4' : 'indigo'}
                styles={{
                  root: {
                    backgroundColor: isDarkMode && manualResearch.trim() ? 'rgba(90, 50, 140, 0.8)' : undefined,
                    '&:hover': {
                      backgroundColor: isDarkMode && manualResearch.trim() ? 'rgba(90, 50, 140, 0.9)' : undefined,
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
                Continue with Manual Research
              </Button>
            </Group>
          </Box>
        )}
      </Box>
    </Box>
  );
} 