"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Text,
  Loader,
  Tabs,
  SimpleGrid,
  Card,
  Stack,
  Group,
  Badge,
  useMantineTheme,
  ActionIcon,
  Box,
  Select,
  TextInput,
  Button,
  Modal,
  Checkbox,
} from "@mantine/core";
import { useDarkMode } from "../../src/components/DarkModeProvider";
import { DashboardLayout } from "../../src/components/DashboardLayout/DashboardLayout";
import { apiHelpers } from "../../src/utils/apiClient";
import {
  IconBrandX,
  IconMessageCircle,
  IconCalendar,
  IconClick,
  IconBrandLinkedin,
  IconSearch,
  IconFilter,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  showSuccessNotification,
  showErrorNotification,
} from "../../src/utils/notifications";

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
}

interface Hook {
  _id: string;
  title: string;
  clientId: string;
  clientName: string;
  hooks: string[];
  createdAt: string;
}

interface LinkedInPost {
  _id: string;
  title: string;
  clientId: string;
  clientName: string;
  originalThread: string;
  generatedPosts: string[];
  createdAt: string;
}

interface Client {
  _id: string;
  name: string;
  bio?: string;
  industry?: string;
}

export default function ChatsPage() {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>("threads");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [linkedInPosts, setLinkedInPosts] = useState<LinkedInPost[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingHooks, setIsLoadingHooks] = useState(true);
  const [isLoadingLinkedInPosts, setIsLoadingLinkedInPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local client management for filtering
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState<
    "thread" | "hook" | "linkedin-post" | null
  >(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteRelatedChats, setDeleteRelatedChats] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch clients for the filter
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoadingClients(true);
        const response = await apiHelpers.get<Client[]>("/clients");
        setClients(response);
      } catch (err: any) {
        console.error("Error fetching clients:", err);
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  // Fetch threads
  useEffect(() => {
    fetchThreads();
  }, []);

  // Fetch hooks
  useEffect(() => {
    fetchHooks();
  }, []);

  // Fetch LinkedIn posts
  useEffect(() => {
    fetchLinkedInPosts();
  }, []);

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Navigate to thread detail
  const handleThreadClick = (threadId: string) => {
    router.push(`/chats/${threadId}`);
  };

  // Navigate to hook detail
  const handleHookClick = (hookId: string) => {
    router.push(`/hooks/${hookId}`);
  };

  // Navigate to LinkedIn post detail
  const handleLinkedInPostClick = (linkedInPostId: string) => {
    router.push(`/linkedin-posts/${linkedInPostId}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (
    type: "thread" | "hook" | "linkedin-post",
    id: string
  ) => {
    setDeleteItemType(type);
    setDeleteItemId(id);
    setDeleteModalOpen(true);
    setDeleteRelatedChats(false);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteItemType(null);
    setDeleteItemId(null);
    setDeleteRelatedChats(false);
  };

  // Execute delete operation
  const executeDelete = async () => {
    if (!deleteItemType || !deleteItemId) return;

    setIsDeleting(true);
    try {
      let endpoint = "";
      let successMessage = "";

      switch (deleteItemType) {
        case "thread":
          endpoint = `/api/thread-writer/chats/${deleteItemId}${
            deleteRelatedChats ? "?deleteRelated=true" : ""
          }`;
          successMessage = "Thread conversation deleted successfully";
          break;
        case "hook":
          endpoint = `/api/hook-polisher-chats/${deleteItemId}`;
          successMessage = "Hook polisher chat deleted successfully";
          break;
        case "linkedin-post":
          endpoint = `/api/linkedin-post-chats/${deleteItemId}`;
          successMessage = "LinkedIn post chat deleted successfully";
          break;
      }

      const result = await apiHelpers.delete(endpoint);

      showSuccessNotification({
        title: "Success",
        message: successMessage,
      });

      // Refetch the appropriate data
      switch (deleteItemType) {
        case "thread":
          fetchThreads();
          // Also refetch hooks and LinkedIn posts in case they were linked
          fetchHooks();
          fetchLinkedInPosts();
          break;
        case "hook":
          fetchHooks();
          break;
        case "linkedin-post":
          fetchLinkedInPosts();
          break;
      }

      closeDeleteModal();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      showErrorNotification({
        title: "Error",
        message: error.message || "Failed to delete item",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Refetch functions
  const fetchThreads = async () => {
    try {
      setIsLoadingThreads(true);
      const response = await apiHelpers.get<any[]>("/api/thread-writer/chats");

      // The backend now returns properly formatted data with client names
      const transformedThreads = response.map((chat: any) => ({
        _id: chat._id,
        title: chat.title,
        client: { _id: chat.clientId, name: chat.clientName },
        prompt: JSON.stringify(chat),
        tweets: chat.tweets || [],
        createdAt: chat.createdAt || new Date().toISOString(),
        status: chat.status || "active",
      }));

      setThreads(transformedThreads);
    } catch (err: any) {
      console.error("Error fetching thread writer chats:", err);
      setError(err.message || "Failed to load conversations");
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const fetchHooks = async () => {
    try {
      setIsLoadingHooks(true);
      const response = await apiHelpers
        .get<Hook[]>("/api/hook-polisher-chats")
        .catch(() => {
          console.log(
            "Hook polisher chats API not available yet - returning empty array"
          );
          return [];
        });
      setHooks(response || []);
    } catch (err: any) {
      console.log("Using empty hooks array until API is implemented");
      setHooks([]);
    } finally {
      setIsLoadingHooks(false);
    }
  };

  const fetchLinkedInPosts = async () => {
    try {
      setIsLoadingLinkedInPosts(true);
      const response = await apiHelpers
        .get<LinkedInPost[]>("/api/linkedin-post-chats")
        .catch(() => {
          console.log(
            "LinkedIn Posts API not available yet - returning empty array"
          );
          return [];
        });
      setLinkedInPosts(response || []);
    } catch (err: any) {
      console.log("Using empty LinkedIn posts array until API is implemented");
      setLinkedInPosts([]);
    } finally {
      setIsLoadingLinkedInPosts(false);
    }
  };

  // Filter threads by client if a client is selected
  const filteredThreads = selectedClientId
    ? threads.filter((thread) => thread.client._id === selectedClientId)
    : threads;

  // Filter hooks by client if a client is selected
  const filteredHooks = selectedClientId
    ? hooks.filter((hook) => hook.clientId === selectedClientId)
    : hooks;

  // Filter LinkedIn posts by client if a client is selected
  const filteredLinkedInPosts = selectedClientId
    ? linkedInPosts.filter((post) => post.clientId === selectedClientId)
    : linkedInPosts;

  return (
    <DashboardLayout>
      <style jsx global>{`
        .mantine-Tabs-tab:hover {
          background-color: ${isDarkMode
            ? "rgba(90, 50, 140, 0.15)"
            : "rgba(67, 56, 202, 0.05)"} !important;
          color: ${isDarkMode
            ? theme.colors.gray[2]
            : theme.colors.dark[7]} !important;
          transform: translateY(-1px) !important;
        }

        /* Override any Tailwind classes that might interfere */
        .mantine-Tabs-tab.hover\\:bg-purple-800\\/10:hover,
        .mantine-Tabs-tab.hover\\:bg-purple-900\\/20:hover {
          background-color: ${isDarkMode
            ? "rgba(90, 50, 140, 0.15)"
            : "rgba(67, 56, 202, 0.05)"} !important;
        }

        /* Dark theme Select option hover styling */
        .dark-select-option:hover {
          background-color: rgba(90, 50, 140, 0.2) !important;
          color: ${theme.colors.gray[1]} !important;
        }

        .dark-select-option[data-selected] {
          background-color: rgba(90, 50, 140, 0.4) !important;
          color: ${theme.colors.gray[1]} !important;
        }
      `}</style>
      <Container
        size="xl"
        style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
      >
        <Paper
          p="xl"
          withBorder
          radius="md"
          style={{
            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "#f8f9fa",
            borderColor: isDarkMode ? "rgba(90, 50, 140, 0.3)" : undefined,
            marginBottom: "1.5rem",
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Box>
              <Title
                order={2}
                style={{ color: isDarkMode ? theme.colors.gray[2] : undefined }}
              >
                Conversations
              </Title>
              <Text
                mt="xs"
                style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}
              >
                Chat history for Thread Writer, Hook Polisher, and LinkedIn
                Posts
              </Text>
            </Box>

            {/* Client Filter */}
            <Box style={{ minWidth: 250 }}>
              <Select
                placeholder="Filter by client"
                leftSection={<IconFilter size={16} />}
                rightSection={
                  selectedClientId ? (
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => setSelectedClientId(null)}
                      style={{ marginRight: "8px" }}
                    >
                      ×
                    </ActionIcon>
                  ) : null
                }
                data={[
                  { value: "", label: "All clients" },
                  ...clients.map((client) => ({
                    value: client._id,
                    label: client.name,
                  })),
                ]}
                value={selectedClientId || ""}
                onChange={(value) => setSelectedClientId(value || null)}
                disabled={isLoadingClients}
                clearable
                styles={{
                  input: {
                    backgroundColor: isDarkMode
                      ? "rgba(30, 30, 40, 0.5)"
                      : "white",
                    borderColor: isDarkMode
                      ? "rgba(90, 50, 140, 0.3)"
                      : undefined,
                    color: isDarkMode ? theme.colors.gray[2] : undefined,
                  },
                  dropdown: {
                    backgroundColor: isDarkMode
                      ? "rgba(30, 41, 59, 0.95)"
                      : undefined,
                    borderColor: isDarkMode
                      ? "rgba(90, 50, 140, 0.3)"
                      : undefined,
                  },
                  option: {
                    color: isDarkMode ? theme.colors.gray[2] : undefined,
                    backgroundColor: "transparent",
                  },
                }}
                classNames={{
                  option: isDarkMode ? "dark-select-option" : undefined,
                }}
              />
            </Box>
          </Group>
        </Paper>

        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          style={{ marginBottom: "2rem" }}
        >
          <Tabs.List>
            <Tabs.Tab
              value="threads"
              leftSection={<IconBrandX size={18} />}
              styles={{
                tab: {
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: 500,
                  color:
                    activeTab === "threads"
                      ? isDarkMode
                        ? theme.colors.gray[1]
                        : theme.colors.dark[8]
                      : isDarkMode
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                  borderBottom:
                    activeTab === "threads"
                      ? `2px solid ${
                          isDarkMode
                            ? theme.colors.grape[4]
                            : theme.colors.indigo[5]
                        }`
                      : "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: `${
                      isDarkMode
                        ? "rgba(90, 50, 140, 0.15)"
                        : "rgba(67, 56, 202, 0.05)"
                    } !important`,
                    color: `${
                      isDarkMode ? theme.colors.gray[2] : theme.colors.dark[7]
                    } !important`,
                    transform: "translateY(-1px) !important",
                  },
                },
              }}
            >
              Thread Writer
            </Tabs.Tab>
            <Tabs.Tab
              value="hooks"
              leftSection={<IconMessageCircle size={18} />}
              styles={{
                tab: {
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: 500,
                  color:
                    activeTab === "hooks"
                      ? isDarkMode
                        ? theme.colors.gray[1]
                        : theme.colors.dark[8]
                      : isDarkMode
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                  borderBottom:
                    activeTab === "hooks"
                      ? `2px solid ${
                          isDarkMode
                            ? theme.colors.grape[4]
                            : theme.colors.indigo[5]
                        }`
                      : "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: `${
                      isDarkMode
                        ? "rgba(90, 50, 140, 0.15)"
                        : "rgba(67, 56, 202, 0.05)"
                    } !important`,
                    color: `${
                      isDarkMode ? theme.colors.gray[2] : theme.colors.dark[7]
                    } !important`,
                    transform: "translateY(-1px) !important",
                  },
                },
              }}
            >
              Hook Polisher
            </Tabs.Tab>
            <Tabs.Tab
              value="linkedin-posts"
              leftSection={<IconBrandLinkedin size={18} />}
              styles={{
                tab: {
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: 500,
                  color:
                    activeTab === "linkedin-posts"
                      ? isDarkMode
                        ? theme.colors.gray[1]
                        : theme.colors.dark[8]
                      : isDarkMode
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                  borderBottom:
                    activeTab === "linkedin-posts"
                      ? `2px solid ${
                          isDarkMode
                            ? theme.colors.grape[4]
                            : theme.colors.indigo[5]
                        }`
                      : "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: `${
                      isDarkMode
                        ? "rgba(90, 50, 140, 0.15)"
                        : "rgba(67, 56, 202, 0.05)"
                    } !important`,
                    color: `${
                      isDarkMode ? theme.colors.gray[2] : theme.colors.dark[7]
                    } !important`,
                    transform: "translateY(-1px) !important",
                  },
                },
              }}
            >
              LinkedIn Posts
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="threads" pt="md">
            {isLoadingThreads ? (
              <Box ta="center" py="xl">
                <Loader color={isDarkMode ? "grape.4" : "indigo"} />
                <Text mt="md" c={isDarkMode ? "gray.5" : "dimmed"}>
                  Loading conversations...
                </Text>
              </Box>
            ) : error ? (
              <Text c="red" ta="center">
                {error}
              </Text>
            ) : filteredThreads.length === 0 ? (
              <Box
                ta="center"
                py="xl"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(17, 24, 39, 0.4)"
                    : "#f8f9fa",
                  borderRadius: "0.5rem",
                  padding: "2rem",
                }}
              >
                <IconBrandX
                  size={48}
                  stroke={1.5}
                  style={{
                    color: isDarkMode
                      ? "rgba(138, 102, 214, 0.5)"
                      : theme.colors.gray[4],
                  }}
                />
                <Title
                  order={3}
                  mt="md"
                  style={{
                    color: isDarkMode ? theme.colors.gray[3] : undefined,
                  }}
                >
                  No threads found
                </Title>
                <Text
                  mt="xs"
                  style={{
                    color: isDarkMode ? theme.colors.gray[5] : undefined,
                  }}
                >
                  {selectedClientId
                    ? "No threads found for the selected client."
                    : "You haven't created any threads yet."}
                </Text>
              </Box>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 3 }} spacing="md">
                {filteredThreads.map((thread) => (
                  <Card
                    key={thread._id}
                    withBorder
                    padding="lg"
                    radius="md"
                    style={{
                      cursor: "pointer",
                      borderColor: isDarkMode
                        ? "rgba(90, 50, 140, 0.3)"
                        : undefined,
                      backgroundColor: isDarkMode
                        ? "rgba(17, 24, 39, 0.7)"
                        : undefined,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: isDarkMode
                          ? "0 5px 15px rgba(0, 0, 0, 0.3)"
                          : "0 5px 15px rgba(0, 0, 0, 0.1)",
                      },
                      position: "relative",
                    }}
                    onClick={() => handleThreadClick(thread._id)}
                  >
                    <Badge
                      radius="sm"
                      color={isDarkMode ? "violet.9" : "indigo.9"}
                      variant="filled"
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "16px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        opacity: 0.95,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        padding: "4px 10px",
                        color: "#ffffff",
                        zIndex: 2,
                      }}
                    >
                      {formatDate(thread.createdAt)}
                    </Badge>
                    <Stack gap="xs">
                      <Group justify="space-between" align="start">
                        <Group gap="xs">
                          <IconBrandX
                            size={18}
                            style={{
                              color: isDarkMode
                                ? theme.colors.blue[4]
                                : theme.colors.blue[6],
                            }}
                          />
                          <Text
                            fw={600}
                            size="lg"
                            style={{
                              color: isDarkMode
                                ? theme.colors.gray[2]
                                : undefined,
                            }}
                          >
                            {thread.title}
                          </Text>
                        </Group>
                      </Group>

                      <Text
                        size="sm"
                        lineClamp={2}
                        style={{
                          color: isDarkMode ? theme.colors.gray[4] : undefined,
                        }}
                      >
                        {thread.client.name}
                      </Text>

                      <Group mt="xs" justify="space-between">
                        <Group gap="xs">
                          <IconCalendar
                            size={14}
                            style={{
                              color: isDarkMode
                                ? theme.colors.gray[5]
                                : theme.colors.gray[6],
                            }}
                          />
                          <Text
                            size="xs"
                            style={{
                              color: isDarkMode
                                ? theme.colors.gray[5]
                                : theme.colors.gray[6],
                            }}
                          >
                            {formatDate(thread.createdAt)}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Delete thread"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal("thread", thread._id);
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color={isDarkMode ? "gray.5" : "gray.6"}
                            aria-label="Open thread"
                          >
                            <IconClick size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="hooks" pt="md">
            {isLoadingHooks ? (
              <Box ta="center" py="xl">
                <Loader color={isDarkMode ? "grape.4" : "indigo"} />
                <Text mt="md" c={isDarkMode ? "gray.5" : "dimmed"}>
                  Loading hook conversations...
                </Text>
              </Box>
            ) : filteredHooks.length === 0 ? (
              <Box
                ta="center"
                py="xl"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(17, 24, 39, 0.4)"
                    : "#f8f9fa",
                  borderRadius: "0.5rem",
                  padding: "2rem",
                }}
              >
                <IconMessageCircle
                  size={48}
                  stroke={1.5}
                  style={{
                    color: isDarkMode
                      ? "rgba(138, 102, 214, 0.5)"
                      : theme.colors.gray[4],
                  }}
                />
                <Title
                  order={3}
                  mt="md"
                  style={{
                    color: isDarkMode ? theme.colors.gray[3] : undefined,
                  }}
                >
                  No hook conversations found
                </Title>
                <Text
                  mt="xs"
                  style={{
                    color: isDarkMode ? theme.colors.gray[5] : undefined,
                  }}
                >
                  {selectedClientId
                    ? "No hooks found for the selected client."
                    : "You haven't created any hook conversations yet."}
                </Text>
              </Box>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 3 }} spacing="md">
                {filteredHooks.map((hook) => (
                  <Card
                    key={hook._id}
                    withBorder
                    padding="lg"
                    radius="md"
                    style={{
                      cursor: "pointer",
                      borderColor: isDarkMode
                        ? "rgba(90, 50, 140, 0.3)"
                        : undefined,
                      backgroundColor: isDarkMode
                        ? "rgba(17, 24, 39, 0.7)"
                        : undefined,
                      position: "relative",
                    }}
                    onClick={() => handleHookClick(hook._id)}
                  >
                    <Badge
                      radius="sm"
                      color={isDarkMode ? "teal.9" : "teal.8"}
                      variant="filled"
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "16px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        opacity: 0.95,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        padding: "4px 10px",
                        color: "#ffffff",
                        zIndex: 2,
                      }}
                    >
                      {formatDate(hook.createdAt)}
                    </Badge>
                    <Stack gap="xs">
                      <Group justify="space-between" align="start">
                        <Group gap="xs">
                          <IconMessageCircle
                            size={18}
                            style={{
                              color: isDarkMode
                                ? theme.colors.green[4]
                                : theme.colors.green[6],
                            }}
                          />
                          <Text
                            fw={600}
                            size="lg"
                            style={{
                              color: isDarkMode
                                ? theme.colors.gray[2]
                                : undefined,
                            }}
                          >
                            {hook.title}
                          </Text>
                        </Group>
                      </Group>

                      <Text
                        size="sm"
                        lineClamp={2}
                        style={{
                          color: isDarkMode ? theme.colors.gray[4] : undefined,
                        }}
                      >
                        {hook.clientName}
                      </Text>

                      <Group mt="xs" justify="space-between">
                        <Group gap="xs">
                          <IconCalendar
                            size={14}
                            style={{
                              color: isDarkMode
                                ? theme.colors.gray[5]
                                : theme.colors.gray[6],
                            }}
                          />
                          <Text
                            size="xs"
                            style={{
                              color: isDarkMode
                                ? theme.colors.gray[5]
                                : theme.colors.gray[6],
                            }}
                          >
                            {formatDate(hook.createdAt)}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Delete hook conversation"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal("hook", hook._id);
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color={isDarkMode ? "gray.5" : "gray.6"}
                            aria-label="Open hook conversation"
                          >
                            <IconClick size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="linkedin-posts" pt="md">
            {isLoadingLinkedInPosts ? (
              <Box ta="center" py="xl">
                <Loader color={isDarkMode ? "grape.4" : "indigo"} />
                <Text mt="md" c={isDarkMode ? "gray.5" : "dimmed"}>
                  Loading LinkedIn post conversations...
                </Text>
              </Box>
            ) : filteredLinkedInPosts.length === 0 ? (
              <Box
                ta="center"
                py="xl"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(17, 24, 39, 0.4)"
                    : "#f8f9fa",
                  borderRadius: "0.5rem",
                  padding: "2rem",
                }}
              >
                <IconBrandLinkedin
                  size={48}
                  stroke={1.5}
                  style={{
                    color: isDarkMode
                      ? "rgba(138, 102, 214, 0.5)"
                      : theme.colors.gray[4],
                  }}
                />
                <Title
                  order={3}
                  mt="md"
                  style={{
                    color: isDarkMode ? theme.colors.gray[3] : undefined,
                  }}
                >
                  No LinkedIn post conversations found
                </Title>
                <Text
                  mt="xs"
                  style={{
                    color: isDarkMode ? theme.colors.gray[5] : undefined,
                  }}
                >
                  {selectedClientId
                    ? "No LinkedIn posts found for the selected client."
                    : "You haven't created any LinkedIn post conversations yet."}
                </Text>
              </Box>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 3 }} spacing="md">
                {filteredLinkedInPosts.map((post) => (
                  <Card
                    key={post._id}
                    withBorder
                    padding="lg"
                    radius="md"
                    style={{
                      cursor: "pointer",
                      borderColor: isDarkMode
                        ? "rgba(90, 50, 140, 0.3)"
                        : undefined,
                      backgroundColor: isDarkMode
                        ? "rgba(17, 24, 39, 0.7)"
                        : undefined,
                      position: "relative",
                    }}
                    onClick={() => handleLinkedInPostClick(post._id)}
                  >
                    <Badge
                      radius="sm"
                      color={isDarkMode ? "orange.9" : "orange.8"}
                      variant="filled"
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "16px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        opacity: 0.95,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        padding: "4px 10px",
                        color: "#ffffff",
                        zIndex: 2,
                      }}
                    >
                      {formatDate(post.createdAt)}
                    </Badge>
                    <Stack gap="xs">
                      <Group justify="space-between" align="start">
                        <Group gap="xs">
                          <IconBrandLinkedin
                            size={18}
                            style={{
                              color: isDarkMode
                                ? theme.colors.indigo[4]
                                : theme.colors.indigo[6],
                            }}
                          />
                          <Text
                            fw={600}
                            size="lg"
                            style={{
                              color: isDarkMode
                                ? theme.colors.gray[2]
                                : undefined,
                            }}
                          >
                            {post.title}
                          </Text>
                        </Group>
                      </Group>

                      <Text
                        size="sm"
                        lineClamp={2}
                        style={{
                          color: isDarkMode ? theme.colors.gray[4] : undefined,
                        }}
                      >
                        {post.clientName}
                      </Text>

                      <Group mt="xs" justify="space-between">
                        <Group gap="xs">
                          <IconCalendar
                            size={14}
                            style={{
                              color: isDarkMode
                                ? theme.colors.gray[5]
                                : theme.colors.gray[6],
                            }}
                          />
                          <Text
                            size="xs"
                            style={{
                              color: isDarkMode
                                ? theme.colors.gray[5]
                                : theme.colors.gray[6],
                            }}
                          >
                            {formatDate(post.createdAt)}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label="Delete LinkedIn post conversation"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal("linkedin-post", post._id);
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color={isDarkMode ? "gray.5" : "gray.6"}
                            aria-label="Open LinkedIn post conversation"
                          >
                            <IconClick size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        </Tabs>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={closeDeleteModal}
        title=""
        size="md"
        centered
        overlayProps={{
          opacity: 0.55,
          blur: 3,
        }}
        styles={{
          content: {
            backgroundColor: isDarkMode ? "#1a1b23" : "#ffffff",
            borderRadius: "16px",
            border: isDarkMode
              ? "1px solid rgba(90, 50, 140, 0.3)"
              : "1px solid #e9ecef",
            boxShadow: isDarkMode
              ? "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(90, 50, 140, 0.1)"
              : "0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          },
          header: {
            backgroundColor: "transparent",
            borderBottom: "none",
            paddingBottom: 0,
          },
          body: {
            padding: "24px",
          },
        }}
      >
        <Stack gap="24px">
          {/* Header with Icon and Title */}
          <Group gap="16px" align="flex-start">
            <Box
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: isDarkMode
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: isDarkMode
                  ? "1px solid rgba(239, 68, 68, 0.2)"
                  : "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <IconAlertTriangle size={24} color="#ef4444" />
            </Box>
            <Stack gap="4px" style={{ flex: 1 }}>
              <Text
                size="xl"
                fw={700}
                style={{
                  color: isDarkMode
                    ? theme.colors.gray[1]
                    : theme.colors.dark[8],
                  lineHeight: 1.3,
                }}
              >
                Delete{" "}
                {deleteItemType === "thread"
                  ? "Thread"
                  : deleteItemType === "hook"
                  ? "Hook Polisher Chat"
                  : "LinkedIn Post Chat"}
                ?
              </Text>
              <Text
                size="sm"
                style={{
                  color: isDarkMode
                    ? theme.colors.gray[5]
                    : theme.colors.gray[6],
                  lineHeight: 1.4,
                }}
              >
                This action cannot be undone and will permanently remove all
                associated data.
              </Text>
            </Stack>
          </Group>

          {/* Warning Content */}
          <Box
            style={{
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: isDarkMode
                ? "rgba(239, 68, 68, 0.05)"
                : "rgba(239, 68, 68, 0.05)",
              border: isDarkMode
                ? "1px solid rgba(239, 68, 68, 0.15)"
                : "1px solid rgba(239, 68, 68, 0.15)",
            }}
          >
            <Text
              size="sm"
              style={{
                color: isDarkMode ? theme.colors.gray[3] : theme.colors.dark[7],
                lineHeight: 1.5,
              }}
            >
              You are about to permanently delete this{" "}
              {deleteItemType === "thread"
                ? "thread and all its content"
                : deleteItemType === "hook"
                ? "hook polisher conversation"
                : "LinkedIn post conversation"}
              .
              {deleteItemType !== "thread" &&
                " The linked thread will remain unaffected."}
            </Text>
          </Box>

          {/* Thread-specific option */}
          {deleteItemType === "thread" && (
            <Box
              style={{
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: isDarkMode
                  ? "rgba(90, 50, 140, 0.05)"
                  : "rgba(67, 56, 202, 0.05)",
                border: isDarkMode
                  ? "1px solid rgba(90, 50, 140, 0.15)"
                  : "1px solid rgba(67, 56, 202, 0.15)",
              }}
            >
              <Checkbox
                checked={deleteRelatedChats}
                onChange={(event) =>
                  setDeleteRelatedChats(event.currentTarget.checked)
                }
                label={
                  <Stack gap="4px">
                    <Text
                      size="sm"
                      fw={500}
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[2]
                          : theme.colors.dark[8],
                      }}
                    >
                      Also delete related conversations
                    </Text>
                    <Text
                      size="xs"
                      style={{
                        color: isDarkMode
                          ? theme.colors.gray[5]
                          : theme.colors.gray[6],
                      }}
                    >
                      This will permanently delete all hook polisher and
                      LinkedIn post chats linked to this thread
                    </Text>
                  </Stack>
                }
                styles={{
                  input: {
                    backgroundColor: isDarkMode
                      ? "rgba(90, 50, 140, 0.1)"
                      : "rgba(67, 56, 202, 0.1)",
                    borderColor: isDarkMode
                      ? "rgba(90, 50, 140, 0.3)"
                      : "rgba(67, 56, 202, 0.3)",
                    "&:checked": {
                      backgroundColor: isDarkMode
                        ? theme.colors.grape[6]
                        : theme.colors.indigo[6],
                      borderColor: isDarkMode
                        ? theme.colors.grape[6]
                        : theme.colors.indigo[6],
                    },
                  },
                }}
              />
            </Box>
          )}

          {/* Action Buttons */}
          <Group justify="flex-end" gap="12px" pt="8px">
            <Button
              variant="subtle"
              onClick={closeDeleteModal}
              disabled={isDeleting}
              size="md"
              style={{
                color: isDarkMode ? theme.colors.gray[4] : theme.colors.gray[6],
                fontWeight: 500,
              }}
              styles={{
                root: {
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(90, 50, 140, 0.1)"
                      : "rgba(67, 56, 202, 0.05)",
                  },
                },
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={executeDelete}
              loading={isDeleting}
              leftSection={<IconTrash size={16} />}
              size="md"
              fw={600}
              styles={{
                root: {
                  backgroundColor: "#ef4444",
                  "&:hover": {
                    backgroundColor: "#dc2626",
                  },
                  "&:disabled": {
                    backgroundColor: "#ef4444",
                    opacity: 0.8,
                  },
                },
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </DashboardLayout>
  );
}
