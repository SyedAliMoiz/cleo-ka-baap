'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Button,
  Group,
  Textarea,
  Alert,
  Loader,
  Paper,
  Switch,
  useMantineTheme,
  Card,
  ActionIcon,
  Tooltip,
  Stack,
  Notification,
  Badge
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowRight,
  IconRefresh,
  IconCheck,
  IconThumbUp,
  IconStarFilled,
  IconStar,
  IconEditCircle,
  IconInfoCircle,
  IconBulb,
  IconPencil,
  IconRobot,
  IconArrowLeft
} from '@tabler/icons-react';
import { ContentGenerationService, Hook, ContentAngle, ClientInfo } from '../../utils/contentGenerationService';
import { useDarkMode } from '../DarkModeProvider';

interface HookGenerationStepProps {
  topic: string;
  clientInfo: ClientInfo;
  selectedAngle: ContentAngle;
  research: string;
  selectedArticle?: any;
  onHookSelect: (hook: Hook) => void;
  onContinue: () => void;
  onBack?: () => void;
}

export function HookGenerationStep({
  topic,
  clientInfo,
  selectedAngle,
  research,
  selectedArticle,
  onHookSelect,
  onContinue,
  onBack
}: HookGenerationStepProps) {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [useCustomInstructions, setUseCustomInstructions] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hooksGenerated, setHooksGenerated] = useState(false);
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();

  useEffect(() => {
    if (!hooksGenerated && hooks.length === 0) {
      generateHooks();
    }
  }, []);

  const generateHooks = async (useCustom = false) => {
    if (!clientInfo || !selectedAngle) {
      setError('Missing client information or content angle. Please go back and select them.');
      return;
    }

    if (!research || research.trim() === '') {
      setError('Research data is missing. Please go back to the research step.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const instructions = useCustom ? customInstructions : '';
      const contentService = ContentGenerationService.getInstance();
      
      const response = await contentService.generateHooks(
        topic,
        clientInfo,
        selectedAngle,
        research,
        selectedArticle,
        instructions
      );

      setHooks(response.hooks);
      setHooksGenerated(true);
      setSuccessMessage('Generated new hook options!');

      // Auto-select the recommended hook
      if (response.recommendedHook) {
        setSelectedHook(response.recommendedHook);
        onHookSelect(response.recommendedHook);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to generate hooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHook = (hook: Hook) => {
    setSelectedHook(hook);
    onHookSelect(hook);
  };

  const handleGenerateMore = () => {
    generateHooks(useCustomInstructions);
  };

  const handleCustomInstructionsToggle = (checked: boolean) => {
    setUseCustomInstructions(checked);
  };

  const handleContinue = () => {
    if (!selectedHook) {
      setError('Please select a hook before continuing');
      return;
    }

    if (onContinue) {
      onContinue();
    }
  };

  return (
    <Box>
      <Title order={3} mb="md" style={{ color: isDarkMode ? theme.colors.gray[2] : undefined }}>
        Create Your Hook
      </Title>

      <Text mb="lg" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>
        Select an engaging opening hook for your thread about "{topic}" using the angle "{selectedAngle.title}".
      </Text>

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
          icon={<IconCheck size={18} />}
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

      <Paper
        p="md"
        mb="lg"
        withBorder
        style={{
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : theme.colors.gray[0],
          borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.2)' : undefined,
        }}
      >
        <Group justify="apart" mb="md">
          <Text fw={500} style={{ color: isDarkMode ? theme.colors.gray[3] : undefined }}>
            Custom Instructions
          </Text>
          <Switch
            checked={useCustomInstructions}
            onChange={(event) => handleCustomInstructionsToggle(event.currentTarget.checked)}
            color={isDarkMode ? 'grape.4' : 'indigo'}
            size="md"
            styles={{
              track: {
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : undefined,
                borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.5)' : undefined,
              },
              thumb: {
                backgroundColor: isDarkMode ? 'rgba(138, 102, 214, 0.9)' : undefined,
              }
            }}
          />
        </Group>

        {useCustomInstructions && (
          <>
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Custom Hook Instructions"
              color={isDarkMode ? "dark" : "blue"}
              variant={isDarkMode ? "filled" : "light"}
              mb="md"
              styles={{
                root: {
                  backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : undefined,
                  borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
                },
                title: {
                  color: isDarkMode ? theme.colors.gray[2] : undefined,
                },
                message: {
                  color: isDarkMode ? theme.colors.gray[4] : undefined,
                },
                icon: {
                  color: isDarkMode ? 'rgba(138, 102, 214, 0.9)' : undefined,
                }
              }}
            >
              Provide guidance on the type of hooks you want to generate (e.g., questions, statistics, bold claims).
            </Alert>

            <Textarea
              placeholder="E.g. 'Make it more provocative' or 'Focus on statistics' or 'Start with a question'"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.currentTarget.value)}
              minRows={3}
              styles={{
                input: {
                  backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : undefined,
                  color: isDarkMode ? theme.colors.gray[2] : undefined,
                  borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined
                }
              }}
            />

            <Button
              onClick={handleGenerateMore}
              loading={loading}
              color={isDarkMode ? 'grape.4' : 'indigo'}
              leftSection={<IconBulb size={18} />}
              fullWidth
              mt="md"
              styles={{
                root: {
                  backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.7)' : undefined,
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
              Generate with Instructions
            </Button>
          </>
        )}
      </Paper>

      {loading ? (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
          <Loader color={isDarkMode ? 'grape' : 'indigo'} size="md" />
          <Text mt="md" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>
            Crafting engaging hooks...
          </Text>
        </Box>
      ) : hooks.length > 0 ? (
        <Stack gap="md">
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="AI-Generated Hooks"
            color={isDarkMode ? "dark" : "green"}
            variant={isDarkMode ? "filled" : "light"}
            mb="md"
            styles={{
              root: {
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : undefined,
                borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
              },
              title: {
                color: isDarkMode ? theme.colors.gray[2] : undefined,
              },
              message: {
                color: isDarkMode ? theme.colors.gray[4] : undefined,
              },
              icon: {
                color: isDarkMode ? 'rgba(138, 102, 214, 0.9)' : undefined,
              }
            }}
          >
            Select the opening hook that will grab your audience's attention.
          </Alert>

          {hooks.map((hook, index) => (
            <Card
              key={index}
              padding="md"
              radius="md"
              withBorder
              onClick={() => handleSelectHook(hook)}
              style={{
                cursor: 'pointer',
                backgroundColor: selectedHook === hook
                  ? (isDarkMode ? 'rgba(90, 50, 140, 0.3)' : theme.colors.blue[0])
                  : (isDarkMode ? 'rgba(15, 23, 42, 0.6)' : undefined),
                borderColor: selectedHook === hook
                  ? (isDarkMode ? 'rgba(90, 50, 140, 0.5)' : theme.colors.blue[3])
                  : (isDarkMode ? 'rgba(90, 50, 140, 0.2)' : undefined)
              }}
            >
              <Group justify="apart" mb="xs">
                <Group gap="xs">
                  <Text
                    fw={500}
                    style={{ color: isDarkMode ? theme.colors.gray[2] : undefined }}
                  >
                    Hook Option {index + 1}
                  </Text>

                  {hook.isRecommended && (
                    <Badge
                      color="green"
                      variant={isDarkMode ? "filled" : "light"}
                    >
                      Recommended
                    </Badge>
                  )}
                </Group>

                {hook.isRecommended && (
                  <Group gap="xs">
                    <IconStarFilled size={16} color={isDarkMode ? theme.colors.yellow[4] : theme.colors.yellow[6]} />
                    <Text size="sm" style={{ color: isDarkMode ? theme.colors.yellow[4] : theme.colors.yellow[6] }}>
                      Best Match
                    </Text>
                  </Group>
                )}
              </Group>

              <Text
                size="lg"
                mt="sm"
                fs="italic"
                style={{
                  color: isDarkMode ? theme.colors.gray[2] : undefined,
                  fontSize: '1.1rem',
                }}
              >
                {`"${hook.text}"`.split('\n').map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </Text>

              {selectedHook === hook && (
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
              onClick={handleGenerateMore}
              variant="light"
              leftSection={<IconRefresh size={18} />}
              color={isDarkMode ? 'grape.4' : 'indigo'}
              disabled={loading}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.2)' : undefined,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
              Generate More Hooks
            </Button>

            <Button
              onClick={handleContinue}
              rightSection={<IconArrowRight size={18} />}
              color={isDarkMode ? 'grape.4' : 'indigo'}
              disabled={!selectedHook}
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
              Continue with Selected Hook
            </Button>
          </Group>
        </Stack>
      ) : error ? null : (
        <Box style={{ textAlign: 'center', padding: '2rem' }}>
          <Text mb="md" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>
            Click the button below to generate hooks
          </Text>
          <Button
            onClick={handleGenerateMore}
            leftSection={<IconBulb size={18} />}
            color={isDarkMode ? 'grape.4' : 'indigo'}
            styles={{
              root: {
                backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.7)' : undefined,
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.9)' : undefined,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                transition: 'all 0.2s ease',
              },
            }}
          >
            Generate Hooks
          </Button>
        </Box>
      )}
    </Box>
  );
} 