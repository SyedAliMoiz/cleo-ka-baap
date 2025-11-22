"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Title,
  Text,
  Loader,
  Textarea,
  Button,
  Divider,
  Badge,
  Stack,
  Flex,
  Collapse,
  useMantineTheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { showErrorNotification } from "../../../src/utils/notifications";
import {
  IconSend,
  IconRobot,
  IconUser,
  IconInfoCircle,
  IconBrandX,
  IconBriefcase,
  IconFocus,
  IconTimeline,
  IconBrandHipchat,
  IconMessageCircle,
  IconPolygon,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { DashboardLayout } from "../../../src/components/DashboardLayout/DashboardLayout";
import { useDarkMode } from "../../../src/components/DarkModeProvider";
import { apiHelpers } from "../../../src/utils/apiClient";
import {
  ContentGenerationService,
  Message,
} from "../../../src/utils/contentGenerationService";
import { io, Socket } from "socket.io-client";

interface Thread {
  _id: string;
  title: string;
  client: {
    _id: string;
    name: string;
  };
  prompt: string;
  tweets: {
    content: string;
    position: number;
  }[];
  createdAt: string;
  status: string;
  metadata?: {
    conversationHistory?: Array<Message & { isHidden?: boolean }>;
  };
}

export default function ChatDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [threadData, setThreadData] = useState<any>(null);
  const [isThreadWriterChat, setIsThreadWriterChat] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [isInitialProcessing, setIsInitialProcessing] = useState(false);
  const [processingStep, setProcessingStep] =
    useState<string>("thread-generation");
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Parse the prompt JSON from the thread to display context info
  const extractThreadContext = (promptJson: string) => {
    try {
      const parsed = JSON.parse(promptJson);
      return {
        topic: parsed.topic || "",
        angle: parsed.angle?.title || "",
        hook: parsed.hook?.text || "",
        research: parsed.research
          ? `${parsed.research.substring(0, 100)}...`
          : "",
      };
    } catch (e) {
      console.error("Error parsing prompt JSON:", e);
      return { topic: "", angle: "", hook: "", research: "" };
    }
  };

  useEffect(() => {
    const fetchThreadWriterChat = async () => {
      try {
        setLoading(true);
        setIsThreadWriterChat(true);

        const data = await apiHelpers.get<any>(
          `/api/thread-writer/chats/${id}`
        );
        setThreadData(data);

        // Separate processing step responses from user messages
        const processingStepResponses =
          data.conversationHistory?.filter(
            (msg: any) =>
              msg.isProcessingStepResponse && msg.role === "assistant"
          ) || [];

        const userMessages =
          data.conversationHistory?.filter(
            (msg: any) =>
              !msg.isProcessingStepResponse &&
              !msg.isSystemMessage &&
              !msg.isHidden
          ) || [];

        // Create processing steps from the responses
        const processingSteps = processingStepResponses.map(
          (response: any, index: number) => {
            const stepNumber = index + 1;
            return {
              step:
                stepNumber === 1
                  ? "thread-generation"
                  : stepNumber === 2
                  ? "fact-check"
                  : stepNumber === 3
                  ? "apply-transition"
                  : stepNumber === 4
                  ? "evaluate-thread"
                  : stepNumber === 5
                  ? "apply-changes"
                  : "unknown",
              timestamp: response.timestamp,
              response: response.content,
              responseTimestamp: response.timestamp,
            };
          }
        );

        setConversationHistory(userMessages);
        setProcessingSteps(processingSteps);

        // Auto-expand the last processing step if no user messages
        if (processingSteps.length > 0 && userMessages.length === 0) {
          const lastStepIndex = processingSteps.length - 1;
          setExpandedSteps(new Set([lastStepIndex]));
        }

        // Set initial processing state based on whether processing is complete
        setIsInitialProcessing(!data.processingComplete);

        // Create a mock thread object for display compatibility
        setThread({
          _id: id as string,
          title: `Thread: ${data.topic}`,
          client: { _id: data.clientId, name: "Client" },
          prompt: JSON.stringify(data),
          tweets: data.generatedThread
            ? data.generatedThread
                .split("\n---\n")
                .map((content: string, index: number) => ({
                  content: content.trim(),
                  position: index,
                }))
            : [],
          createdAt: data.lastActivity || new Date().toISOString(),
          status: "active",
        });
      } catch (err: any) {
        console.error("Error fetching thread writer chat:", err);
        setError(err.message || "Failed to load thread writer chat");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchThreadWriterChat();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      // Determine WebSocket URL based on environment
      let wsUrl;
      if (typeof window !== "undefined") {
        if (
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"
        ) {
          // Development environment
          wsUrl = "http://localhost:4000";
        } else {
          // Production environment - use same host as the page with HTTPS
          const protocol =
            window.location.protocol === "https:" ? "https:" : "http:";
          wsUrl = `${protocol}//${window.location.hostname}`;
        }
      } else {
        // Fallback for SSR
        wsUrl = "http://localhost:4000";
      }

      socketRef.current = io(`${wsUrl}/thread-writer`, {
        path: "/socket.io/",
        transports: ["websocket", "polling"],
        timeout: 5000,
        forceNew: true,
      });
      const socket = socketRef.current;

      socket.on("connect", () => {
        socket.emit("join-chat", { chatId: id });
      });

      socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
      });

      socket.on(
        "processing-update",
        (data: {
          step:
            | "thread-generation"
            | "fact-check"
            | "apply-transition"
            | "evaluate-thread"
            | "apply-changes"
            | "complete";
          processingStepData?: any;
        }) => {
          console.log("Processing update received:", data);

          // Always add processing step data regardless of initial processing state
          if (data.processingStepData) {
            setProcessingSteps((prev) => {
              // Check if this step already exists to prevent duplicates
              const stepExists = prev.some(
                (step) => step.stepNumber === data.processingStepData.stepNumber
              );
              if (!stepExists) {
                const newSteps = [...prev, data.processingStepData];

                // Only auto-expand when all processing is complete (5 steps total)
                if (newSteps.length === 5) {
                  setConversationHistory((currentMessages) => {
                    if (currentMessages.length === 0) {
                      const lastStepIndex = newSteps.length - 1;
                      setExpandedSteps(new Set([lastStepIndex]));
                    }
                    return currentMessages;
                  });
                }

                return newSteps;
              } else {
                return prev;
              }
            });
          }

          // Update processing step
          setProcessingStep(data.step);

          // If the update is 'complete', then processing is definitely over
          if (data.step === "complete") {
            setIsInitialProcessing(false);
          }
        }
      );

      socket.on("processing-complete", () => {
        setIsInitialProcessing(false);
        setProcessingStep("complete");

        // Auto-expand only the last step if there are no user messages
        setConversationHistory((currentMessages) => {
          if (currentMessages.length === 0) {
            setProcessingSteps((currentSteps) => {
              if (currentSteps.length > 0) {
                const lastStepIndex = currentSteps.length - 1;
                setExpandedSteps(new Set([lastStepIndex])); // Only expand the last step
              }
              return currentSteps;
            });
          }
          return currentMessages;
        });
      });

      socket.on("thread-update", (data: { thread: any }) => {
        // Thread updated
        console.log("Thread update received:", data);
      });

      return () => {
        if (socket) {
          socket.emit("leave-chat", { chatId: id });
          socket.disconnect();
        }
      };
    }
  }, [id]);

  useEffect(() => {
    // Scroll to bottom whenever conversation updates
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  const toggleStepExpansion = (stepIndex: number) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex);
      } else {
        newSet.add(stepIndex);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!userInput.trim() || isSubmitting || !threadData) return;

    const messageToSend = userInput;
    setUserInput("");
    setIsSubmitting(true);

    // Add user message to conversation immediately for UI feedback
    const userMessage: Message = { role: "user", content: messageToSend };
    const optimisticHistory = [...conversationHistory, userMessage];
    setConversationHistory(optimisticHistory);

    try {
      // Call the thread writer chat API to get a response
      const response = await apiHelpers.post<{ response: string }>(
        `/api/thread-writer/chats/${id}/message`,
        {
          message: messageToSend,
        }
      );

      // Add AI response to conversation
      const aiMessage: Message = {
        role: "assistant",
        content: response.response,
      };
      setConversationHistory([...optimisticHistory, aiMessage]);
    } catch (err) {
      console.error("Error in conversation:", err);

      // On error, revert to the original conversation history (remove the optimistic user message)
      setConversationHistory(conversationHistory);

      // Show a temporary error notification
      showErrorNotification({
        title: "Error",
        message:
          "Sorry, I encountered an error processing your request. Please try again.",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePolishHook = async () => {
    if (!thread || !threadData) return;

    try {
      // Extract the current hook from the thread data
      const currentHook =
        threadData.selectedHook?.text || contextInfo.hook || "";

      // Get the latest thread content from conversation history (most recent assistant message)
      // If no conversation history, fall back to original thread
      let threadContext = "";

      // Find the latest assistant message (which contains the most recent thread version)
      const assistantMessages = conversationHistory.filter(
        (msg) => msg.role === "assistant"
      );

      if (assistantMessages.length > 0) {
        // Use the latest assistant message as the thread context
        threadContext = assistantMessages[assistantMessages.length - 1].content;
      } else {
        // Fall back to original thread if no conversation history
        threadContext = thread.tweets
          .map((tweet) => tweet.content)
          .join("\n\n");
      }

      // Get the client ID from thread.client (from thread writer data)
      const clientId = thread.client?._id;

      // Call the backend API to create or get existing hook polisher chat
      const response = await apiHelpers.post<{
        chatId: string;
        isExisting: boolean;
      }>("/api/hook-polisher-chats/create-or-get", {
        threadId: id,
        hook: currentHook,
        threadContext: threadContext,
        research: threadData.research || "", // Use the full research from threadData, not the truncated contextInfo
        angle: threadData.selectedAngle?.title || contextInfo.angle || "",
        clientId,
      });

      // Navigate to the hook polisher chat page with the returned chat ID
      router.push(`/hooks/${response.chatId}`);
    } catch (error) {
      console.error("Error creating/getting hook polisher chat:", error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box
          style={{
            height: "calc(100vh - 70px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box ta="center">
            <Loader color={isDarkMode ? "grape.4" : "indigo"} />
            <Text mt="md" c={isDarkMode ? "gray.5" : "dimmed"}>
              Loading conversation...
            </Text>
          </Box>
        </Box>
      </DashboardLayout>
    );
  }

  if (error || !thread) {
    return (
      <DashboardLayout>
        <Box
          style={{
            height: "calc(100vh - 70px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text c="red">{error || "Conversation not found"}</Text>
        </Box>
      </DashboardLayout>
    );
  }

  // Extract context information from the thread writer chat data
  const contextInfo = threadData
    ? {
        topic: threadData.topic || "",
        angle: threadData.selectedAngle?.title || "",
        hook: threadData.selectedHook?.text || "",
        research: threadData.research
          ? `${threadData.research.substring(0, 100)}...`
          : "",
      }
    : { topic: "", angle: "", hook: "", research: "" };

  return (
    <DashboardLayout>
      <style jsx global>{`
        @keyframes typingAnimation {
          0%,
          100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }
        @keyframes dots {
          0%,
          20% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
      <Box
        style={{
          height: "calc(100vh - 64px)",
          minHeight: 0,
          overflow: "hidden",
          margin: "-1.5rem",
          padding: "1.5rem",
        }}
      >
        <Flex style={{ height: "100%", minHeight: 0 }}>
          {/* Left sidebar with context information */}
          <Box
            style={{
              width: "350px",
              borderRight: isDarkMode
                ? "1px solid rgba(55, 65, 81, 0.3)"
                : "1px solid rgba(230, 230, 230, 0.7)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              padding: "1.5rem",
            }}
          >
            <Paper
              p="xl"
              withBorder
              radius="md"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(30, 41, 59, 0.8)"
                  : "#f8f9fa",
                borderColor: isDarkMode ? "rgba(90, 50, 140, 0.3)" : undefined,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Flex align="center" mb="md">
                <IconBrandX
                  size={24}
                  style={{
                    color: isDarkMode ? theme.colors.gray[3] : undefined,
                  }}
                />
                <Title
                  order={3}
                  ml="xs"
                  style={{
                    color: isDarkMode ? theme.colors.gray[2] : undefined,
                  }}
                >
                  {thread.title}
                </Title>
              </Flex>

              {thread.createdAt && (
                <Badge
                  radius="sm"
                  color={isDarkMode ? "violet.9" : "indigo.9"}
                  variant="filled"
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    opacity: 0.95,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    padding: "4px 10px",
                    color: "#ffffff",
                    marginBottom: "0.8rem",
                  }}
                >
                  {new Date(thread.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              )}

              <Divider
                my="md"
                style={{
                  borderColor: isDarkMode
                    ? "rgba(90, 50, 140, 0.4)"
                    : undefined,
                  borderWidth: "0.5px",
                }}
              />

              <Text
                fw={600}
                size="xl"
                mb="md"
                style={{
                  color: isDarkMode
                    ? theme.colors.gray[3]
                    : theme.colors.dark[6],
                }}
              >
                Context Information
              </Text>

              {/* Scrollable content area */}
              <Box
                style={{
                  flex: 1,
                  overflowY: "auto",
                  minHeight: 0,
                  paddingRight: "8px",
                  marginBottom: "1rem",
                }}
              >
                <Stack gap="md" ml="xs">
                  <Flex align="center" gap="sm">
                    <IconBriefcase
                      size={20}
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[5]
                          : theme.colors.gray[6],
                        flexShrink: 0,
                      }}
                    />
                    <Text
                      fw={600}
                      size="md"
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[4]
                          : theme.colors.gray[7],
                      }}
                    >
                      Client:{" "}
                      <span
                        style={{
                          fontWeight: "normal",
                          color: isDarkMode
                            ? theme.colors.gray[3]
                            : theme.colors.dark[7],
                        }}
                      >
                        {thread.client?.name || "Unknown"}
                      </span>
                    </Text>
                  </Flex>

                  <Flex align="center" gap="sm">
                    <IconTimeline
                      size={20}
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[5]
                          : theme.colors.gray[6],
                        flexShrink: 0,
                      }}
                    />
                    <Text
                      fw={600}
                      size="md"
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[4]
                          : theme.colors.gray[7],
                      }}
                    >
                      Angle:{" "}
                      <span
                        style={{
                          fontWeight: "normal",
                          color: isDarkMode
                            ? theme.colors.gray[3]
                            : theme.colors.dark[7],
                        }}
                      >
                        {contextInfo.angle}
                      </span>
                    </Text>
                  </Flex>

                  <Flex align="flex-start" gap="sm">
                    <IconBrandHipchat
                      size={20}
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[5]
                          : theme.colors.gray[6],
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        fw={600}
                        size="md"
                        style={{
                          color: isDarkMode
                            ? theme.colors.gray[4]
                            : theme.colors.gray[7],
                        }}
                      >
                        Hook:
                      </Text>
                      <Text
                        size="md"
                        style={{
                          fontWeight: "normal",
                          color: isDarkMode
                            ? theme.colors.gray[3]
                            : theme.colors.dark[7],
                          fontStyle: "italic",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                          marginTop: "4px",
                          wordBreak: "break-word",
                        }}
                      >
                        {contextInfo.hook}
                      </Text>
                    </Box>
                  </Flex>
                </Stack>
              </Box>

              {/* Fixed button at bottom */}
              <Button
                onClick={handlePolishHook}
                color={isDarkMode ? "grape.4" : "indigo"}
                radius="md"
                fullWidth
                leftSection={<IconPolygon size={18} />}
                disabled={!threadData || !thread}
                styles={{
                  root: {
                    backgroundColor: isDarkMode
                      ? "rgba(90, 50, 140, 0.8)"
                      : undefined,
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(90, 50, 140, 0.9)"
                        : undefined,
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                    "&:disabled": {
                      backgroundColor: isDarkMode
                        ? "rgba(30, 30, 40, 0.5)"
                        : undefined,
                      color: isDarkMode ? theme.colors.gray[5] : undefined,
                      cursor: "not-allowed",
                      transform: "none",
                      boxShadow: "none",
                    },
                    transition: "all 0.2s ease",
                  },
                }}
              >
                Polish Hook Now
              </Button>
            </Paper>

            {/* Thread preview section - commented out for now */}
          </Box>

          {/* Right side: Chat interface - taking full remaining width */}
          <Box
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <Paper
              p="xl"
              style={{
                backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.7)" : "white",
                borderColor: isDarkMode ? "rgba(90, 50, 140, 0.2)" : undefined,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderRadius: 0,
                overflow: "hidden",
              }}
            >
              {/* Chat header */}
              <Flex align="center" mb="lg">
                <IconMessageCircle
                  size={24}
                  style={{
                    color: isDarkMode
                      ? theme.colors.violet[4]
                      : theme.colors.indigo[5],
                  }}
                />
                <Text
                  fw={600}
                  size="lg"
                  ml="xs"
                  style={{
                    color: isDarkMode
                      ? theme.colors.gray[2]
                      : theme.colors.dark[7],
                  }}
                >
                  Thread Assistant
                </Text>
              </Flex>

              <Divider
                mb="md"
                style={{
                  borderColor: isDarkMode
                    ? "rgba(90, 50, 140, 0.2)"
                    : undefined,
                }}
              />

              {/* Messages container */}
              <Box
                style={{
                  flexGrow: 1,
                  overflowY: "auto",
                  paddingRight: "8px",
                  marginBottom: "1rem",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Processing Steps History with Collapsible AI Responses */}
                <Box px="lg">
                  {processingSteps.map((step, index) => {
                    const isExpanded = expandedSteps.has(index);
                    const stepTitles = {
                      "thread-generation": "✨ Thread Generation",
                      "fact-check": "🔍 Fact Check",
                      "apply-transition": "🔄 Apply Transition",
                      "evaluate-thread": "📊 Evaluate Thread",
                      "apply-changes": "✅ Apply Changes",
                    };

                    return (
                      <Box key={index} mb="lg">
                        <Paper
                          radius="lg"
                          shadow="sm"
                          style={{
                            backgroundColor: isDarkMode
                              ? "rgba(30, 41, 59, 0.8)"
                              : "#ffffff",
                            borderColor: isDarkMode
                              ? "rgba(138, 102, 214, 0.3)"
                              : "rgba(138, 102, 214, 0.2)",
                            border: `1px solid ${
                              isDarkMode
                                ? "rgba(138, 102, 214, 0.3)"
                                : "rgba(138, 102, 214, 0.2)"
                            }`,
                            overflow: "hidden",
                          }}
                        >
                          {/* Clickable Header */}
                          <Box
                            p="lg"
                            style={{
                              cursor: "pointer",
                              transition: "background-color 0.2s ease",
                            }}
                            onClick={() => toggleStepExpansion(index)}
                          >
                            <Flex align="center" justify="space-between">
                              <Flex align="center" gap="md">
                                <Text
                                  size="md"
                                  fw={600}
                                  style={{
                                    color: isDarkMode
                                      ? theme.colors.violet[3]
                                      : theme.colors.indigo[6],
                                  }}
                                >
                                  {stepTitles[step.step] ||
                                    step.step.replace("-", " ")}
                                </Text>
                                <Badge
                                  size="sm"
                                  color={isDarkMode ? "violet" : "indigo"}
                                  variant="light"
                                  style={{ fontWeight: 500 }}
                                >
                                  {new Date(step.timestamp).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </Badge>
                              </Flex>
                              {isExpanded ? (
                                <IconChevronDown
                                  size={20}
                                  style={{
                                    color: isDarkMode
                                      ? theme.colors.gray[4]
                                      : theme.colors.gray[6],
                                    transition: "transform 0.2s ease",
                                  }}
                                />
                              ) : (
                                <IconChevronRight
                                  size={20}
                                  style={{
                                    color: isDarkMode
                                      ? theme.colors.gray[4]
                                      : theme.colors.gray[6],
                                    transition: "transform 0.2s ease",
                                  }}
                                />
                              )}
                            </Flex>
                          </Box>

                          {/* Collapsible Content */}
                          <Collapse in={isExpanded}>
                            {step.response && (
                              <Box
                                px="lg"
                                pb="lg"
                                style={{
                                  backgroundColor: isDarkMode
                                    ? "rgba(15, 23, 42, 0.8)"
                                    : "#f1f3f4",
                                  borderTop: `1px solid ${
                                    isDarkMode
                                      ? "rgba(138, 102, 214, 0.2)"
                                      : "rgba(138, 102, 214, 0.15)"
                                  }`,
                                }}
                              >
                                <Box
                                  p="lg"
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? "rgba(15, 25, 35, 0.9)"
                                      : "#ffffff",
                                    borderRadius: "12px",
                                    border: `2px solid ${
                                      isDarkMode
                                        ? "rgba(255, 255, 255, 0.15)"
                                        : "rgba(0, 0, 0, 0.08)"
                                    }`,
                                    marginTop: "1rem",
                                    boxShadow: isDarkMode
                                      ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                                      : "0 2px 8px rgba(0, 0, 0, 0.1)",
                                  }}
                                >
                                  <Text
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      color: isDarkMode
                                        ? theme.colors.gray[1]
                                        : theme.colors.dark[7],
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    {step.response}
                                  </Text>
                                </Box>
                              </Box>
                            )}
                          </Collapse>
                        </Paper>
                      </Box>
                    );
                  })}
                </Box>

                {/* Current processing step - show after completed steps */}
                {isInitialProcessing && processingStep !== "complete" && (
                  <Box px="lg">
                    <Box mb="lg">
                      <Paper
                        p="lg"
                        radius="lg"
                        shadow="sm"
                        style={{
                          backgroundColor: isDarkMode
                            ? "rgba(30, 41, 59, 0.8)"
                            : "#ffffff",
                          borderColor: isDarkMode
                            ? "rgba(138, 102, 214, 0.3)"
                            : "rgba(138, 102, 214, 0.2)",
                          border: `1px solid ${
                            isDarkMode
                              ? "rgba(138, 102, 214, 0.3)"
                              : "rgba(138, 102, 214, 0.2)"
                          }`,
                        }}
                      >
                        <Flex align="center" gap="md">
                          <Text
                            component="div"
                            size="md"
                            fw={600}
                            style={{
                              color: isDarkMode
                                ? theme.colors.violet[3]
                                : theme.colors.indigo[6],
                            }}
                          >
                            {processingStep === "thread-generation" ? (
                              <Flex align="center" gap="sm">
                                <span>✨ Thread Generation</span>
                                <Box
                                  component="span"
                                  style={{ display: "inline-flex", gap: "2px" }}
                                >
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.2s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.4s",
                                    }}
                                  >
                                    .
                                  </Box>
                                </Box>
                              </Flex>
                            ) : processingStep === "fact-check" ? (
                              <Flex align="center" gap="sm">
                                <span>🔍 Fact Check</span>
                                <Box
                                  component="span"
                                  style={{ display: "inline-flex", gap: "2px" }}
                                >
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.2s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.4s",
                                    }}
                                  >
                                    .
                                  </Box>
                                </Box>
                              </Flex>
                            ) : processingStep === "apply-transition" ? (
                              <Flex align="center" gap="sm">
                                <span>🔄 Apply Transition</span>
                                <Box
                                  component="span"
                                  style={{ display: "inline-flex", gap: "2px" }}
                                >
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.2s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.4s",
                                    }}
                                  >
                                    .
                                  </Box>
                                </Box>
                              </Flex>
                            ) : processingStep === "evaluate-thread" ? (
                              <Flex align="center" gap="sm">
                                <span>📊 Evaluate Thread</span>
                                <Box
                                  component="span"
                                  style={{ display: "inline-flex", gap: "2px" }}
                                >
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.2s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.4s",
                                    }}
                                  >
                                    .
                                  </Box>
                                </Box>
                              </Flex>
                            ) : processingStep === "apply-changes" ? (
                              <Flex align="center" gap="sm">
                                <span>✅ Apply Changes</span>
                                <Box
                                  component="span"
                                  style={{ display: "inline-flex", gap: "2px" }}
                                >
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.2s",
                                    }}
                                  >
                                    .
                                  </Box>
                                  <Box
                                    component="span"
                                    style={{
                                      animation: "dots 1.4s infinite",
                                      animationDelay: "0.4s",
                                    }}
                                  >
                                    .
                                  </Box>
                                </Box>
                              </Flex>
                            ) : (
                              "Processing..."
                            )}
                          </Text>
                          <Badge
                            size="sm"
                            color="yellow"
                            variant="light"
                            style={{ fontWeight: 500 }}
                          >
                            In Progress
                          </Badge>
                        </Flex>
                      </Paper>
                    </Box>
                  </Box>
                )}

                {/* Welcome message if no conversation history */}
                {conversationHistory.filter(
                  (msg) =>
                    msg.role !== "system" &&
                    !(msg.role === "user" && msg.isHidden)
                ).length === 0 &&
                  processingSteps.length === 0 &&
                  !isInitialProcessing && (
                    <Box
                      p="xl"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "200px",
                        textAlign: "center",
                        color: isDarkMode
                          ? theme.colors.gray[4]
                          : theme.colors.gray[6],
                      }}
                    >
                      <IconMessageCircle
                        size={48}
                        stroke={1.5}
                        style={{ marginBottom: "16px", opacity: 0.6 }}
                      />
                      <Text size="lg" fw={600} mb="xs">
                        Thread Conversation
                      </Text>
                      <Text size="sm" style={{ maxWidth: "400px" }}>
                        Ask questions about your thread, request modifications,
                        or get help with content improvements.
                      </Text>
                    </Box>
                  )}

                {/* Chat Messages */}
                <Box px="lg">
                  {conversationHistory
                    .filter(
                      (message) =>
                        message.role !== "system" &&
                        !(message.role === "user" && message.isHidden)
                    ) // Hide system messages and hidden user messages, but show all assistant messages
                    .map((message, index) => (
                      <Box
                        key={index}
                        py="md"
                        px="md"
                        style={{
                          width: "100%",
                          alignSelf:
                            message.role === "user" ? "flex-end" : "flex-start",
                        }}
                      >
                        <Box
                          style={{
                            display: "flex",
                            flexDirection:
                              message.role === "user" ? "row-reverse" : "row",
                            alignItems: "flex-start",
                            gap: "12px",
                          }}
                        >
                          <Box
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              backgroundColor:
                                message.role === "user"
                                  ? isDarkMode
                                    ? "rgba(138, 102, 214, 0.4)"
                                    : "rgba(138, 102, 214, 0.2)"
                                  : isDarkMode
                                  ? "rgba(25, 195, 125, 0.3)"
                                  : "rgba(25, 195, 125, 0.15)",
                              color:
                                message.role === "user"
                                  ? isDarkMode
                                    ? "rgba(200, 170, 255, 0.9)"
                                    : "rgba(102, 63, 180, 0.9)"
                                  : isDarkMode
                                  ? "rgba(156, 245, 193, 0.9)"
                                  : "rgba(25, 195, 125, 0.9)",
                            }}
                          >
                            {message.role === "user" ? (
                              <IconUser size={20} stroke={1.5} />
                            ) : (
                              <IconRobot size={20} stroke={1.5} />
                            )}
                          </Box>

                          <Paper
                            p="md"
                            radius="md"
                            style={{
                              backgroundColor:
                                message.role === "user"
                                  ? isDarkMode
                                    ? "rgba(90, 50, 140, 0.4)"
                                    : "rgba(102, 63, 180, 0.1)"
                                  : isDarkMode
                                  ? "rgba(40, 50, 70, 0.8)"
                                  : "#ffffff",
                              borderColor:
                                message.role === "user"
                                  ? isDarkMode
                                    ? "rgba(138, 102, 214, 0.5)"
                                    : "rgba(138, 102, 214, 0.3)"
                                  : isDarkMode
                                  ? "rgba(100, 120, 150, 0.4)"
                                  : "rgba(230, 230, 230, 0.7)",
                              maxWidth: "calc(100% - 48px)",
                            }}
                          >
                            <Text
                              style={{
                                whiteSpace: "pre-wrap",
                                color:
                                  message.role === "user"
                                    ? isDarkMode
                                      ? theme.colors.gray[0]
                                      : theme.colors.dark[7]
                                    : isDarkMode
                                    ? theme.colors.gray[1]
                                    : theme.colors.dark[8],
                                lineHeight: 1.6,
                                fontSize: "0.95rem",
                              }}
                            >
                              {message.content}
                            </Text>
                          </Paper>
                        </Box>
                      </Box>
                    ))}
                </Box>

                {/* Typing indicator when waiting for AI response */}
                {isSubmitting && (
                  <Box
                    py="md"
                    px="md"
                    style={{
                      width: "100%",
                      alignSelf: "flex-start",
                    }}
                  >
                    <Box
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <Box
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          backgroundColor: isDarkMode
                            ? "rgba(25, 195, 125, 0.3)"
                            : "rgba(25, 195, 125, 0.15)",
                          color: isDarkMode
                            ? "rgba(156, 245, 193, 0.9)"
                            : "rgba(25, 195, 125, 0.9)",
                        }}
                      >
                        <IconRobot size={20} stroke={1.5} />
                      </Box>

                      <Paper
                        p="md"
                        radius="md"
                        style={{
                          backgroundColor: isDarkMode
                            ? "rgba(25, 30, 45, 0.5)"
                            : "#f9f9fb",
                          borderColor: isDarkMode
                            ? "rgba(55, 65, 81, 0.3)"
                            : "rgba(230, 230, 230, 0.7)",
                        }}
                      >
                        <Box
                          style={{
                            display: "flex",
                            gap: "4px",
                            alignItems: "center",
                            height: "24px",
                          }}
                        >
                          <Box
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: isDarkMode
                                ? "rgba(25, 195, 125, 0.7)"
                                : "rgba(25, 195, 125, 0.5)",
                              borderRadius: "50%",
                              animation: "typingAnimation 1s infinite",
                              animationDelay: "0s",
                            }}
                          />
                          <Box
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: isDarkMode
                                ? "rgba(25, 195, 125, 0.7)"
                                : "rgba(25, 195, 125, 0.5)",
                              borderRadius: "50%",
                              animation: "typingAnimation 1s infinite",
                              animationDelay: "0.2s",
                            }}
                          />
                          <Box
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: isDarkMode
                                ? "rgba(25, 195, 125, 0.7)"
                                : "rgba(25, 195, 125, 0.5)",
                              borderRadius: "50%",
                              animation: "typingAnimation 1s infinite",
                              animationDelay: "0.4s",
                            }}
                          />
                        </Box>
                      </Paper>
                    </Box>
                  </Box>
                )}

                <div ref={bottomRef} />
              </Box>

              {/* Input box */}
              <Box
                style={{
                  borderTop: isDarkMode
                    ? "1px solid rgba(55, 65, 81, 0.3)"
                    : "1px solid rgba(230, 230, 230, 0.7)",
                  paddingTop: "16px",
                  width: "100%",
                }}
              >
                <Paper
                  p="sm"
                  radius="lg"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(24, 28, 38, 0.7)"
                      : "#f7f7f9",
                    border: isDarkMode
                      ? "1px solid rgba(55, 65, 81, 0.5)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                    boxShadow: "0 1px 6px rgba(0, 0, 0, 0.1)",
                    marginBottom: "8px",
                    position: "relative",
                  }}
                >
                  <Textarea
                    placeholder="Message the AI assistant about your thread..."
                    value={userInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    minRows={2}
                    maxRows={5}
                    autosize
                    radius="md"
                    disabled={isSubmitting}
                    size="md"
                    styles={{
                      root: {
                        border: "none",
                        position: "relative",
                      },
                      input: {
                        backgroundColor: "transparent",
                        color: isDarkMode ? theme.colors.gray[1] : undefined,
                        border: "none",
                        fontSize: "16px",
                        padding: "12px 16px",
                        paddingRight: "60px", // Make room for the send button
                        "&:focus": {
                          border: "none",
                          outline: "none",
                        },
                        "&::placeholder": {
                          color: isDarkMode ? theme.colors.gray[5] : undefined,
                          fontSize: "14px",
                        },
                      },
                    }}
                  />

                  <Button
                    onClick={handleSubmit}
                    color={isDarkMode ? "grape.4" : "indigo"}
                    loading={isSubmitting}
                    disabled={!userInput.trim() || isSubmitting}
                    radius="xl"
                    size="sm"
                    styles={{
                      root: {
                        backgroundColor: isDarkMode
                          ? "rgba(90, 50, 140, 0.7)"
                          : undefined,
                        width: "36px",
                        height: "36px",
                        padding: 0,
                        minWidth: "unset",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "absolute",
                        bottom: "16px",
                        right: "16px",
                        zIndex: 5,
                        "&:disabled": {
                          backgroundColor: isDarkMode
                            ? "rgba(30, 30, 40, 0.5)"
                            : undefined,
                          color: isDarkMode ? theme.colors.gray[5] : undefined,
                          cursor: "not-allowed",
                          transform: "none",
                          boxShadow: "none",
                        },
                        transition: "all 0.2s ease",
                      },
                    }}
                  >
                    {!isSubmitting && <IconSend size={16} />}
                  </Button>
                </Paper>
              </Box>
            </Paper>
          </Box>
        </Flex>
      </Box>
    </DashboardLayout>
  );
}
