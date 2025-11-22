'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Paper, 
  Text, 
  Title, 
  Group, 
  Card, 
  Button, 
  Stack, 
  Box,
  Badge,
  Divider,
  useMantineTheme 
} from '@mantine/core';
import { 
  IconArrowRight, 
  IconNews, 
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconArrowLeft
} from '@tabler/icons-react';
import { ClientInfo, ContentGenerationService, RankedArticle } from '../../utils/contentGenerationService';
import { Article } from '../../utils/newsService';
import { useDarkMode } from '../DarkModeProvider';
import { LoadingErrorState } from './LoadingErrorState';

interface ArticleRankingStepProps {
  articles: Article[];
  clientInfo: ClientInfo;
  topic: string;
  onSelectArticle: (article: RankedArticle) => void;
  onContinue: () => void;
  onBack?: () => void;
}

/**
 * Component for ranking and selecting articles
 */
export function ArticleRankingStep({ 
  articles, 
  clientInfo, 
  topic, 
  onSelectArticle, 
  onContinue,
  onBack
}: ArticleRankingStepProps) {
  const [loading, setLoading] = useState(true);
  const [topArticles, setTopArticles] = useState<RankedArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<RankedArticle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useMantineTheme();
  const { isDarkMode } = useDarkMode();
  const isInitialMount = useRef(true);
  const prevDeps = useRef({ articlesLength: 0, clientId: '', topic: '' });

  useEffect(() => {
    // Skip if there are no articles
    if (!articles || articles.length === 0) {
      setError('No articles provided for ranking');
      setLoading(false);
      return;
    }

    // Only fetch on initial mount or when actual dependencies change
    const currentDeps = {
      articlesLength: articles.length,
      clientId: clientInfo.id,
      topic
    };
    
    const shouldRefetch = 
      isInitialMount.current || 
      prevDeps.current.articlesLength !== currentDeps.articlesLength ||
      prevDeps.current.clientId !== currentDeps.clientId ||
      prevDeps.current.topic !== currentDeps.topic;
    
    if (!shouldRefetch) {
      return;
    }

    // Update deps for next comparison
    prevDeps.current = currentDeps;
    isInitialMount.current = false;

    // Rank articles when component mounts or when key dependencies actually change
    const rankArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add debugging to see client info
        console.log("Client info being sent to rankArticles:", JSON.stringify(clientInfo, null, 2));
        
        // Get ranked articles from backend with cache-busting parameter
        const contentService = ContentGenerationService.getInstance();
        const response = await contentService.rankArticles(
          articles, 
          clientInfo,
          topic,
          // Add timestamp to prevent caching
          new Date().getTime().toString()
        );
        
        setTopArticles(response.topArticles);
      } catch (err: any) {
        console.error('Error ranking articles:', err);
        setError(err.message || 'Failed to rank articles');
      } finally {
        setLoading(false);
      }
    };

    rankArticles();
  }, [articles, clientInfo, topic]);

  // Handle article selection
  const handleArticleSelect = (article: RankedArticle) => {
    setSelectedArticle(article);
    onSelectArticle(article);
  };

  // Handle continue button click
  const handleContinue = () => {
    if (selectedArticle) {
      onContinue();
    }
  };

  const cardBgColor = isDarkMode 
    ? 'rgba(30, 30, 40, 0.5)'
    : theme.white;

  const selectedCardBgColor = isDarkMode 
    ? 'rgba(90, 50, 140, 0.3)' 
    : theme.colors.blue[0];

  const titleColor = isDarkMode
    ? theme.colors.gray[2]
    : theme.colors.dark[7];

  const textColor = isDarkMode
    ? theme.colors.gray[4]
    : theme.colors.gray[7];

  const paperBgColor = isDarkMode
    ? 'rgba(30, 30, 40, 0.3)'
    : theme.white;

  return (
    <Paper 
      p="xl" 
      radius="md" 
      withBorder
      style={{
        backgroundColor: paperBgColor,
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : undefined
      }}
    >
      <Stack gap="lg">
        <Title order={3} style={{ color: titleColor }}>Select an article for your thread</Title>
        <Text style={{ color: textColor }} size="md">
          We've analyzed and ranked these articles based on relevance to {clientInfo.name}'s niche. 
          Select the one you'd like to use as the basis for your thread.
        </Text>

        <LoadingErrorState 
          loading={loading} 
          error={error} 
          loadingMessage="Analyzing articles for relevance..." 
          fullHeight={true}
        />

        {!loading && !error && (
          <>
            <Stack gap="md">
              {topArticles.map((article, index) => (
                <Card 
                  key={`${index}-${article.url}`}
                  shadow="sm" 
                  padding="lg" 
                  radius="md"
                  withBorder
                  onClick={() => handleArticleSelect(article)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedArticle?.url === article.url
                      ? selectedCardBgColor
                      : cardBgColor,
                    borderColor: selectedArticle?.url === article.url
                      ? (isDarkMode ? 'rgba(90, 50, 140, 0.5)' : theme.colors.blue[3])
                      : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : undefined),
                    position: 'relative'
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <Text fw={700} style={{ color: titleColor, width: '85%', paddingRight: '20px' }}>
                      {article.title}
                    </Text>
                    <Badge
                      color={article.rank <= 2 ? 'grape' : 'blue'}
                      variant={isDarkMode ? 'filled' : 'light'}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        zIndex: 2
                      }}
                    >
                      Rank #{article.rank}
                    </Badge>
                  </Group>
                  
                  <Text size="sm" style={{ color: textColor }} lineClamp={2} mb="md">
                    {article.summary}
                  </Text>
                  
                  {article.explanation && (
                    <>
                      <Divider my="sm" />
                      <Group gap="xs">
                        <IconNews size={18} color={isDarkMode ? theme.colors.grape[4] : theme.colors.blue[6]} />
                        <Text size="sm" style={{ color: isDarkMode ? theme.colors.grape[4] : theme.colors.blue[6], fontStyle: 'italic' }}>
                          {article.explanation}
                        </Text>
                      </Group>
                    </>
                  )}
                  
                  {selectedArticle?.url === article.url && (
                    <Box 
                      style={{ 
                        position: 'absolute', 
                        top: 10, 
                        right: 10,
                        backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.8)' : theme.colors.blue[5],
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconCheck size={16} color="white" />
                    </Box>
                  )}
                </Card>
              ))}
            </Stack>

            <Group justify="space-between" mt="md">
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
                rightSection={<IconArrowRight size={18} />}
                onClick={handleContinue}
                disabled={!selectedArticle}
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
                Continue with Selected Article
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
} 