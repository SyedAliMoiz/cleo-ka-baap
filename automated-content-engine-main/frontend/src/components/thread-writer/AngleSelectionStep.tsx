'use client';

import React, { useState, useEffect } from 'react';
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
  useMantineTheme,
  Switch,
  Textarea,
  TextInput,
  Tabs,
  Alert
} from '@mantine/core';
import { 
  IconArrowRight, 
  IconRefresh,
  IconBulb,
  IconCheck,
  IconPlus,
  IconRobot,
  IconPencil,
  IconInfoCircle,
  IconArrowLeft
} from '@tabler/icons-react';
import { ClientInfo, ContentGenerationService, RankedArticle, ContentAngle } from '../../utils/contentGenerationService';
import { useDarkMode } from '../DarkModeProvider';
import { LoadingErrorState } from './LoadingErrorState';

interface AngleSelectionStepProps {
  topic: string;
  clientInfo: ClientInfo;
  research: string;
  selectedArticle?: RankedArticle;
  onSelectAngle: (angle: ContentAngle) => void;
  onContinue: () => void;
  onBack?: () => void;
  selectedAngle?: ContentAngle | null;
  existingAngles?: ContentAngle[];
  onAnglesGenerated?: (angles: ContentAngle[]) => void;
}

/**
 * Component for generating and selecting content angles
 */
