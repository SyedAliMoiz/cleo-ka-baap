"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Text,
  Textarea,
  Button,
  Stack,
  Box,
  Select,
  Loader,
  Alert,
  Group,
} from "@mantine/core";
import {
  IconBrandLinkedin,
  IconArrowRight,
  IconAlertCircle,
  IconUsers,
} from "@tabler/icons-react";
import { useDarkMode } from "../../src/components/DarkModeProvider";
import { DashboardLayout } from "../../src/components/DashboardLayout/DashboardLayout";
import { apiHelpers } from "../../src/utils/apiClient";
import { ClientService, Client } from "../../src/utils/clientService";

export default function LinkedInPostsPage() {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [thread, setThread] = useState("");
  const [specificInstructions, setSpecificInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client selection state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoadingClients(true);
        const data = await ClientService.getClients();
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
        setClientError("Failed to load clients. Please try again later.");
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  // Handle client selection
  const handleClientSelect = async (clientId: string | null) => {
    setSelectedClientId(clientId);
    setSelectedClient(null);

    if (clientId) {
      try {
        const client = await ClientService.getClientById(clientId);
        setSelectedClient(client);
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!thread.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      console.log("[FRONTEND] Creating LinkedIn post with:", {
        selectedClientId,
        selectedClient: selectedClient?.name,
        threadLength: thread.trim().length,
        hasSpecificInstructions: !!specificInstructions.trim(),
      });

      const response = await apiHelpers.post<{
        chatId: string;
        isNew: boolean;
      }>("/api/linkedin-post-chats/create-or-get", {
        thread: thread.trim(),
        specificInstructions: specificInstructions.trim() || undefined,
        clientId: selectedClientId,
      });

      router.push(`/linkedin-posts/${response.chatId}`);
    } catch (error) {
      console.error("Error creating LinkedIn post chat:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, isSecondTextarea = false) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      if (isSecondTextarea || !specificInstructions) {
        handleSubmit();
      } else {
        // Focus the second textarea if Enter is pressed in the first one
        const secondTextarea = document.querySelector(
          'textarea[placeholder*="Specific Instructions"]'
        ) as HTMLTextAreaElement;
        secondTextarea?.focus();
      }
    }
  };

  // Prepare client select data
  const clientSelectData = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }));

  return (
    <DashboardLayout>
      <Container
        size="lg"
        style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
      >
        {/* Header */}
        <Paper
          p="xl"
          withBorder
          radius="md"
          style={{
            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "#f8f9fa",
            borderColor: isDarkMode ? "rgba(90, 50, 140, 0.3)" : undefined,
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0077b5 0%, #005885 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <IconBrandLinkedin size={24} />
            </div>
            <IconArrowRight
              size={24}
              style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
            />
            <Title
              order={1}
              style={{
                background: "linear-gradient(135deg, #0077b5 0%, #005885 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
              }}
            >
              Thread → LinkedIn Post Generator
            </Title>
          </Box>
          <Text
            size="lg"
            style={{
              color: isDarkMode ? "#d1d5db" : "#6b7280",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Transform your content into engaging LinkedIn posts
          </Text>
        </Paper>

        {/* Main Content */}
        <Paper
          p="xl"
          withBorder
          radius="md"
          style={{
            backgroundColor: isDarkMode ? "rgba(17, 24, 39, 0.7)" : "white",
            borderColor: isDarkMode ? "rgba(90, 50, 140, 0.2)" : undefined,
          }}
        >
          <Stack gap="xl">
            {/* Client Selection */}
            <Box>
              <Group mb="sm">
                <IconUsers
                  size={20}
                  style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
                />
                <Title
                  order={3}
                  style={{
                    color: isDarkMode ? "#f3f4f6" : "#1f2937",
                    margin: 0,
                  }}
                >
                  Client Selection (Optional)
                </Title>
              </Group>

              {clientError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Error"
                  color="red"
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
                  }}
                >
                  {clientError}
                </Alert>
              )}

              {isLoadingClients ? (
                <Box style={{ textAlign: "center", padding: "1rem" }}>
                  <Loader size="sm" color={isDarkMode ? "grape.4" : "indigo"} />
                  <Text
                    size="sm"
                    mt="xs"
                    style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
                  >
                    Loading clients...
                  </Text>
                </Box>
              ) : (
                <Select
                  placeholder="Select a client to personalize the content..."
                  data={clientSelectData}
                  value={selectedClientId}
                  onChange={handleClientSelect}
                  clearable
                  searchable
                  styles={{
                    input: {
                      backgroundColor: isDarkMode
                        ? "rgba(31, 41, 55, 0.5)"
                        : "#f9fafb",
                      border: isDarkMode
                        ? "1px solid rgba(75, 85, 99, 0.3)"
                        : "1px solid #e5e7eb",
                      color: isDarkMode ? "#f3f4f6" : "#1f2937",
                    },
                    dropdown: {
                      backgroundColor: isDarkMode
                        ? "rgba(31, 41, 55, 0.95)"
                        : "white",
                      border: isDarkMode
                        ? "1px solid rgba(75, 85, 99, 0.3)"
                        : "1px solid #e5e7eb",
                    },
                    option: {
                      backgroundColor: isDarkMode ? "transparent" : "white",
                      color: isDarkMode ? "#f3f4f6" : "#1f2937",
                    },
                  }}
                />
              )}

              {/* Selected client info */}
              {selectedClient && (
                <Box
                  mt="sm"
                  p="sm"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(30, 41, 55, 0.5)"
                      : "#f8f9fa",
                    borderRadius: "8px",
                    border: isDarkMode
                      ? "1px solid rgba(90, 50, 140, 0.2)"
                      : "1px solid #e5e7eb",
                  }}
                >
                  <Text
                    size="sm"
                    fw={600}
                    style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
                  >
                    Selected: {selectedClient.name}
                  </Text>
                  {selectedClient.industry && (
                    <Text
                      size="xs"
                      style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
                    >
                      Industry: {selectedClient.industry}
                    </Text>
                  )}
                  {selectedClient.bio && (
                    <Text
                      size="xs"
                      style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
                    >
                      Bio:{" "}
                      {selectedClient.bio.length > 100
                        ? selectedClient.bio.substring(0, 100) + "..."
                        : selectedClient.bio}
                    </Text>
                  )}
                </Box>
              )}
            </Box>

            {/* Thread Input */}
            <Box>
              <Title
                order={3}
                mb="sm"
                style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
              >
                Thread
              </Title>
              <Textarea
                placeholder="Paste your thread here..."
                value={thread}
                onChange={(e) => setThread(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, false)}
                minRows={8}
                maxRows={12}
                autosize
                styles={{
                  input: {
                    backgroundColor: isDarkMode
                      ? "rgba(31, 41, 55, 0.5)"
                      : "#f9fafb",
                    border: isDarkMode
                      ? "1px solid rgba(75, 85, 99, 0.3)"
                      : "1px solid #e5e7eb",
                    color: isDarkMode ? "#f3f4f6" : "#1f2937",
                    "&:focus": {
                      borderColor: isDarkMode ? "#8b5cf6" : "#6366f1",
                      boxShadow: isDarkMode
                        ? "0 0 0 3px rgba(139, 92, 246, 0.1)"
                        : "0 0 0 3px rgba(99, 102, 241, 0.1)",
                    },
                    "&::placeholder": {
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                    },
                  },
                }}
              />
            </Box>

            {/* Specific Instructions Input */}
            <Box>
              <Title
                order={3}
                mb="sm"
                style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
              >
                Specific Instructions (optional)
              </Title>
              <Textarea
                placeholder="Add any specific instructions for the LinkedIn post transformation..."
                value={specificInstructions}
                onChange={(e) => setSpecificInstructions(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, true)}
                minRows={4}
                maxRows={8}
                autosize
                styles={{
                  input: {
                    backgroundColor: isDarkMode
                      ? "rgba(31, 41, 55, 0.5)"
                      : "#f9fafb",
                    border: isDarkMode
                      ? "1px solid rgba(75, 85, 99, 0.3)"
                      : "1px solid #e5e7eb",
                    color: isDarkMode ? "#f3f4f6" : "#1f2937",
                    "&:focus": {
                      borderColor: isDarkMode ? "#8b5cf6" : "#6366f1",
                      boxShadow: isDarkMode
                        ? "0 0 0 3px rgba(139, 92, 246, 0.1)"
                        : "0 0 0 3px rgba(99, 102, 241, 0.1)",
                    },
                    "&::placeholder": {
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                    },
                  },
                }}
              />
            </Box>

            {/* Submit Button */}
            <Box style={{ textAlign: "center", paddingTop: "1rem" }}>
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!thread.trim() || isSubmitting}
                size="lg"
                styles={{
                  root: {
                    background:
                      "linear-gradient(135deg, #0077b5 0%, #005885 100%)",
                    border: "none",
                    padding: "12px 32px",
                    fontSize: "16px",
                    fontWeight: 600,
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #005885 0%, #004066 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                    "&:disabled": {
                      background: isDarkMode ? "#374151" : "#e5e7eb",
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      cursor: "not-allowed",
                      transform: "none",
                      boxShadow: "none",
                    },
                    transition: "all 0.2s ease",
                  },
                }}
                leftSection={<IconBrandLinkedin size={20} />}
              >
                Generate LinkedIn Post
              </Button>

              <Text
                size="sm"
                mt="md"
                style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
              >
                Press Ctrl+Enter to submit quickly
              </Text>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </DashboardLayout>
  );
}
