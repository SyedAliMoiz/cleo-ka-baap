"use client";

import React, { useState } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Box,
  Loader,
  Flex,
  Notification,
  useMantineTheme,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowRight,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "../../src/components/DashboardLayout/DashboardLayout";
import { StepIndicator } from "../../src/components/thread-writer/StepIndicator";
import { ClientSelectionStep } from "../../src/components/thread-writer/ClientSelectionStep";
import { TopicSelectionStep } from "../../src/components/thread-writer/TopicSelectionStep";
import { ResearchMethodStep } from "../../src/components/thread-writer/ResearchMethodStep";
import { ArticleRankingStep } from "../../src/components/thread-writer/ArticleRankingStep";
import { ResearchGenerationStep } from "../../src/components/thread-writer/ResearchGenerationStep";
import { HookGenerationStep } from "../../src/components/thread-writer/HookGenerationStep";
import { ThreadWritingStep } from "../../src/components/thread-writer/ThreadWritingStep";
import { Client, ClientService } from "../../src/utils/clientService";
import { useDarkMode } from "../../src/components/DarkModeProvider";
import {
  ClientInfo,
  ContentAngle,
  Hook,
  ContentGenerationService,
} from "../../src/utils/contentGenerationService";
import { Article } from "../../src/utils/newsService";
import { RankedArticle } from "../../src/utils/contentGenerationService";
import { AngleSelectionStep } from "../../src/components/thread-writer/AngleSelectionStep";

