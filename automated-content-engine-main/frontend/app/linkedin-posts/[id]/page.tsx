"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Box,
  Paper,
  Title,
  Text,
  Loader,
  Textarea,
  Button,
  Badge,
  Stack,
  Flex,
  Divider,
  useMantineTheme,
} from "@mantine/core";
import {
  IconSend,
  IconUser,
  IconBrandLinkedin,
  IconChevronDown,
  IconChevronRight,
  IconFileText,
  IconBriefcase,
} from "@tabler/icons-react";
import { useDarkMode } from "../../../src/components/DarkModeProvider";
import { apiHelpers } from "../../../src/utils/apiClient";
import { DashboardLayout } from "../../../src/components/DashboardLayout/DashboardLayout";
import { io, Socket } from "socket.io-client";

interface LinkedInPostData {
  thread: string;
  specificInstructions?: string;
  clientName?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function LinkedInPostChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();

  const [postData, setPostData] = useState<LinkedInPostData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialProcessing, setIsInitialProcessing] = useState(true);
  const [processingStep, setProcessingStep] = useState<
    "processing" | "fact-check" | "evaluation" | "optimization" | "complete"
  >("processing");
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const loadingRef = useRef<boolean>(false);

  const loadChatData = async () => {
    // Prevent duplicate simultaneous calls
    if (loadingRef.current) {
      console.log("loadChatData already in progress, skipping duplicate call");
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      console.log("Loading LinkedIn post chat data for ID:", id);
      const chatData = await apiHelpers.get(`/api/linkedin-post-chats/${id}`);
      console.log("Received LinkedIn post chat data:", chatData);

      const postDataToSet = {
        thread: (chatData as any).originalThread,
        specificInstructions: (chatData as any).specificInstructions,
        clientName: (chatData as any).clientName,
      };
      console.log("Setting post data:", postDataToSet);
      setPostData(postDataToSet);

      const conversationHistoryFromAPI =
        (chatData as any).conversationHistory || [];

      // Backend has already filtered out system prompts for security
      const allMessages = conversationHistoryFromAPI.map(
        (msg: any, index: number) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          isProcessingStepResponse: msg.isProcessingStepResponse,
          isSystemMessage: msg.isSystemMessage,
        })
      );

      // Separate regular chat messages from processing step responses and system messages
      const userMessages = allMessages
        .filter((msg: any) => {
          // Only include regular conversational messages (exclude processing step responses AND system messages)
          return !msg.isProcessingStepResponse && !msg.isSystemMessage;
        })
        .map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }));

      // Get processing step responses for the boxes
      const processingStepResponses = allMessages.filter(
        (msg: any) => msg.role === "assistant" && msg.isProcessingStepResponse
      );

      // Create processing steps from the responses
      const processingSteps = processingStepResponses.map(
        (response: any, index: number) => {
          const stepNumber = index + 1;
          return {
            step:
              stepNumber === 1
                ? "processing"
                : stepNumber === 2
                ? "fact-check"
                : stepNumber === 3
                ? "evaluation"
                : stepNumber === 4
                ? "optimization"
                : "unknown",
            timestamp: response.timestamp,
            response: response.content,
            responseTimestamp: response.timestamp,
          };
        }
      );

      setMessages(userMessages);
      setProcessingSteps(processingSteps);

      // Auto-expand the last processing step if no user messages
      if (processingSteps.length > 0 && userMessages.length === 0) {
        const lastStepIndex = processingSteps.length - 1;
        setExpandedSteps(new Set([lastStepIndex]));
      }

      // Determine initial processing state based on processing steps completed
      if (processingSteps.length >= 4) {
        console.log(
          "LOADER: Processing complete (4 steps found). Setting state."
        );
        setProcessingStep("complete");
        setIsInitialProcessing(false);
      } else if (userMessages.length > 0) {
        // If user has already interacted
        console.log("LOADER: User messages found, setting to complete.");
        setProcessingStep("complete");
        setIsInitialProcessing(false);
      } else if (processingSteps.length === 3) {
        console.log("LOADER: Setting step to optimization.");
        setProcessingStep("optimization");
        setIsInitialProcessing(true);
      } else if (processingSteps.length === 2) {
        console.log("LOADER: Setting step to evaluation.");
        setProcessingStep("evaluation");
        setIsInitialProcessing(true);
      } else if (processingSteps.length === 1) {
        console.log("LOADER: Setting step to fact-check.");
        setProcessingStep("fact-check");
        setIsInitialProcessing(true);
      } else {
        console.log("LOADER: Setting step to processing.");
        setProcessingStep("processing");
        setIsInitialProcessing(true);
      }
    } catch (error) {
      console.error("Error loading LinkedIn post chat data:", error);
      router.push("/linkedin-posts");
    } finally {
      setIsLoading(false);
      loadingRef.current = false; // Reset to allow future calls
    }
  };

  useEffect(() => {
    if (id) {
      // Reset loading state when id changes
      loadingRef.current = false;
      loadChatData();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll when processing steps are updated
  useEffect(() => {
    if (processingSteps.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [processingSteps]);

  useEffect(() => {
    // Additional check to ensure chat is enabled when processing is complete
    if (processingStep === "complete" && isInitialProcessing) {
      setIsInitialProcessing(false);
    }
  }, [processingStep, isInitialProcessing, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !postData || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);
    setIsInitialProcessing(false); // User has started chatting
    setProcessingStep("complete"); // We're now in conversational mode

    try {
      const result = await apiHelpers.post(
        `/api/linkedin-post-chats/${id}/message`,
        {
          message: currentMessage.trim(),
        }
      );

      // Add AI response to messages so it shows up immediately
      if (result && (result as any).response) {
        const aiMessage: Message = {
          role: "assistant",
          content: (result as any).response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderAIResponse = (step: any) => {
    if (!step.response) return null;

    // Render all steps as markdown with proper styling
    return (
      <Box
        className="markdown-content"
        style={{
          color: isDarkMode ? "#ffffff" : "#1a1a1a",
          lineHeight: 1.7,
          fontSize: "0.95rem",
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <Text
                fw={700}
                size="xl"
                mb="md"
                style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
              >
                {children}
              </Text>
            ),
            h2: ({ children }) => (
              <Text
                fw={600}
                size="lg"
                mb="sm"
                style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
              >
                {children}
              </Text>
            ),
            h3: ({ children }) => (
              <Text
                fw={600}
                size="md"
                mb="sm"
                style={{ color: isDarkMode ? "#f0f0f0" : "#2a2a2a" }}
              >
                {children}
              </Text>
            ),
            p: ({ children }) => (
              <Text
                mb="sm"
                style={{ color: isDarkMode ? "#e0e0e0" : "#2a2a2a" }}
              >
                {children}
              </Text>
            ),
            strong: ({ children }) => (
              <Text
                component="span"
                fw={600}
                style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
              >
                {children}
              </Text>
            ),
            ul: ({ children }) => (
              <Box
                component="ul"
                pl="md"
                mb="sm"
                style={{ color: isDarkMode ? "#e0e0e0" : "#2a2a2a" }}
              >
                {children}
              </Box>
            ),
            ol: ({ children }) => (
              <Box
                component="ol"
                pl="md"
                mb="sm"
                style={{ color: isDarkMode ? "#e0e0e0" : "#2a2a2a" }}
              >
                {children}
              </Box>
            ),
            li: ({ children }) => (
              <Text
                component="li"
                mb="xs"
                style={{ color: isDarkMode ? "#e0e0e0" : "#2a2a2a" }}
              >
                {children}
              </Text>
            ),
          }}
        >
          {step.response}
        </ReactMarkdown>
      </Box>
    );
  };

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

      socketRef.current = io(`${wsUrl}/linkedin-posts`, {
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
            | "processing"
            | "fact-check"
            | "evaluation"
            | "optimization"
            | "complete";
          processingStepData?: any;
        }) => {
          // Always add processing step data regardless of initial processing state
          if (data.processingStepData) {
            setProcessingSteps((prev) => {
              // Check if this step already exists to prevent duplicates
              const stepExists = prev.some(
                (step) => step.step === data.processingStepData.step
              );
              if (!stepExists) {
                return [...prev, data.processingStepData];
              } else {
                return prev;
              }
            });
          }

          // Use functional updates to avoid issues with stale state in closures
          setIsInitialProcessing((prevIsInitialProcessing) => {
            setProcessingStep((prevProcessingStep) => {
              // Only update processing step if initial processing is still ongoing OR it's complete
              if (prevIsInitialProcessing || data.step === "complete") {
                return data.step;
              }
              return prevProcessingStep; // Keep current step if initial processing already marked done by loadChatData
            });
            // If the update is 'complete', then initial processing is definitely over.
            if (data.step === "complete") {
              return false;
            }
            return prevIsInitialProcessing;
          });
        }
      );

      socket.on("processing-complete", () => {
        setIsInitialProcessing(false);
        setProcessingStep("complete");
      });

      socket.on("posts-update", (data: { posts: any[] }) => {
        // Posts updated
      });

      return () => {
        if (socket) {
          socket.emit("leave-chat", { chatId: id });
          socket.disconnect();
        }
      };
    }
  }, [id]);

  if (isLoading && !postData) {
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
              Loading LinkedIn post generator...
            </Text>
          </Box>
        </Box>
      </DashboardLayout>
    );
  }

  if (!postData) {
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
          <Text c="red">LinkedIn post chat not found</Text>
        </Box>
      </DashboardLayout>
    );
  }

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
      <Box style={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
        <Flex style={{ height: "100%", minHeight: 0 }}>
          {/* Left sidebar with post context information */}
          <Box
            style={{
              width: "450px",
              borderRight: isDarkMode
                ? "1px solid rgba(55, 65, 81, 0.3)"
                : "1px solid rgba(230, 230, 230, 0.7)",
              height: "100%",
              overflowY: "auto",
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
              }}
            >
              <Flex align="center" mb="md">
                <IconBrandLinkedin size={24} style={{ color: "#0077b5" }} />
                <Title
                  order={3}
                  ml="xs"
                  style={{
                    color: isDarkMode ? theme.colors.gray[2] : undefined,
                  }}
                >
                  Thread to LinkedIn Post Converter
                </Title>
              </Flex>

              <Badge
                radius="sm"
                color="blue.9"
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
                Active Session
              </Badge>

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
                Content Context
              </Text>

              <Stack gap="md" ml="xs" mt="md">
                {postData.clientName && (
                  <Flex align="center" gap="sm" mb="xs">
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
                        {postData.clientName}
                      </span>
                    </Text>
                  </Flex>
                )}
                <Box>
                  <Flex align="center" gap="sm" mb="xs">
                    <IconFileText
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
                      Original Thread:
                    </Text>
                  </Flex>
                  <Box
                    style={{
                      maxHeight: "400px",
                      overflow: "hidden",
                      position: "relative",
                      width: "100%",
                    }}
                  >
                    <Text
                      size="sm"
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[3]
                          : theme.colors.dark[7],
                        whiteSpace: "pre-wrap",
                        overflowY: "auto",
                        backgroundColor: isDarkMode
                          ? "rgba(0, 0, 0, 0.3)"
                          : "rgba(0, 0, 0, 0.08)",
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        maxHeight: "400px",
                        fontSize: "1rem",
                        lineHeight: 1.6,
                        border: isDarkMode
                          ? "1px solid rgba(90, 50, 140, 0.2)"
                          : "1px solid rgba(0, 0, 0, 0.1)",
                        width: "100%",
                        minHeight: "150px",
                        display: "block",
                        textAlign: "left",
                      }}
                    >
                      {postData.thread}
                    </Text>
                  </Box>
                </Box>

                {postData.specificInstructions && (
                  <Flex align="flex-start" gap="sm">
                    <IconFileText
                      size={20}
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[5]
                          : theme.colors.gray[6],
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                    <Box style={{ flex: 1 }}>
                      <Text
                        fw={600}
                        size="md"
                        style={{
                          color: isDarkMode
                            ? theme.colors.gray[4]
                            : theme.colors.gray[7],
                        }}
                      >
                        Instructions:
                      </Text>
                      <Text
                        size="sm"
                        mt="xs"
                        style={{
                          color: isDarkMode
                            ? theme.colors.gray[3]
                            : theme.colors.dark[7],
                          whiteSpace: "pre-wrap",
                          fontStyle: "italic",
                          fontSize: "0.85rem",
                          lineHeight: 1.4,
                        }}
                      >
                        {postData.specificInstructions}
                      </Text>
                    </Box>
                  </Flex>
                )}
              </Stack>
            </Paper>
          </Box>

          {/* Main content area */}
          <Box
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.7)" : "white",
            }}
          >
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
              {/* Initial processing status message - only show if no processing steps yet */}
              {isInitialProcessing &&
                messages.length === 0 &&
                processingSteps.length === 0 && (
                  <Box px="lg" pt="md" pl="xl" style={{ maxWidth: "85%" }}>
                    <Paper
                      p="xl"
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
                        marginBottom: "2rem",
                        textAlign: "center",
                      }}
                    >
                      <IconBrandLinkedin
                        size={36}
                        style={{
                          color: "#0077b5",
                          marginBottom: "0.75rem",
                        }}
                      />

                      <Text
                        size="lg"
                        fw={600}
                        mb="sm"
                        style={{
                          color: isDarkMode
                            ? theme.colors.gray[2]
                            : theme.colors.dark[7],
                        }}
                      >
                        Processing LinkedIn Post...
                      </Text>

                      <Text
                        size="sm"
                        mb="lg"
                        style={{
                          color: isDarkMode
                            ? theme.colors.gray[4]
                            : theme.colors.gray[6],
                        }}
                      >
                        Your thread is being analyzed and optimized for LinkedIn
                        engagement through our 4-step process.
                      </Text>

                      <Flex justify="center" align="center" gap="sm">
                        <Box
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: isDarkMode
                              ? theme.colors.violet[4]
                              : theme.colors.indigo[5],
                            animation: "dots 1.5s infinite ease-in-out",
                          }}
                        />
                        <Box
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: isDarkMode
                              ? theme.colors.violet[4]
                              : theme.colors.indigo[5],
                            animation: "dots 1.5s infinite ease-in-out 0.2s",
                          }}
                        />
                        <Box
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: isDarkMode
                              ? theme.colors.violet[4]
                              : theme.colors.indigo[5],
                            animation: "dots 1.5s infinite ease-in-out 0.4s",
                          }}
                        />
                      </Flex>
                    </Paper>
                  </Box>
                )}

              {/* Processing Steps */}
              {processingSteps.length > 0 && (
                <Box px="lg" pt="md" pl="xl" style={{ maxWidth: "85%" }}>
                  {processingSteps.map((step, index) => {
                    const isExpanded = expandedSteps.has(index);
                    return (
                      <Box key={index} mb="lg" style={{ maxWidth: "80%" }}>
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
                              "&:hover": {
                                backgroundColor: isDarkMode
                                  ? "rgba(90, 50, 140, 0.1)"
                                  : "rgba(102, 63, 180, 0.05)",
                              },
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
                                  {step.step === "processing"
                                    ? "🔄 Thread Processing"
                                    : step.step === "fact-check"
                                    ? "🔍 Fact Check"
                                    : step.step === "evaluation"
                                    ? "📊 LinkedIn Evaluation"
                                    : step.step === "optimization"
                                    ? "✨ Final Optimization"
                                    : "⚙️ Processing"}
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
                              <Box
                                style={{
                                  transform: isExpanded
                                    ? "rotate(90deg)"
                                    : "rotate(0deg)",
                                  transition: "transform 0.2s ease",
                                  color: isDarkMode
                                    ? theme.colors.gray[4]
                                    : theme.colors.gray[6],
                                }}
                              >
                                <IconChevronRight size={20} />
                              </Box>
                            </Flex>
                          </Box>

                          {/* Expandable Content */}
                          {isExpanded && (
                            <Box
                              px="lg"
                              pt="lg"
                              pb="lg"
                              style={{
                                borderTop: isDarkMode
                                  ? "1px solid rgba(138, 102, 214, 0.2)"
                                  : "1px solid rgba(138, 102, 214, 0.15)",
                                backgroundColor: isDarkMode
                                  ? "rgba(17, 24, 39, 0.4)"
                                  : "rgba(248, 250, 252, 0.8)",
                              }}
                            >
                              {renderAIResponse(step)}
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Current processing step indicator */}
              {isInitialProcessing &&
                processingStep !== "complete" &&
                processingStep !== "processing" && (
                  <Box px="lg" pt="md" pl="xl" style={{ maxWidth: "85%" }}>
                    <Box mb="lg" style={{ maxWidth: "80%" }}>
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
                          <Box
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              backgroundColor: isDarkMode
                                ? theme.colors.violet[4]
                                : theme.colors.indigo[5],
                              animation:
                                "typingAnimation 1.5s infinite ease-in-out",
                            }}
                          />
                          <Text
                            size="md"
                            fw={500}
                            style={{
                              color: isDarkMode
                                ? theme.colors.violet[3]
                                : theme.colors.indigo[6],
                            }}
                          >
                            {processingStep === "fact-check"
                              ? "🔍 Running fact check..."
                              : processingStep === "evaluation"
                              ? "📊 Evaluating for LinkedIn..."
                              : processingStep === "optimization"
                              ? "✨ Applying final optimization..."
                              : "⚙️ Processing..."}
                          </Text>
                        </Flex>
                      </Paper>
                    </Box>
                  </Box>
                )}

              {/* Regular chat messages */}
              <Box px="lg" pt="md" pl="xl" style={{ flexGrow: 1 }}>
                {messages.map((message, index) => (
                  <Flex
                    key={index}
                    justify={
                      message.role === "user" ? "flex-end" : "flex-start"
                    }
                    mb="lg"
                    style={{ width: "100%" }}
                  >
                    <Box
                      style={{
                        display: "flex",
                        flexDirection:
                          message.role === "user" ? "row-reverse" : "row",
                        alignItems: "flex-start",
                        gap: "12px",
                        maxWidth: "70%",
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
                              : "#0077b5",
                          color:
                            message.role === "user"
                              ? isDarkMode
                                ? "rgba(200, 170, 255, 0.9)"
                                : "rgba(102, 63, 180, 0.9)"
                              : "white",
                        }}
                      >
                        {message.role === "user" ? (
                          <IconUser size={20} stroke={1.5} />
                        ) : (
                          <IconBrandLinkedin size={20} stroke={1.5} />
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
                              : "#f9f9fb",
                          borderColor:
                            message.role === "user"
                              ? isDarkMode
                                ? "rgba(138, 102, 214, 0.5)"
                                : "rgba(138, 102, 214, 0.3)"
                              : isDarkMode
                              ? "rgba(100, 120, 150, 0.4)"
                              : "rgba(230, 230, 230, 0.7)",
                          border: `1px solid ${
                            message.role === "user"
                              ? isDarkMode
                                ? "rgba(138, 102, 214, 0.5)"
                                : "rgba(138, 102, 214, 0.3)"
                              : isDarkMode
                              ? "rgba(100, 120, 150, 0.4)"
                              : "rgba(230, 230, 230, 0.7)"
                          }`,
                          minWidth: "200px",
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
                  </Flex>
                ))}
              </Box>

              <div ref={messagesEndRef} />
            </Box>

            {/* Chat input */}
            {(!isInitialProcessing || processingStep === "complete") && (
              <Box
                style={{
                  borderTop: isDarkMode
                    ? "1px solid rgba(55, 65, 81, 0.3)"
                    : "1px solid rgba(230, 230, 230, 0.7)",
                  padding: "1rem 1.5rem",
                  backgroundColor: isDarkMode
                    ? "rgba(17, 24, 39, 0.9)"
                    : "white",
                }}
              >
                <Paper
                  p="sm"
                  radius="lg"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(30, 41, 59, 0.8)"
                      : "#f8f9fa",
                    border: isDarkMode
                      ? "1px solid rgba(90, 50, 140, 0.3)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                    position: "relative",
                  }}
                >
                  <Textarea
                    ref={textareaRef}
                    placeholder="Ask questions about the LinkedIn post or request modifications..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    minRows={2}
                    maxRows={5}
                    autosize
                    disabled={isLoading}
                    styles={{
                      input: {
                        backgroundColor: "transparent",
                        border: "none",
                        paddingRight: "60px",
                        color: isDarkMode ? theme.colors.gray[1] : undefined,
                        "&::placeholder": {
                          color: isDarkMode ? theme.colors.gray[5] : undefined,
                        },
                      },
                    }}
                  />

                  <Button
                    onClick={handleSendMessage}
                    loading={isLoading}
                    disabled={!currentMessage.trim() || isLoading}
                    radius="xl"
                    size="sm"
                    style={{
                      position: "absolute",
                      bottom: "16px",
                      right: "16px",
                      background:
                        "linear-gradient(135deg, #0077b5 0%, #005885 100%)",
                      width: "36px",
                      height: "36px",
                      padding: 0,
                      minWidth: "unset",
                    }}
                  >
                    {!isLoading && <IconSend size={16} />}
                  </Button>
                </Paper>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>
    </DashboardLayout>
  );
}
