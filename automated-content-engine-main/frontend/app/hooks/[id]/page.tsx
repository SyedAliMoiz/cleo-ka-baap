"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
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
  ScrollArea,
  Divider,
  Collapse,
  Card,
  useMantineTheme,
} from "@mantine/core";
import {
  IconSend,
  IconRobot,
  IconUser,
  IconBriefcase,
  IconTimeline,
  IconBrandHipchat,
  IconMessageCircle,
  IconPolygon,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconCheck,
  IconBrandX,
} from "@tabler/icons-react";
import { useDarkMode } from "../../../src/components/DarkModeProvider";
import { apiHelpers } from "../../../src/utils/apiClient";
import { DashboardLayout } from "../../../src/components/DashboardLayout/DashboardLayout";

interface HookData {
  hook: string;
  threadContext?: string;
  research?: string;
  angle?: string;
  clientName?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function HookPolisherChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();

  const [hookData, setHookData] = useState<HookData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [processingSteps, setProcessingSteps] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialPolishing, setIsInitialPolishing] = useState(true);
  const [processingStep, setProcessingStep] = useState<
    "polishing" | "fact-check" | "hook-fact-check" | "complete"
  >("polishing");
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set()); // Track which steps are expanded

  // Hook selection state
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const loadingRef = useRef<boolean>(false); // Prevent duplicate API calls

  const loadChatData = async () => {
    // Prevent duplicate simultaneous calls
    if (loadingRef.current) {
      console.log("loadChatData already in progress, skipping duplicate call");
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      console.log("Loading chat data for ID:", id);
      const chatData = await apiHelpers.get(`/api/hook-polisher-chats/${id}`);
      console.log("Received chat data:", chatData);

      const hookDataToSet = {
        hook: (chatData as any).originalHook,
        threadContext: (chatData as any).threadContext,
        research: (chatData as any).research,
        angle: (chatData as any).angle,
        clientName: (chatData as any).clientName,
      };
      console.log("Setting hook data:", hookDataToSet);
      setHookData(hookDataToSet);

      // Set the original hook as selected to show thread preview immediately
      setSelectedHook(hookDataToSet.hook);

      const conversationHistoryFromAPI =
        (chatData as any).conversationHistory || [];

      // Backend has already filtered out system prompts for security
      const allMessages = conversationHistoryFromAPI.map(
        (msg: any, index: number) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          isProcessingStepResponse: msg.isProcessingStepResponse,
        })
      );

      // Separate regular chat messages from processing step responses
      const userMessages = allMessages
        .filter((msg: any) => {
          // Only include regular conversational messages (exclude processing step responses)
          return !msg.isProcessingStepResponse;
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
                ? "polishing"
                : stepNumber === 2
                ? "fact-check"
                : stepNumber === 3
                ? "hook-fact-check"
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
      if (processingSteps.length >= 3) {
        console.log(
          "LOADER: Processing complete (3 steps found). Setting state."
        );
        setProcessingStep("complete");
        setIsInitialPolishing(false);
      } else if (userMessages.length > 0) {
        // If user has already interacted
        console.log("LOADER: User messages found, setting to complete.");
        setProcessingStep("complete");
        setIsInitialPolishing(false);
      } else if (processingSteps.length === 2) {
        console.log("LOADER: Setting step to hook-fact-check.");
        setProcessingStep("hook-fact-check");
        setIsInitialPolishing(true);
      } else if (processingSteps.length === 1) {
        console.log("LOADER: Setting step to fact-check.");
        setProcessingStep("fact-check");
        setIsInitialPolishing(true);
      } else {
        console.log("LOADER: Setting step to polishing.");
        setProcessingStep("polishing");
        setIsInitialPolishing(true);
      }
    } catch (error) {
      console.error("Error loading chat data:", error);
      router.push("/hook-polisher");
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
    if (processingStep === "complete" && isInitialPolishing) {
      setIsInitialPolishing(false);
    }
  }, [processingStep, isInitialPolishing, isLoading]);

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
    if (!currentMessage.trim() || !hookData || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);
    setIsInitialPolishing(false); // User has started chatting
    setProcessingStep("complete"); // We're now in conversational mode

    try {
      const result = await apiHelpers.post(
        `/api/hook-polisher-chats/${id}/message`,
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

  // Hook selection functions
  const handleHookSelection = (hookContent: string) => {
    setSelectedHook(hookContent);
  };

  const generateThreadPreview = () => {
    if (!selectedHook || !hookData?.threadContext) return [];

    // Split thread context by single dash separators
    const threadPosts = hookData.threadContext
      .split(/\n\s*-\s*\n/) // Split on lines with single dash
      .filter((post) => post.trim())
      .map((post) => post.trim());

    // Skip the first post (it's the previous hook) and create thread array with selected hook as first post
    const threadArray = [selectedHook.trim(), ...threadPosts.slice(1)];

    return threadArray;
  };

  const copyThreadToClipboard = async () => {
    const threadPreview = generateThreadPreview();
    if (threadPreview.length === 0) return;

    const threadText = threadPreview.join("\n\n");

    try {
      await navigator.clipboard.writeText(threadText);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const renderAIResponse = (step: any) => {
    if (!step.response) return null;

    // Use the same hook-aware rendering for processing steps
    return renderAIResponseWithHooks(step.response);
  };

  // Enhanced AI response renderer with hook selection for chat messages
  const renderAIResponseWithHooks = (content: string) => {
    // Check if content contains HOOK tags
    const hookRegex = /<HOOK id="(\d+)">([\s\S]*?)<\/HOOK>/g;
    const hooks = [];
    let match;

    // Extract all hooks
    let hookMatch;
    while ((hookMatch = hookRegex.exec(content)) !== null) {
      hooks.push({
        id: hookMatch[1],
        content: hookMatch[2], // Don't trim to preserve newlines
      });
    }

    if (hooks.length === 0) {
      // No hooks found, render normally
      return (
        <Box
          className="markdown-content"
          style={{
            color: isDarkMode ? theme.colors.gray[1] : theme.colors.dark[7],
            lineHeight: 1.6,
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </Box>
      );
    }

    // Use a different approach - find and replace hooks with placeholders, then render
    let processedContent = content;
    const hookPlacements = [];

    // Reset regex
    hookRegex.lastIndex = 0;
    let placeholderMatch;
    let placeholderIndex = 0;

    while ((placeholderMatch = hookRegex.exec(content)) !== null) {
      const hookId = placeholderMatch[1];
      const hookContent = placeholderMatch[2];
      const placeholder = `__HOOK_PLACEHOLDER_${placeholderIndex}__`;

      hookPlacements.push({
        placeholder,
        hookId,
        hookContent,
      });

      processedContent = processedContent.replace(
        placeholderMatch[0],
        placeholder
      );
      placeholderIndex++;
    }

    // Split by placeholders and render
    const parts = processedContent.split(/__HOOK_PLACEHOLDER_\d+__/);
    const renderedParts = [];

    for (let i = 0; i < parts.length; i++) {
      // Add regular content
      if (parts[i].trim()) {
        renderedParts.push(
          <Box key={`content-${i}`} mb="sm">
            <ReactMarkdown>{parts[i]}</ReactMarkdown>
          </Box>
        );
      }

      // Add hook if there's one after this part
      if (i < hookPlacements.length) {
        const { hookId, hookContent } = hookPlacements[i];

        renderedParts.push(
          <Box key={`hook-${i}`} mb="lg">
            <Paper
              p="md"
              radius="md"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(90, 50, 140, 0.2)"
                  : "rgba(138, 102, 214, 0.1)",
                border: `2px solid ${
                  isDarkMode
                    ? "rgba(138, 102, 214, 0.3)"
                    : "rgba(138, 102, 214, 0.2)"
                }`,
                position: "relative",
              }}
            >
              <Flex justify="space-between" align="flex-start" gap="md">
                <Box style={{ flex: 1 }}>
                  <Badge
                    size="xs"
                    color={isDarkMode ? "violet" : "indigo"}
                    variant="light"
                    mb="xs"
                  >
                    Hook {hookId}
                  </Badge>
                  <Text
                    style={{
                      fontWeight: 500,
                      lineHeight: 1.5,
                      color: isDarkMode
                        ? theme.colors.gray[1]
                        : theme.colors.dark[7],
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {hookContent}
                  </Text>
                </Box>
                <Button
                  size="xs"
                  variant={selectedHook === hookContent ? "filled" : "light"}
                  color={isDarkMode ? "violet" : "indigo"}
                  onClick={() => handleHookSelection(hookContent)}
                  style={{ flexShrink: 0 }}
                >
                  {selectedHook === hookContent ? "Selected" : "Choose Hook"}
                </Button>
              </Flex>
            </Paper>
          </Box>
        );
      }
    }

    return (
      <Box
        className="markdown-content"
        style={{
          color: isDarkMode ? theme.colors.gray[1] : theme.colors.dark[7],
          lineHeight: 1.6,
        }}
      >
        {renderedParts}
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

      socketRef.current = io(`${wsUrl}/hook-polisher`, {
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
          step: "polishing" | "fact-check" | "hook-fact-check" | "complete";
          processingStepData?: any;
        }) => {
          // Always add processing step data regardless of initial polishing state
          if (data.processingStepData) {
            setProcessingSteps((prev) => {
              // Check if this step already exists to prevent duplicates
              const stepExists = prev.some(
                (step) => step.step === data.processingStepData.step
              );
              if (!stepExists) {
                const newSteps = [...prev, data.processingStepData];

                // Only auto-expand when all processing is complete (3 steps total)
                if (newSteps.length === 3) {
                  setMessages((currentMessages) => {
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

          // Use functional updates to avoid issues with stale state in closures
          setIsInitialPolishing((prevIsInitialPolishing) => {
            setProcessingStep((prevProcessingStep) => {
              // Only update processing step if initial polishing is still ongoing OR it's complete
              if (prevIsInitialPolishing || data.step === "complete") {
                return data.step;
              }
              return prevProcessingStep; // Keep current step if initial polishing already marked done by loadChatData
            });
            // If the update is 'complete', then initial polishing is definitely over.
            if (data.step === "complete") {
              return false;
            }
            return prevIsInitialPolishing;
          });
        }
      );

      socket.on("processing-complete", () => {
        setIsInitialPolishing(false);
        setProcessingStep("complete");

        // Auto-expand the last step if there are no user messages
        setMessages((currentMessages) => {
          if (currentMessages.length === 0) {
            setProcessingSteps((currentSteps) => {
              if (currentSteps.length > 0) {
                const lastStepIndex = currentSteps.length - 1;
                setExpandedSteps(new Set([lastStepIndex]));
              }
              return currentSteps;
            });
          }
          return currentMessages;
        });
      });

      socket.on("hooks-update", (data: { hooks: any[] }) => {
        // Hooks updated
      });

      return () => {
        if (socket) {
          socket.emit("leave-chat", { chatId: id });
          socket.disconnect();
        }
      };
    }
  }, [id]);

  if (isLoading && !hookData) {
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
              Loading hook polisher...
            </Text>
          </Box>
        </Box>
      </DashboardLayout>
    );
  }

  if (!hookData) {
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
          <Text c="red">Hook polisher chat not found</Text>
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
        .markdown-content ol {
          list-style: none !important;
          padding-left: 0 !important;
          margin-left: 0 !important;
        }
        .markdown-content ol li {
          padding-left: 0 !important;
          margin-left: 0 !important;
          margin-bottom: 1rem;
        }
        .markdown-content ol li::before {
          display: none !important;
        }
      `}</style>
      <Box
        style={{
          height: "calc(100vh - 120px)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Flex style={{ height: "100%", minHeight: 0 }}>
          {/* Left sidebar with hook context information */}
          <Box
            style={{
              width: "450px",
              borderRight: isDarkMode
                ? "1px solid rgba(55, 65, 81, 0.3)"
                : "1px solid rgba(230, 230, 230, 0.7)",
              height: "100%",
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
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Flex align="center" mb="sm">
                <IconPolygon
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
                  Hook Polisher
                </Title>
              </Flex>

              <Divider
                mb="md"
                style={{
                  borderColor: isDarkMode
                    ? "rgba(90, 50, 140, 0.4)"
                    : undefined,
                  borderWidth: "0.5px",
                }}
              />

              <Stack gap="sm" mt="sm" style={{ flex: 1, overflow: "hidden" }}>
                {hookData.clientName && (
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
                        {hookData.clientName}
                      </span>
                    </Text>
                  </Flex>
                )}
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
                  <Box style={{ flex: 1 }}>
                    <Text
                      fw={600}
                      size="lg"
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[4]
                          : theme.colors.gray[7],
                      }}
                    >
                      Original Hook:
                    </Text>
                    <Text
                      size="md"
                      style={{
                        fontWeight: "normal",
                        color: isDarkMode
                          ? theme.colors.gray[3]
                          : theme.colors.dark[7],
                        fontStyle: "italic",
                        marginTop: "2px",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.3,
                      }}
                    >
                      "{hookData.hook}"
                    </Text>
                  </Box>
                </Flex>

                {hookData.angle && (
                  <Flex align="flex-start" gap="sm">
                    <IconTimeline
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
                        size="lg"
                        style={{
                          color: isDarkMode
                            ? theme.colors.gray[4]
                            : theme.colors.gray[7],
                        }}
                      >
                        Angle:
                      </Text>
                      <Text
                        size="md"
                        style={{
                          fontWeight: "normal",
                          color: isDarkMode
                            ? theme.colors.gray[3]
                            : theme.colors.dark[7],
                          marginTop: "2px",
                        }}
                      >
                        {hookData.angle}
                      </Text>
                    </Box>
                  </Flex>
                )}

                {hookData.threadContext && (
                  <Flex align="flex-start" gap="sm">
                    <IconBriefcase
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
                        size="lg"
                        style={{
                          color: isDarkMode
                            ? theme.colors.gray[4]
                            : theme.colors.gray[7],
                        }}
                      >
                        Thread Context:
                      </Text>
                      <ScrollArea
                        h={350}
                        mt="xs"
                        type="auto"
                        style={{
                          border: isDarkMode
                            ? "1px solid rgba(55, 65, 81, 0.3)"
                            : "1px solid rgba(230, 230, 230, 0.5)",
                          borderRadius: "6px",
                          padding: "8px",
                          backgroundColor: isDarkMode
                            ? "rgba(55, 65, 81, 0.1)"
                            : "rgba(248, 249, 250, 0.5)",
                          marginLeft: "-28px", // Align with the icon
                        }}
                      >
                        <Text
                          size="md"
                          style={{
                            fontWeight: "normal",
                            color: isDarkMode
                              ? theme.colors.gray[3]
                              : theme.colors.dark[7],
                            lineHeight: 1.4,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {hookData.threadContext}
                        </Text>
                      </ScrollArea>
                    </Box>
                  </Flex>
                )}
              </Stack>
            </Paper>
          </Box>

          {/* Middle: Chat interface */}
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
                  Hook Polishing Assistant
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
                {/* Initial polishing status message - only show if no processing steps yet */}
                {isInitialPolishing &&
                  messages.length === 0 &&
                  processingSteps.length === 0 && (
                    <Box px="lg">
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
                        <Flex align="center" gap="md" justify="center">
                          <Text
                            size="md"
                            fw={600}
                            style={{
                              color: isDarkMode
                                ? theme.colors.violet[3]
                                : theme.colors.indigo[6],
                            }}
                          >
                            ✨ Hook Polishing
                          </Text>
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
                          <Badge
                            size="sm"
                            color="yellow"
                            variant="light"
                            style={{ fontWeight: 500 }}
                          >
                            Starting...
                          </Badge>
                        </Flex>
                      </Paper>
                    </Box>
                  )}

                {/* Processing Steps History with Collapsible AI Responses */}
                <Box px="lg">
                  {processingSteps.map((step, index) => {
                    const isExpanded = expandedSteps.has(index);
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
                                  {step.step === "polishing"
                                    ? "✨ Hook Polishing"
                                    : step.step === "fact-check"
                                    ? "🔍 Fact Check"
                                    : step.step === "hook-fact-check"
                                    ? "✅ Hook Fact Check"
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
                                  {renderAIResponse(step)}
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
                {isInitialPolishing &&
                  processingStep !== "complete" &&
                  processingStep !== "polishing" && (
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
                              {processingStep === "fact-check" ? (
                                <Flex align="center" gap="sm">
                                  <span>🔍 Fact Check</span>
                                  <Box
                                    component="span"
                                    style={{
                                      display: "inline-flex",
                                      gap: "2px",
                                    }}
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
                              ) : processingStep === "hook-fact-check" ? (
                                <Flex align="center" gap="sm">
                                  <span>✅ Hook Fact Check</span>
                                  <Box
                                    component="span"
                                    style={{
                                      display: "inline-flex",
                                      gap: "2px",
                                    }}
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

                {/* Chat Messages */}
                <Box px="lg">
                  {messages.map((message, index) => (
                    <Box
                      key={index}
                      py="md"
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent:
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
                            minWidth: "200px",
                          }}
                        >
                          <Box
                            style={{
                              whiteSpace: "pre-wrap",
                              color: isDarkMode
                                ? theme.colors.gray[0]
                                : theme.colors.dark[7],
                              lineHeight: 1.6,
                              fontSize: "0.95rem",
                            }}
                          >
                            {message.role === "assistant" ? (
                              renderAIResponseWithHooks(message.content)
                            ) : (
                              <Text
                                style={{
                                  whiteSpace: "pre-wrap",
                                  color: isDarkMode
                                    ? theme.colors.gray[0]
                                    : theme.colors.dark[7],
                                  lineHeight: 1.6,
                                  fontSize: "0.95rem",
                                }}
                              >
                                {message.content}
                              </Text>
                            )}
                          </Box>
                        </Paper>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Typing indicator when waiting for AI response */}
                {isLoading && (
                  <Box
                    py="md"
                    px="md"
                    style={{
                      width: "100%",
                      alignSelf: "flex-start",
                      maxWidth: "85%",
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

                <div ref={messagesEndRef} />
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
                    placeholder={
                      isInitialPolishing
                        ? "Processing hooks automatically... Please wait."
                        : "Ask for hook improvements, style changes, or specific variations..."
                    }
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    minRows={2}
                    maxRows={5}
                    autosize
                    radius="md"
                    disabled={isLoading || isInitialPolishing}
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
                    onClick={handleSendMessage}
                    color={isDarkMode ? "grape.4" : "indigo"}
                    loading={isLoading}
                    disabled={
                      !currentMessage.trim() || isLoading || isInitialPolishing
                    }
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
                    {!isLoading && <IconSend size={16} />}
                  </Button>
                </Paper>
              </Box>
            </Paper>
          </Box>

          {/* Right side: Thread Preview Panel */}
          {selectedHook && (
            <Box
              style={{
                width: "400px",
                borderLeft: isDarkMode
                  ? "1px solid rgba(55, 65, 81, 0.3)"
                  : "1px solid rgba(230, 230, 230, 0.7)",
                height: "100%",
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
                  borderColor: isDarkMode
                    ? "rgba(90, 50, 140, 0.3)"
                    : undefined,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Flex align="center" justify="space-between" mb="md">
                  <Flex align="center">
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
                      Thread Preview
                    </Title>
                  </Flex>
                  <Button
                    size="xs"
                    variant="light"
                    color={isDarkMode ? "violet" : "indigo"}
                    leftSection={
                      copiedToClipboard ? (
                        <IconCheck size={14} />
                      ) : (
                        <IconCopy size={14} />
                      )
                    }
                    onClick={copyThreadToClipboard}
                    disabled={!selectedHook}
                  >
                    {copiedToClipboard ? "Copied!" : "Copy"}
                  </Button>
                </Flex>

                <Divider
                  my="md"
                  style={{
                    borderColor: isDarkMode
                      ? "rgba(90, 50, 140, 0.4)"
                      : undefined,
                    borderWidth: "0.5px",
                  }}
                />

                <ScrollArea style={{ flex: 1 }} type="auto">
                  <Stack gap="md">
                    {generateThreadPreview().map((post, index) => (
                      <Card
                        key={index}
                        p="lg"
                        radius="md"
                        style={{
                          backgroundColor:
                            index === 0
                              ? isDarkMode
                                ? "rgba(90, 50, 140, 0.2)"
                                : "rgba(138, 102, 214, 0.1)"
                              : isDarkMode
                              ? "rgba(40, 50, 70, 0.6)"
                              : "white",
                          border:
                            index === 0
                              ? `2px solid ${
                                  isDarkMode
                                    ? "rgba(138, 102, 214, 0.4)"
                                    : "rgba(138, 102, 214, 0.3)"
                                }`
                              : `1px solid ${
                                  isDarkMode
                                    ? "rgba(55, 65, 81, 0.3)"
                                    : "rgba(230, 230, 230, 0.5)"
                                }`,
                          position: "relative",
                        }}
                      >
                        <Box>
                          {index === 0 && (
                            <Badge
                              size="xs"
                              color={isDarkMode ? "violet" : "indigo"}
                              variant="light"
                              mb="md"
                            >
                              Selected Hook
                            </Badge>
                          )}
                          <Text
                            style={{
                              lineHeight: 1.6,
                              color: isDarkMode
                                ? theme.colors.gray[1]
                                : theme.colors.dark[7],
                              whiteSpace: "pre-wrap",
                              fontSize: "0.95rem",
                            }}
                          >
                            {post}
                          </Text>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              </Paper>
            </Box>
          )}
        </Flex>
      </Box>
    </DashboardLayout>
  );
}