export function AngleSelectionStep({ 
  topic, 
  clientInfo, 
  research, 
  selectedArticle, 
  onSelectAngle, 
  onContinue,
  onBack,
  selectedAngle,
  existingAngles = [],
  onAnglesGenerated
}: AngleSelectionStepProps) {
  const [loading, setLoading] = useState(false);
  const [autoAngles, setAutoAngles] = useState<ContentAngle[]>([]);
  const [manualAngles, setManualAngles] = useState<ContentAngle[]>([]);
  const [recommendedAngle, setRecommendedAngle] = useState<ContentAngle | null>(null);
  const [customAngle, setCustomAngle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualResearch, setManualResearch] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  // Track if angles were already generated to avoid unnecessary API calls
  const [autoAnglesGenerated, setAutoAnglesGenerated] = useState(false);
  const [manualAnglesGenerated, setManualAnglesGenerated] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const theme = useMantineTheme();
  const { isDarkMode } = useDarkMode();

  const fetchAngles = async () => {
    // CRITICAL SAFETY CHECK: If we already have a selected angle and angles in our state,
    // we don't need to fetch anything - this prevents flickering on back navigation
    if (selectedAngle) {
      const currentAngles = isManualMode ? manualAngles : autoAngles;
      if (currentAngles.length > 0 || (isManualMode && !manualResearch.trim())) {
        console.log("fetchAngles safety check - already have selectedAngle and angles, skipping fetch");
        setLoading(false);
        return;
      }
    }
    
    // Check if we already have angles to display in the current mode
    const currentAngles = isManualMode ? manualAngles : autoAngles;
    const hasGeneratedBefore = isManualMode ? manualAnglesGenerated : autoAnglesGenerated;
    
    if (currentAngles.length > 0 && hasGeneratedBefore && !forceRefresh) {
      console.log(`Already have ${currentAngles.length} angles in ${isManualMode ? 'manual' : 'auto'} mode, skipping fetch`);
      return;
    }
    
    // Don't fetch again if:
    // 1. We're in auto mode, have already generated angles, and not explicitly requesting more
    if (isManualMode === false && autoAnglesGenerated && autoAngles.length > 0 && !forceRefresh) {
      console.log("Auto angles already generated, skipping fetch");
      return;
    }
    
    // 2. We're in manual mode but haven't entered any research
    if (isManualMode === true && !manualResearch.trim()) {
      console.log("No manual research entered, skipping fetch");
      return;
    }
    
    // 3. We're in manual mode, already have generated angles, and not explicitly requesting more
    if (isManualMode === true && manualAnglesGenerated && manualAngles.length > 0 && !forceRefresh) {
      console.log("Manual angles already generated, skipping fetch");
      return;
    }
    
    // First, check if we already have a selected angle that should be preserved
    // If so, add it to the appropriate array if it doesn't exist there yet
    if (selectedAngle) {
      console.log("We have a selected angle during fetch:", selectedAngle.title);
      
      const isFromManual = selectedAngle.engagementScore === 0 && !selectedAngle.explanation;
      
      if (isFromManual && isManualMode) {
        // Check if this angle is already in the manual angles array
        const angleExists = manualAngles.some(angle => angle.title === selectedAngle.title);
        
        if (!angleExists) {
          console.log("Adding selected angle to manual angles");
          setManualAngles(prev => [...prev, selectedAngle]);
          setManualAnglesGenerated(true);
        }
      } else if (!isFromManual && !isManualMode) {
        // Check if this angle is already in the auto angles array
        const angleExists = autoAngles.some(angle => angle.title === selectedAngle.title);
        
        if (!angleExists) {
          console.log("Adding selected angle to auto angles");
          setAutoAngles(prev => [...prev, selectedAngle]);
          setAutoAnglesGenerated(true);
        }
      }
    }
    
    // Reset the force refresh flag
    setForceRefresh(false);
    
    setLoading(true);
    try {
      setError(null);
      
      // Get angles from backend
      const contentService = ContentGenerationService.getInstance();
      
      // Let the service sanitize the article using its internal method
      // The service will handle removing unsupported properties like 'rank' and 'explanation'
      const response = await contentService.generateAngles(
        topic,
        clientInfo,
        research,
        selectedArticle,
        isManualMode,
        manualResearch,
        customInstructions
      );
      
      // Save angles to the appropriate state based on mode
      if (isManualMode) {
        // For manual mode, we want to replace existing angles with new ones
        setManualAngles(response.angles);
        setManualAnglesGenerated(true);
        
        // If we have a callback to store angles at the parent level, call it
        if (onAnglesGenerated) {
          onAnglesGenerated(response.angles);
        }
      } else {
        // For auto mode, we either keep existing angles or set new ones if none exist
        setAutoAngles(prev => {
          // When force refreshing, we want to add new angles to existing ones
          if (forceRefresh && prev.length > 0) {
            return [...prev, ...response.angles];
          }
          // When fetching initially, we want to replace the angles
          return response.angles;
        });
        setAutoAnglesGenerated(true);
        
        // If we have a callback to store angles at the parent level, call it
        if (onAnglesGenerated) {
          onAnglesGenerated(response.angles);
        }
      }
      
      setRecommendedAngle(response.recommendedAngle);
      
    } catch (err: any) {
      console.error('Error generating angles:', err);
      setError(err.message || 'Failed to generate angles');
    } finally {
      setLoading(false);
    }
  };

  // We need to ensure we initialize from props BEFORE trying to fetch angles
  // This init effect runs first to set up state correctly
  useEffect(() => {
    // Initialize with existing angles if available
    if (existingAngles && existingAngles.length > 0) {
      console.log("Initializing with existing angles:", existingAngles.length);
      
      // Set auto angles to existing angles
      setAutoAngles(existingAngles);
      setAutoAnglesGenerated(true);
    }
    
    // If we already have a selected angle, we don't need to generate angles again
    if (selectedAngle) {
      console.log("Initializing with selectedAngle:", selectedAngle.title);
      
      // Set the auto/manual flag based on the properties of the selected angle
      // If it has certain properties we can assume it was from manual input
      const isFromManual = selectedAngle.engagementScore === 0 && !selectedAngle.explanation;
      setIsManualMode(isFromManual);
      
      // Mark the appropriate generation state as true to prevent unnecessary API calls
      if (isFromManual) {
        setManualAnglesGenerated(true);
        
        // If we have a selected angle from manual mode, initialize manualAngles array
        // We need at least the selected angle in the array
        setManualAngles(prev => {
          // Don't add duplicate angles
          if (prev.some(angle => angle.title === selectedAngle.title)) {
            return prev;
          }
          // Create an array with at least the selected angle
          return [...prev, selectedAngle];
        });
    } else {
        setAutoAnglesGenerated(true);
        
        // If we have a selected angle from auto mode, initialize autoAngles array
        // We need at least the selected angle in the array
        setAutoAngles(prev => {
          // Don't add duplicate angles
          if (prev.some(angle => angle.title === selectedAngle.title)) {
            return prev;
          }
          // Create an array with at least the selected angle
          return [...prev, selectedAngle];
        });
        
        // If there's only one angle (the selected one), fetch more angles
        // but don't set loading to true so we still see the selected angle
        if (autoAngles.length <= 1) {
          console.log("Only have the selected angle, silently fetching more");
          // This will add more angles without replacing the selected one
          // We'll set a flag to indicate this is a silent fetch
          const silentFetch = async () => {
            try {
              // Get angles from backend without showing loading state
              const contentService = ContentGenerationService.getInstance();
              const response = await contentService.generateAngles(
                topic,
                clientInfo,
                research,
                selectedArticle,
                false, // Not manual mode
                '', // No manual research
                '' // No custom instructions
              );
              
              // Add new angles while preserving the selected one
              setAutoAngles(prev => {
                const uniqueAngles = response.angles.filter(
                  newAngle => !prev.some(existingAngle => 
                    existingAngle.title === newAngle.title
                  )
                );
                return [...prev, ...uniqueAngles];
              });
              
              if (response.recommendedAngle) {
                setRecommendedAngle(response.recommendedAngle);
              }
            } catch (err) {
              console.error("Silent fetch error:", err);
              // Don't show error to user since this is a background operation
            }
          };
          
          // Slight delay to allow component to render first
          setTimeout(silentFetch, 500);
        }
      }
    }
  // Only run once on mount - but include selectedAngle to ensure this runs BEFORE the fetch effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAngle]);

  // This effect runs AFTER the initialization effect
  useEffect(() => {
    // Wait a small timeout to ensure state initialization has completed
    const timer = setTimeout(() => {
      // If we already have angles from props, don't fetch new angles on initial load
      if (existingAngles && existingAngles.length > 0) {
        console.log("Already have angles from props, skipping initial fetch");
        return;
      }
      
      // If we already have a selected angle, don't fetch new angles on initial load
      if (selectedAngle) {
        console.log("Already have selectedAngle, skipping initial fetch");
        return;
      }
      
      // Only fetch if we haven't already fetched for this mode
      if (isManualMode === false && !autoAnglesGenerated && autoAngles.length === 0) {
        console.log("Initial mount - fetching angles");
        fetchAngles();
      }
    }, 50); // Small delay to ensure state initialization completes first
    
    return () => clearTimeout(timer);
    
    // No dependencies to prevent re-fetching when navigating back
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add an effect to initialize manual research from selected angle if in manual mode
  useEffect(() => {
    if (isManualMode && selectedAngle && selectedAngle.engagementScore === 0 && !manualResearch) {
      // If we have a manual angle selected but no manual research entered,
      // we should initialize the research field with a sensible default
      setManualResearch(`Research points for angle: ${selectedAngle.title}`);
    }
  }, [isManualMode, selectedAngle, manualResearch]);

  // Handle angle selection
  const handleAngleSelect = (angle: ContentAngle) => {
    console.log("Selected angle:", angle.title);
    setCustomAngle('');
    onSelectAngle(angle);
  };

  // Handle custom angle input
  const handleCustomAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAngle(e.target.value);
  };

  // Handle mode toggle
  const handleModeToggle = (value: string | null) => {
    if (!value) return;
    
    const newIsManualMode = value === 'manual';
    const currentIsManualMode = isManualMode;
    
    // Clear the error if there is any
    setError(null);
    
    // Don't clear the selected angle when switching modes if we don't need to
    // We only need to clear it if:
    // 1. We have a selected angle AND
    // 2. The mode is changing AND
    // 3. The selected angle wasn't from a previous session
    if (selectedAngle && currentIsManualMode !== newIsManualMode) {
      // Only clear the selection if this angle doesn't make sense in the new mode
      // For auto mode: only keep if it has engagement score > 0
      // For manual mode: always keep the selection since any angle can be manually selected
      const shouldClearSelection = 
        !newIsManualMode && selectedAngle.engagementScore === 0;
      
      console.log("Mode toggle from", currentIsManualMode ? "manual" : "auto", 
        "to", newIsManualMode ? "manual" : "auto", 
        "- clearing selection:", shouldClearSelection);
      
      if (shouldClearSelection) {
        onSelectAngle(null);
      }
    }
    
    // Update mode after handling any necessary cleanup
    setIsManualMode(newIsManualMode);
    
    // If switching to manual mode with no angles, don't fetch yet
    if (newIsManualMode && !manualAnglesGenerated) {
      // We'll wait for the user to enter text and click Generate
      return;
    } 
    
    // If switching to auto mode and haven't fetched before, fetch now
    if (!newIsManualMode && !autoAnglesGenerated && autoAngles.length === 0) {
      fetchAngles();
    }
  };

  // Handle manual research input
  const handleManualResearchChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualResearch(e.target.value);
  };

  // Handle custom instructions input
  const handleCustomInstructionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInstructions(e.target.value);
  };

  // Handle manual generation
  const handleManualGenerate = () => {
    if (manualResearch) {
      // Set force refresh to true to bypass the cache checks
      setForceRefresh(true);
      fetchAngles();
    }
  };

  // Handle generate more angles
  const handleGenerateMore = () => {
    // Set force refresh to true to bypass the cache checks
    console.log("Generate more angles clicked");
    setForceRefresh(true);
    fetchAngles();
  };

  // Handle continue button click
  const handleContinue = () => {
    if (selectedAngle) {
      onContinue();
    } else if (customAngle) {
      const customAngleObj: ContentAngle = {
        title: customAngle,
        explanation: '',
        engagementScore: 0
      };
      onSelectAngle(customAngleObj);
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

  const switchLabel = isManualMode ? "Manual Mode" : "Auto Mode";

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
        <Title order={3} style={{ color: titleColor }}>Select an angle for your thread</Title>
        
          <Text style={{ color: textColor }} size="md">
            Choose an approach angle for your content about "{topic}".
          </Text>
          
        {selectedAngle && (
          <Alert 
            icon={<IconCheck size={16} />} 
            title="Angle Selected" 
            color={isDarkMode ? "grape" : "green"} 
            variant={isDarkMode ? "light" : "light"}
            styles={{
              root: {
                backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.15)' : undefined,
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
            You've selected the angle: <Text fw={700} span>{selectedAngle.title}</Text>
          </Alert>
        )}
          
        <Tabs 
          defaultValue="auto" 
          value={isManualMode ? "manual" : "auto"}
              onChange={handleModeToggle}
          variant="pills"
          radius="md"
          color="grape"
          classNames={{
            root: 'mb-6',
            list: isDarkMode ? 'bg-gray-900/30 border-b border-purple-900/30 p-3 gap-4 mb-6' : 'p-3 gap-4 mb-6',
            panel: 'mt-4'
          }}
        >
          <Tabs.List grow>
            <Tabs.Tab 
              value="auto" 
              className={`transition-all duration-300 ease-in-out transform ${
                !isManualMode ? (
                  isDarkMode 
                    ? 'bg-purple-800/70 border border-purple-900 text-white shadow-lg shadow-purple-900/30 -translate-y-1' 
                    : 'bg-grape-500 text-white shadow-md'
                ) : (
                  isDarkMode 
                    ? 'bg-gray-900/80 border border-purple-700 hover:bg-purple-800/70 hover:shadow-purple-900/40 hover:-translate-y-1' 
                    : 'hover:bg-grape-100 hover:-translate-y-1 hover:shadow-md'
                )
              }`}
              leftSection={
                <IconRobot 
                  size={18} 
                  stroke={1.5} 
                  className={!isManualMode ? 'text-white' : (isDarkMode ? 'text-purple-300' : 'text-grape-500')}
                />
              }
            >
              Auto Generation
            </Tabs.Tab>
            <Tabs.Tab 
              value="manual" 
              className={`transition-all duration-300 ease-in-out transform ${
                isManualMode ? (
                  isDarkMode 
                    ? 'bg-purple-800/70 border border-purple-900 text-white shadow-lg shadow-purple-900/30 -translate-y-1' 
                    : 'bg-grape-500 text-white shadow-md'
                ) : (
                  isDarkMode 
                    ? 'bg-gray-900/80 border border-purple-700 hover:bg-purple-800/70 hover:shadow-purple-900/40 hover:-translate-y-1' 
                    : 'hover:bg-grape-100 hover:-translate-y-1 hover:shadow-md'
                )
              }`}
              leftSection={
                <IconPencil 
                  size={18} 
                  stroke={1.5} 
                  className={isManualMode ? 'text-white' : (isDarkMode ? 'text-purple-300' : 'text-grape-500')}
                />
              }
            >
              Manual Input
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="auto" pt="md">
            {loading && !isManualMode ? (
              <LoadingErrorState 
                loading={loading} 
                error={error} 
                loadingMessage="Generating content angles..." 
                fullHeight={true}
              />
            ) : error && !isManualMode ? (
              <LoadingErrorState 
                loading={false} 
                error={error} 
                fullHeight={true}
              />
            ) : autoAngles.length > 0 && !isManualMode ? (
              <Stack gap="md">
                <Alert 
                  icon={<IconInfoCircle size={16} />} 
                  title="AI-Generated Angles" 
                  color={isDarkMode ? "dark" : "green"} 
                  variant={isDarkMode ? "filled" : "light"}
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
                  {selectedAngle
                    ? "You've selected an angle. You can choose a different one below."
                    : "Select the angle that best fits your content strategy for this topic."}
                </Alert>
                {autoAngles.map((angle, index) => (
                  <Card 
                    key={index}
                    shadow="sm" 
                    padding="lg" 
                    radius="md"
                    withBorder
                    onClick={() => handleAngleSelect(angle)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedAngle && selectedAngle.title === angle.title
                        ? selectedCardBgColor
                        : cardBgColor,
                      borderColor: selectedAngle && selectedAngle.title === angle.title
                        ? (isDarkMode ? 'rgba(90, 50, 140, 0.5)' : theme.colors.blue[3])
                        : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : undefined)
                    }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text fw={700} style={{ color: titleColor }}>
                        {angle.title}
                      </Text>
                      <Group gap="xs">
                        <Badge
                          color={angle.engagementScore >= 8 ? 'grape' : 'blue'}
                          variant={isDarkMode ? 'filled' : 'light'}
                        >
                          Engagement: {angle.engagementScore}/10
                        </Badge>
                        
                        {angle === recommendedAngle && (
                          <Badge
                            color="green"
                            variant={isDarkMode ? 'filled' : 'light'}
                          >
                            Recommended
                          </Badge>
                        )}
          </Group>
        </Group>

                    <Text size="sm" style={{ color: textColor }} mb="md">
                      {angle.explanation}
                    </Text>
                    
                    {selectedAngle && selectedAngle.title === angle.title && (
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
                <Group mt="md" justify="left">
                  <Button
                    leftSection={<IconRefresh size={18} />}
                    onClick={handleGenerateMore}
                    variant="light"
                    color={isDarkMode ? 'grape.4' : 'indigo'}
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
                    Generate More Angles
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Box py="xl" ta="center">
                <Text size="md" mb="md" style={{ color: textColor }}>
                  Click the button below to generate content angles
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
                  Generate Angles
                </Button>
              </Box>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="manual" pt="md">
            <Stack gap="md">
              <Alert 
                icon={<IconInfoCircle size={16} />} 
                title="Custom Research" 
                color={isDarkMode ? "dark" : "blue"} 
                variant={isDarkMode ? "filled" : "light"}
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
                {selectedAngle && selectedAngle.engagementScore === 0 
                  ? `You've selected "${selectedAngle.title}". You can enter new research to generate more angles.`
                  : "Enter your specific research points to generate tailored content angles."}
                {selectedAngle && selectedAngle.engagementScore === 0 && (
                  <Text size="sm" mt="xs" fw={600}>
                    Current angle: {selectedAngle.title}
                  </Text>
                )}
              </Alert>
            <Textarea
              label="Research Focus"
              description="Enter specific research points you want to focus on"
              placeholder="Enter the key points, facts, or perspectives you want to emphasize..."
              minRows={4}
              value={manualResearch}
              onChange={handleManualResearchChange}
              required
              styles={{
                input: {
                    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : undefined,
                  color: isDarkMode ? theme.colors.gray[2] : undefined,
                  borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
                },
                label: {
                  color: isDarkMode ? theme.colors.gray[3] : undefined,
                },
                description: {
                  color: isDarkMode ? theme.colors.gray[5] : undefined,
                },
              }}
            />
            
            <TextInput
              label="Custom Instructions (Optional)"
              description="Add any specific guidance for angle generation"
              placeholder="E.g., 'Focus on data privacy concerns' or 'Highlight business impact'..."
              value={customInstructions}
              onChange={handleCustomInstructionsChange}
              styles={{
                input: {
                    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : undefined,
                  color: isDarkMode ? theme.colors.gray[2] : undefined,
                  borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
                },
                label: {
                  color: isDarkMode ? theme.colors.gray[3] : undefined,
                },
                description: {
                  color: isDarkMode ? theme.colors.gray[5] : undefined,
                },
              }}
            />
            
            <Button
              onClick={handleManualGenerate}
                disabled={!manualResearch.trim() || loading}
              leftSection={<IconBulb size={18} />}
              color={isDarkMode ? 'grape.4' : 'indigo'}
                fullWidth
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
              Generate Angles
            </Button>

              {loading && isManualMode && (
        <LoadingErrorState 
          loading={loading} 
          error={error} 
          loadingMessage="Generating content angles..." 
                  fullHeight={false}
                />
              )}

              {error && !loading && isManualMode && (
                <LoadingErrorState 
                  loading={false} 
                  error={error} 
                  fullHeight={false}
                />
              )}

              {/* Only show angles in manual mode if they were generated in manual mode */}
              {!loading && !error && manualAngles.length > 0 && isManualMode && manualAnglesGenerated && (
                <Stack gap="md" mt="md">
                  {manualAngles.map((angle, index) => (
                <Card 
                  key={index}
                  shadow="sm" 
                  padding="lg" 
                  radius="md"
                  withBorder
                  onClick={() => handleAngleSelect(angle)}
                  style={{ 
                    cursor: 'pointer',
                        backgroundColor: selectedAngle && selectedAngle.title === angle.title
                      ? selectedCardBgColor
                      : cardBgColor,
                        borderColor: selectedAngle && selectedAngle.title === angle.title
                      ? (isDarkMode ? 'rgba(90, 50, 140, 0.5)' : theme.colors.blue[3])
                      : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : undefined)
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <Text fw={700} style={{ color: titleColor }}>
                      {angle.title}
                    </Text>
                    <Group gap="xs">
                      <Badge
                        color={angle.engagementScore >= 8 ? 'grape' : 'blue'}
                        variant={isDarkMode ? 'filled' : 'light'}
                      >
                        Engagement: {angle.engagementScore}/10
                      </Badge>
                      
                      {angle === recommendedAngle && (
                        <Badge
                          color="green"
                          variant={isDarkMode ? 'filled' : 'light'}
                        >
                          Recommended
                        </Badge>
                      )}
                    </Group>
                  </Group>
                  
                  <Text size="sm" style={{ color: textColor }} mb="md">
                    {angle.explanation}
                  </Text>
                  
                                        {selectedAngle && selectedAngle.title === angle.title && (
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
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

            <Divider my="sm" />

        <TextInput
          label="Or enter your own angle"
          placeholder="E.g., 'The Future of Remote Work in Tech'"
          value={customAngle}
          onChange={handleCustomAngleChange}
          leftSection={<IconPlus size={16} />}
          styles={{
            input: {
              backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.6)' : undefined,
              color: isDarkMode ? theme.colors.gray[2] : undefined,
              borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
            },
            label: {
              color: isDarkMode ? theme.colors.gray[3] : undefined,
            },
          }}
        />

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
            disabled={!selectedAngle && !customAngle.trim()}
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
            Continue with Selected Angle
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
} 