export default function ThreadWriterPage() {
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();
  const [step, setStep] = useState(1);
  const totalSteps = 8; // Updated to include ThreadWritingStep (8)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDetailsLoading, setIsClientDetailsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [researchData, setResearchData] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<RankedArticle | null>(
    null
  );
  const [inDepthResearch, setInDepthResearch] = useState<string>("");
  const [selectedAngle, setSelectedAngle] = useState<ContentAngle | null>(null);
  const [generatedAngles, setGeneratedAngles] = useState<ContentAngle[]>([]);
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);
  const [generatedThread, setGeneratedThread] = useState<any>(null);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const router = useRouter();

  const handleClientSelect = async (clientId: string) => {
    setSelectedClientId(clientId);
    setValidationError(null); // Clear any validation errors

    // Fetch more details about the selected client
    setIsClientDetailsLoading(true);
    try {
      const client = await ClientService.getClientById(clientId);
      setSelectedClient(client);

      // After client is loaded, immediately advance to next step
      if (step === 1) {
        // Clear validation error BEFORE advancing
        setValidationError(null);
        // Small timeout to ensure state updates are processed
        setTimeout(() => {
          setStep(2);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
    } finally {
      setIsClientDetailsLoading(false);
    }
  };

  // Ensure validation error is cleared when changing steps
  const setStepSafely = (newStep: number) => {
    // Clear any validation errors when changing steps
    setValidationError(null);
    setStep(newStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setValidationError(null); // Clear any validation errors
  };

  const handleResearchComplete = (data: any) => {
    setResearchData(data);
    setValidationError(null); // Clear any validation errors

    // Store custom instructions if they exist in the research data
    if (data.customInstructions) {
      setCustomInstructions(data.customInstructions);
    }
  };

  const handleArticleSelect = (article: RankedArticle) => {
    setSelectedArticle(article);
    setValidationError(null); // Clear any validation errors
  };

  const handleInDepthResearchComplete = (research: string) => {
    setInDepthResearch(research);
    setValidationError(null); // Clear any validation errors
  };

  const handleAngleSelect = (angle: ContentAngle) => {
    setSelectedAngle(angle);
    setValidationError(null); // Clear any validation errors
  };

  const handleHookSelect = (hook: Hook) => {
    setSelectedHook(hook);
    setValidationError(null); // Clear any validation errors
  };

  const handleSaveThread = async (thread: any) => {
    setGeneratedThread(thread);

    try {
      // Save the thread to the backend
      const contentService = ContentGenerationService.getInstance();
      const saveResponse = await contentService.saveThread({
        threadData: thread.threadData,
        thread: thread.thread,
        conversationHistory: thread.conversationHistory,
      });

      console.log("Thread saved successfully:", saveResponse);

      // Redirect to the chat detail page with the thread ID
      router.push(`/chats/${saveResponse.id}`);
    } catch (error) {
      console.error("Error saving thread:", error);
      setValidationError("Failed to save the thread. Please try again.");
    }
  };

  const handleContinue = () => {
    // Validate current step
    if (step === 1 && !selectedClientId) {
      setValidationError("Please select a client before continuing.");
      return;
    }

    if (step === 2 && !selectedTopic) {
      setValidationError("Please select or enter a topic before continuing.");
      return;
    }

    if (step === 3 && !researchData) {
      setValidationError("Please complete the research before continuing.");
      return;
    }

    if (step === 4 && !selectedArticle) {
      setValidationError("Please select an article before continuing.");
      return;
    }

    if (step === 5 && !inDepthResearch) {
      setValidationError(
        "Please wait for the research generation to complete."
      );
      return;
    }

    if (step === 6 && !selectedAngle) {
      setValidationError("Please select a content angle before continuing.");
      return;
    }

    if (step === 7 && !selectedHook) {
      setValidationError("Please select a hook before continuing.");
      return;
    }

    // Clear any validation errors when successfully proceeding
    setValidationError(null);

    if (step < totalSteps) {
      setStepSafely(step + 1);
    }
  };

  const handleBack = () => {
    // Clear validation errors when going back
    if (step > 1) {
      // Don't reset any state when going back - this preserves
      // all generated content and prevents unnecessary API calls
      setValidationError(null);
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Convert from Client to ClientInfo format for content generation
  const getClientInfo = (): ClientInfo | null => {
    if (!selectedClient) return null;

    return {
      id: selectedClient.id || selectedClient._id || "",
      name: selectedClient.name,
      bio: selectedClient.bio || undefined,
      nicheTags: selectedClient.tags || undefined,
      businessInfo: selectedClient.website || undefined,
      industry: selectedClient.industry || undefined,
    };
  };

  // New function to store generated angles
  const handleAnglesGenerated = (angles: ContentAngle[]) => {
    // Merge new angles with existing ones, avoiding duplicates
    setGeneratedAngles((prev) => {
      const newAngles = angles.filter(
        (newAngle) =>
          !prev.some((existingAngle) => existingAngle.title === newAngle.title)
      );
      return [...prev, ...newAngles];
    });
  };

  const renderStepContent = () => {
    // Clear validation error when rendering a new step
    if (validationError) {
      setValidationError(null);
    }

    switch (step) {
      case 1:
        return (
          <ClientSelectionStep
            selectedClientId={selectedClientId}
            onClientSelect={handleClientSelect}
            onContinue={handleContinue}
            onBack={step > 1 ? handleBack : undefined}
          />
        );
      case 2:
        return (
          <TopicSelectionStep
            client={selectedClient}
            onSelectTopic={handleTopicSelect}
            onContinue={handleContinue}
            onBack={step > 1 ? handleBack : undefined}
          />
        );
      case 3:
        return (
          <ResearchMethodStep
            client={selectedClient}
            topic={selectedTopic}
            onResearchComplete={handleResearchComplete}
            onContinue={handleContinue}
            onBack={step > 1 ? handleBack : undefined}
            initialCustomInstructions={customInstructions}
          />
        );
      case 4:
        return (
          <ArticleRankingStep
            articles={researchData?.articles || []}
            clientInfo={getClientInfo() as ClientInfo}
            topic={selectedTopic}
            onSelectArticle={handleArticleSelect}
            onContinue={handleContinue}
            onBack={step > 1 ? handleBack : undefined}
          />
        );
      case 5:
        return (
          <ResearchGenerationStep
            topic={selectedTopic}
            selectedArticle={selectedArticle || undefined}
            onResearchComplete={handleInDepthResearchComplete}
            onContinue={handleContinue}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <AngleSelectionStep
            topic={selectedTopic}
            clientInfo={getClientInfo() as ClientInfo}
            research={inDepthResearch}
            selectedArticle={selectedArticle}
            onSelectAngle={handleAngleSelect}
            onContinue={handleContinue}
            onBack={handleBack}
            selectedAngle={selectedAngle}
            existingAngles={generatedAngles}
            onAnglesGenerated={handleAnglesGenerated}
          />
        );
      case 7:
        // Hook generation step
        return selectedAngle ? (
          <HookGenerationStep
            topic={selectedTopic}
            clientInfo={getClientInfo() as ClientInfo}
            selectedAngle={selectedAngle}
            research={inDepthResearch}
            selectedArticle={selectedArticle}
            onHookSelect={handleHookSelect}
            onContinue={handleContinue}
            onBack={handleBack}
          />
        ) : (
          <Box style={{ textAlign: "center", padding: "2rem" }}>
            <Text color="red">
              Please go back and select a content angle first
            </Text>
          </Box>
        );
      case 8:
        // Thread Writing step (final step)
        return selectedAngle && selectedHook ? (
          <ThreadWritingStep
            threadData={{
              topic: selectedTopic,
              clientInfo: getClientInfo() as ClientInfo,
              research: inDepthResearch,
              selectedArticle: selectedArticle || undefined,
              selectedAngle: selectedAngle,
              selectedHook: selectedHook,
            }}
            onSaveThread={handleSaveThread}
            onComplete={() => {
              // Handle completion - could redirect to saved threads or show success message
              console.log("Thread writing complete");
            }}
          />
        ) : (
          <Box style={{ textAlign: "center", padding: "2rem" }}>
            <Text color="red">Please complete all previous steps first</Text>
          </Box>
        );
      default:
        return (
          <Box style={{ textAlign: "center", padding: "2rem" }}>
            <Text>Step {step} content is under development</Text>
            <Text size="sm" c={isDarkMode ? "gray.4" : "dimmed"} mt="md">
              This step will be implemented in upcoming tasks.
            </Text>
          </Box>
        );
    }
  };

  // Only show the navigation buttons for steps that don't have their own buttons
  // Steps 1-7 have their own Continue buttons, and step 8 has its own save button
  const showNavigationButtons = false; // Remove global buttons as each step has its own

  return (
    <DashboardLayout>
      <Container size="lg" pt="xl">
        <Paper
          shadow="xs"
          p="xl"
          withBorder
          style={{
            backgroundColor: isDarkMode ? theme.colors.gray[9] : "white",
            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : undefined,
            color: isDarkMode ? theme.colors.gray[2] : undefined,
          }}
        >
          <Title
            order={2}
            mb="xl"
            ta="center"
            style={{ color: isDarkMode ? theme.colors.gray[2] : undefined }}
          >
            Thread Writer
          </Title>

          <StepIndicator currentStep={step} totalSteps={totalSteps} />

          {validationError && (
            <Notification
              color="red"
              title="Action Required"
              withCloseButton={false}
              icon={<IconInfoCircle size={18} />}
              mb="md"
              styles={{
                root: {
                  backgroundColor: isDarkMode
                    ? "rgba(220, 38, 38, 0.15)"
                    : undefined,
                  color: isDarkMode ? "#FCA5A5" : undefined,
                  borderColor: isDarkMode
                    ? "rgba(220, 38, 38, 0.25)"
                    : undefined,
                },
                title: {
                  color: isDarkMode ? "#FCA5A5" : undefined,
                },
                description: {
                  color: isDarkMode ? "#FCA5A5" : undefined,
                },
              }}
            >
              {validationError}
            </Notification>
          )}

          {isClientDetailsLoading ? (
            <Box style={{ textAlign: "center", padding: "2rem" }}>
              <Loader color={isDarkMode ? "grape.4" : "indigo"} />
              <Text
                mt="md"
                style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}
              >
                Loading client details...
              </Text>
            </Box>
          ) : (
            <Box mt="xl" style={{ minHeight: "300px" }}>
              {renderStepContent()}
            </Box>
          )}

          {showNavigationButtons && (
            <Flex justify="space-between" align="center" mt="xl">
              <Button
                variant="outline"
                onClick={handleBack}
                leftSection={<IconArrowLeft size={16} />}
                color={isDarkMode ? "grape.4" : "indigo"}
                styles={{
                  root: {
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : undefined,
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(90, 50, 140, 0.15)"
                        : undefined,
                    },
                  },
                }}
              >
                Back
              </Button>

              <Button
                onClick={handleContinue}
                rightSection={<IconArrowRight size={16} />}
                color={isDarkMode ? "grape.4" : "indigo"}
                styles={{
                  root: {
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(90, 50, 140, 0.9)"
                        : undefined,
                    },
                  },
                }}
              >
                Continue
              </Button>
            </Flex>
          )}

          {selectedClient && step < 8 && (
            <Box
              mt="xl"
              py="xs"
              px="md"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(30, 30, 40, 0.5)"
                  : "#f8f9fa",
                borderRadius: "6px",
                border: isDarkMode
                  ? "1px solid rgba(90, 50, 140, 0.2)"
                  : "none",
              }}
            >
              <Text
                size="xs"
                style={{
                  color: isDarkMode
                    ? theme.colors.gray[5]
                    : theme.colors.gray[6],
                }}
              >
                Currently working on content for:{" "}
                <strong>{selectedClient.name}</strong>
              </Text>
              {selectedClient.industry && (
                <Text
                  size="xs"
                  style={{
                    color: isDarkMode
                      ? theme.colors.gray[5]
                      : theme.colors.gray[6],
                  }}
                >
                  Industry: <strong>{selectedClient.industry}</strong>
                </Text>
              )}
              {selectedTopic && (
                <Text
                  size="xs"
                  style={{
                    color: isDarkMode
                      ? theme.colors.gray[5]
                      : theme.colors.gray[6],
                  }}
                >
                  Topic: <strong>{selectedTopic}</strong>
                </Text>
              )}
              {researchData && (
                <Text
                  size="xs"
                  style={{
                    color: isDarkMode
                      ? theme.colors.gray[5]
                      : theme.colors.gray[6],
                  }}
                >
                  Research:{" "}
                  <strong>
                    {researchData.manualResearch
                      ? "Manual input"
                      : "Auto-generated"}
                  </strong>
                </Text>
              )}
              {selectedArticle && (
                <Text
                  size="xs"
                  style={{
                    color: isDarkMode
                      ? theme.colors.gray[5]
                      : theme.colors.gray[6],
                  }}
                >
                  Selected article: <strong>{selectedArticle.title}</strong>
                </Text>
              )}
              {selectedAngle && (
                <Text
                  size="xs"
                  style={{
                    color: isDarkMode
                      ? theme.colors.gray[5]
                      : theme.colors.gray[6],
                  }}
                >
                  Angle: <strong>{selectedAngle.title}</strong>
                </Text>
              )}
              {selectedHook && (
                <Text
                  size="xs"
                  style={{
                    color: isDarkMode
                      ? theme.colors.gray[5]
                      : theme.colors.gray[6],
                  }}
                >
                  Hook: <strong>{selectedHook.text}</strong>
                </Text>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </DashboardLayout>
  );
}
