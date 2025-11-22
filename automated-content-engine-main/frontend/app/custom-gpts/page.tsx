"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Loader,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  useMantineTheme,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBrandHipchat,
  IconBrandX,
  IconBriefcase,
  IconFocus,
  IconPlus,
  IconRobot,
  IconSend,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useDarkMode } from "../../src/components/DarkModeProvider";
import { DashboardLayout } from "../../src/components/DashboardLayout/DashboardLayout";
import { ModuleCard } from "../../src/components/ModuleCard";
import { apiHelpers } from "../../src/utils/apiClient";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../src/utils/notifications";
import modulesData from "./modules.json";

interface Module {
  name: string;
  tier: string;
  cover_image: string;
}

interface Session {
  sessionId: string;
  gptType: string;
  title: string;
  createdAt: string;
}

interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const getGptIcon = (gptType: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    "VyraSearch CIA": <IconFocus size={20} />,
    "VyraHook Polisher": <IconFocus size={20} />,
    "VyraTrust Thread Creator": <IconBrandX size={20} />,
    "VyraLinked Authority Engine": <IconBriefcase size={20} />,
  };

  return iconMap[gptType] || <IconRobot size={20} />;
};

export default function CustomGptsPage() {
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();
  const [modules] = useState<Module[]>(modulesData);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (selectedModule) {
      loadSessions();
    }
  }, [selectedModule]);

  useEffect(() => {
    if (selectedSession) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    if (!selectedModule) return;

    try {
      setSessionsLoading(true);
      const data = await apiHelpers.get<Session[]>(
        `/custom-gpts/sessions/${selectedModule.name}`
      );
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
      showErrorNotification({
        title: "Error",
        message: "Failed to load sessions",
      });
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);
      const data = await apiHelpers.get<Message[]>(
        `/custom-gpts/${selectedSession.sessionId}/messages`
      );
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
      showErrorNotification({
        title: "Error",
        message: "Failed to load messages",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!selectedModule) return;

    try {
      setIsSubmitting(true);
      const newSession = await apiHelpers.post<Session>(
        "/custom-gpts/session",
        { gptType: selectedModule.name }
      );

      await loadSessions();
      setSelectedSession(newSession);
      setMessages([]);

      showSuccessNotification({
        title: "Success",
        message: "New chat session created",
      });
    } catch (error) {
      console.error("Error creating session:", error);
      showErrorNotification({
        title: "Error",
        message: "Failed to create session",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !selectedSession || isSubmitting) return;

    const userMessage = userInput.trim();
    setUserInput("");
    setIsSubmitting(true);

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      sessionId: selectedSession.sessionId,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const updatedMessages = await apiHelpers.post<Message[]>(
        `/custom-gpts/${selectedSession.sessionId}/message`,
        { message: userMessage }
      );

      setMessages(updatedMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      showErrorNotification({
        title: "Error",
        message: "Failed to send message",
      });

      setMessages((prev) =>
        prev.filter((msg) => msg.id !== tempUserMessage.id)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectSession = (session: Session) => {
    setSelectedSession(session);
  };

  const selectModule = (module: Module) => {
    setSelectedModule(module);
    setSelectedSession(null);
    setMessages([]);
  };

  const goBackToModules = () => {
    setSelectedModule(null);
    setSelectedSession(null);
    setMessages([]);
  };

  const getGptTypeInfo = (gptType: string) => {
    return {
      value: gptType,
      label: gptType,
      icon: getGptIcon(gptType),
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedGptInfo = selectedModule
    ? getGptTypeInfo(selectedModule.name)
    : null;

  return (
    <DashboardLayout>
      <Box
        mx={{
          base: 0,
          sm: 20,
          md: 30,
          lg: 50,
        }}
        py="md"
        style={{
          backgroundColor: isDarkMode
            ? theme.colors.dark[7]
            : theme.colors.gray[0],
          minHeight: "100vh",
        }}
      >
        <Stack gap="lg">
          {/* Header */}
          <Paper p="md" shadow="sm">
            <Stack gap="md">
              <Group justify="space-between">
                <div>
                  <Title order={2}>
                    {selectedModule
                      ? selectedModule.name
                      : "Custom GPT Modules"}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {selectedModule
                      ? `Chat with ${selectedModule.name} - ${selectedModule.tier} tier`
                      : "Select a module to start chatting with specialized AI personalities"}
                  </Text>
                </div>
                {selectedModule && (
                  <Button
                    leftSection={<IconArrowLeft size={16} />}
                    variant="light"
                    onClick={goBackToModules}
                  >
                    Back to Modules
                  </Button>
                )}
              </Group>
            </Stack>
          </Paper>

          {!selectedModule ? (
            /* Module Selection Grid */
            <Paper p="md" shadow="sm">
              <Stack gap="md">
                <Title order={3}>Available Modules</Title>
                <SimpleGrid
                  cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                  spacing="lg"
                >
                  {modules.map((module) => (
                    <ModuleCard
                      key={module.name}
                      name={module.name}
                      tier={module.tier}
                      coverImage={module.cover_image}
                      onClick={() => selectModule(module)}
                    />
                  ))}
                </SimpleGrid>
              </Stack>
            </Paper>
          ) : (
            /* Chat Interface */
            <Flex gap="md" style={{ height: "calc(100vh - 300px)" }}>
              {/* Sessions Sidebar */}
              <Paper p="md" shadow="sm" style={{ width: 300, minWidth: 300 }}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={4}>Chat Sessions</Title>
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={createNewSession}
                      loading={isSubmitting}
                      size="xs"
                    >
                      New
                    </Button>
                  </Group>
                  <Text size="sm" color="dimmed">
                    {selectedModule.name} conversations
                  </Text>

                  {sessionsLoading ? (
                    <Loader size="sm" />
                  ) : (
                    <ScrollArea style={{ height: "calc(100vh - 400px)" }}>
                      <Stack gap="xs">
                        {sessions.map((session) => (
                          <Card
                            key={session.sessionId}
                            p="sm"
                            style={{
                              cursor: "pointer",
                              backgroundColor:
                                selectedSession?.sessionId === session.sessionId
                                  ? theme.colors.blue[isDarkMode ? 8 : 0]
                                  : "transparent",
                              border:
                                selectedSession?.sessionId === session.sessionId
                                  ? `1px solid ${
                                      theme.colors.blue[isDarkMode ? 6 : 3]
                                    }`
                                  : "1px solid transparent",
                            }}
                            onClick={() => selectSession(session)}
                          >
                            <Stack gap="xs">
                              <Text size="sm" w={500} truncate>
                                {session.title}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {formatDate(session.createdAt)}
                              </Text>
                            </Stack>
                          </Card>
                        ))}

                        {sessions.length === 0 && (
                          <Text size="sm" c="dimmed" ta="center" py="md">
                            No chat sessions yet. Create a new chat to get
                            started.
                          </Text>
                        )}
                      </Stack>
                    </ScrollArea>
                  )}
                </Stack>
              </Paper>

              {/* Chat Area */}
              <Paper p="md" shadow="sm" style={{ flex: 1 }}>
                {selectedSession ? (
                  <Stack gap="md" style={{ height: "100%" }}>
                    {/* Chat Header */}
                    <Group justify="space-between">
                      <Group>
                        {selectedGptInfo?.icon}
                        <div>
                          <Title order={4}>{selectedSession.title}</Title>
                          <Text size="sm" color="dimmed">
                            {selectedGptInfo?.label}
                          </Text>
                        </div>
                      </Group>
                      <Badge color="blue" variant="light">
                        {selectedGptInfo?.label}
                      </Badge>
                    </Group>

                    <Divider />

                    {/* Messages */}
                    <ScrollArea style={{ flex: 1, minHeight: 400 }}>
                      <Stack gap="md">
                        {loading ? (
                          <Loader size="sm" />
                        ) : (
                          messages.map((message) => (
                            <Flex
                              key={message.id}
                              justify={
                                message.role === "user"
                                  ? "flex-end"
                                  : "flex-start"
                              }
                            >
                              <Paper
                                p="md"
                                style={{
                                  maxWidth: "70%",
                                  minWidth: "200px",
                                  backgroundColor:
                                    message.role === "user"
                                      ? theme.colors.blue[isDarkMode ? 8 : 0]
                                      : theme.colors.gray[isDarkMode ? 8 : 0],
                                  overflow: "hidden",
                                  wordWrap: "break-word",
                                }}
                              >
                                <Stack gap="xs">
                                  <Group gap="xs">
                                    {message.role === "user" ? (
                                      <IconUser
                                        size={16}
                                        color={
                                          theme.colors.blue[isDarkMode ? 4 : 6]
                                        }
                                      />
                                    ) : (
                                      <IconRobot
                                        size={16}
                                        color={
                                          theme.colors.green[isDarkMode ? 4 : 6]
                                        }
                                      />
                                    )}
                                    <Text size="xs">
                                      {message.role === "user"
                                        ? "You"
                                        : selectedGptInfo?.label}
                                    </Text>
                                  </Group>
                                  <div
                                    style={{
                                      wordWrap: "break-word",
                                      overflowWrap: "break-word",
                                      maxWidth: "100%",
                                      overflow: "hidden",
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {message.role === "assistant" ? (
                                      <ReactMarkdown
                                        components={{
                                          a: ({ children, href }) => (
                                            <Link
                                              href={href}
                                              target="_blank"
                                              style={{
                                                wordBreak: "break-all",
                                                overflowWrap: "break-word",
                                                maxWidth: "100%",
                                                display: "inline-block",
                                              }}
                                            >
                                              {children}
                                            </Link>
                                          ),
                                          h1: ({ children }) => (
                                            <Text
                                              fw={700}
                                              size="xl"
                                              mb="md"
                                              style={{
                                                color: isDarkMode
                                                  ? "#ffffff"
                                                  : "#1a1a1a",
                                              }}
                                            >
                                              {children}
                                            </Text>
                                          ),
                                          h2: ({ children }) => (
                                            <Text
                                              fw={600}
                                              size="lg"
                                              mb="sm"
                                              style={{
                                                color: isDarkMode
                                                  ? "#ffffff"
                                                  : "#1a1a1a",
                                              }}
                                            >
                                              {children}
                                            </Text>
                                          ),
                                          h3: ({ children }) => (
                                            <Text
                                              fw={600}
                                              size="md"
                                              mb="sm"
                                              style={{
                                                color: isDarkMode
                                                  ? "#f0f0f0"
                                                  : "#2a2a2a",
                                              }}
                                            >
                                              {children}
                                            </Text>
                                          ),
                                          p: ({ children }) => (
                                            <Text
                                              mb="sm"
                                              style={{
                                                color: isDarkMode
                                                  ? "#e0e0e0"
                                                  : "#2a2a2a",
                                              }}
                                            >
                                              {children}
                                            </Text>
                                          ),
                                          strong: ({ children }) => (
                                            <Text
                                              component="span"
                                              fw={600}
                                              style={{
                                                color: isDarkMode
                                                  ? "#ffffff"
                                                  : "#1a1a1a",
                                              }}
                                            >
                                              {children}
                                            </Text>
                                          ),
                                          ul: ({ children }) => (
                                            <Box
                                              component="ul"
                                              pl="md"
                                              mb="sm"
                                              style={{
                                                color: isDarkMode
                                                  ? "#e0e0e0"
                                                  : "#2a2a2a",
                                              }}
                                            >
                                              {children}
                                            </Box>
                                          ),
                                          ol: ({ children }) => (
                                            <Box
                                              component="ol"
                                              pl="md"
                                              mb="sm"
                                              style={{
                                                color: isDarkMode
                                                  ? "#e0e0e0"
                                                  : "#2a2a2a",
                                              }}
                                            >
                                              {children}
                                            </Box>
                                          ),
                                          li: ({ children }) => (
                                            <Text
                                              component="li"
                                              mb="xs"
                                              style={{
                                                color: isDarkMode
                                                  ? "#e0e0e0"
                                                  : "#2a2a2a",
                                              }}
                                            >
                                              {children}
                                            </Text>
                                          ),
                                        }}
                                      >
                                        {message.content}
                                      </ReactMarkdown>
                                    ) : (
                                      <Text
                                        size="sm"
                                        style={{ whiteSpace: "pre-wrap" }}
                                      >
                                        {message.content}
                                      </Text>
                                    )}
                                  </div>
                                  <Text size="xs" color="dimmed">
                                    {formatDate(message.createdAt)}
                                  </Text>
                                </Stack>
                              </Paper>
                            </Flex>
                          ))
                        )}

                        {messages.length === 0 && !loading && (
                          <Text size="sm" color="dimmed" ta="center" py="xl">
                            Start a conversation with {selectedGptInfo?.label}{" "}
                            by typing a message below.
                          </Text>
                        )}

                        <div ref={bottomRef} />
                      </Stack>
                    </ScrollArea>

                    {/* Input Area */}
                    <Paper p="md" shadow="sm">
                      <Stack gap="md">
                        <Textarea
                          placeholder={`Message ${selectedGptInfo?.label}...`}
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          minRows={2}
                          maxRows={4}
                          disabled={isSubmitting}
                        />
                        <Group justify="flex-end">
                          <Button
                            leftSection={<IconSend size={16} />}
                            onClick={sendMessage}
                            loading={isSubmitting}
                            disabled={!userInput.trim()}
                          >
                            Send Message
                          </Button>
                        </Group>
                      </Stack>
                    </Paper>
                  </Stack>
                ) : (
                  <Stack
                    gap="md"
                    align="center"
                    justify="center"
                    style={{ height: "100%" }}
                  >
                    <IconBrandHipchat size={64} color={theme.colors.gray[4]} />
                    <Title order={3} c="dimmed">
                      Select a Chat Session
                    </Title>
                    <Text c="dimmed" ta="center">
                      Choose an existing conversation or create a new chat to
                      start talking with {selectedGptInfo?.label}.
                    </Text>
                  </Stack>
                )}
              </Paper>
            </Flex>
          )}
        </Stack>
      </Box>
    </DashboardLayout>
  );
}
