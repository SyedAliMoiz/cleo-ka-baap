"use client";

import {
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconBulb,
  IconFileText,
  IconSparkles,
  IconTarget,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { apiHelpers } from "../utils/apiClient";
import { useClient } from "./ClientContext";
import { useDarkMode } from "./DarkModeProvider";

export function HookPolisher() {
  const { isDarkMode } = useDarkMode();
  const { selectedClientId } = useClient();
  const [hookInput, setHookInput] = useState("");
  const [threadContext, setThreadContext] = useState("");
  const [angle, setAngle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!hookInput.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the backend API to create a new hook polisher chat
      const result = await apiHelpers.post(
        "/api/hook-polisher-chats/create-or-get",
        {
          hook: hookInput,
          threadContext,
          angle,
          clientId: selectedClientId,
        }
      );

      // Navigate to the chat page with the returned chat ID
      router.push(`/hooks/${(result as { chatId: string }).chatId}`);
    } catch (error) {
      console.error("Error creating hook polisher chat:", error);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, isLastField = false) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      if (isLastField || !angle) {
        handleSubmit();
      } else {
        // Focus the next field if not the last one
        const nextField = document.querySelector(
          'input[placeholder*="angle"]'
        ) as HTMLInputElement;
        nextField?.focus();
      }
    }
  };

  return (
    <Container size="lg" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
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
        {/* Simple Header Inside Main Content */}
        <Box style={{ textAlign: "center", marginBottom: "2rem" }}>
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
                background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <IconBulb size={24} />
            </div>
            <IconSparkles
              size={24}
              style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
            />
            <Title
              order={1}
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
              }}
            >
              Hook Polisher
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
            Refine your hook&apos;s clarity, engagement level, and tone to
            maximize your content&apos;s impact
          </Text>
        </Box>

        <Stack gap="xl">
          {/* Hook Input */}
          <Box>
            <Group mb="sm">
              <IconBulb
                size={20}
                style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
              />
              <Title
                order={3}
                style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937", margin: 0 }}
              >
                Your Hook
              </Title>
            </Group>
            <Textarea
              placeholder="Enter your hook or topic idea here..."
              value={hookInput}
              onChange={(e) => setHookInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, false)}
              minRows={3}
              maxRows={6}
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
                  fontSize: "16px",
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
            <Text
              size="sm"
              mt="xs"
              style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
            >
              This is the primary hook you want to refine
            </Text>
          </Box>

          {/* Thread Context Input */}
          <Box>
            <Group mb="sm">
              <IconFileText
                size={20}
                style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
              />
              <Title
                order={3}
                style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937", margin: 0 }}
              >
                Thread Context (optional)
              </Title>
            </Group>
            <Textarea
              placeholder="Enter the full thread or additional context for the hook..."
              value={threadContext}
              onChange={(e) => setThreadContext(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, false)}
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
                  fontSize: "16px",
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
            <Text
              size="sm"
              mt="xs"
              style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
            >
              Adding the full thread helps create hooks that match your content
            </Text>
          </Box>

          {/* Angle Input */}
          <Box>
            <Group mb="sm">
              <IconTarget
                size={20}
                style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}
              />
              <Title
                order={3}
                style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937", margin: 0 }}
              >
                Angle (optional)
              </Title>
            </Group>
            <TextInput
              placeholder="The specific angle or approach for this content..."
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, true)}
              styles={{
                input: {
                  backgroundColor: isDarkMode
                    ? "rgba(31, 41, 55, 0.5)"
                    : "#f9fafb",
                  border: isDarkMode
                    ? "1px solid rgba(75, 85, 99, 0.3)"
                    : "1px solid #e5e7eb",
                  color: isDarkMode ? "#f3f4f6" : "#1f2937",
                  fontSize: "16px",
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
            <Text
              size="sm"
              mt="xs"
              style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
            >
              Specify the unique perspective or approach for this content
            </Text>
          </Box>

          {/* Submit Button */}
          <Box style={{ textAlign: "center", paddingTop: "1rem" }}>
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!hookInput.trim() || isSubmitting}
              size="lg"
              styles={{
                root: {
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                  border: "none",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: 600,
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
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
              leftSection={<IconSparkles size={20} />}
            >
              Polish My Hook
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
  );
}
