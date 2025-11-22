"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Text,
  Tabs,
  Stack,
  Card,
  Group,
  Badge,
  useMantineTheme,
  ActionIcon,
  Box,
  Loader,
  SimpleGrid,
} from "@mantine/core";
import {
  IconEdit,
  IconBrandX,
  IconMessageCircle,
  IconBrandLinkedin,
} from "@tabler/icons-react";
import { useDarkMode } from "../../src/components/DarkModeProvider";
import { DashboardLayout } from "../../src/components/DashboardLayout/DashboardLayout";
import { apiHelpers } from "../../src/utils/apiClient";

interface PromptVariable {
  name: string;
  description: string;
  required: boolean;
  type: "string" | "object" | "array";
}

interface Prompt {
  _id: string;
  name: string;
  feature: string;
  template: string;
  systemPrompt?: string;
  description?: string;
  category?: string;
  availableVariables: PromptVariable[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const threadWriterPrompts = [
  {
    feature: "rank_articles",
    title: "Article Ranking Prompt",
    description: "Ranks articles based on relevance to client and topic",
    variables: [
      {
        name: "clientName",
        description: "The name of the client",
        required: true,
        type: "string" as const,
      },
      {
        name: "clientBio",
        description: "Client bio information (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientNicheTags",
        description: "Client niche tags (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientBusinessInfo",
        description: "Client business information (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientIndustry",
        description: "Client industry (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientVoice",
        description: "Client voice and tone (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "topic",
        description: "The topic to find articles for",
        required: true,
        type: "string" as const,
      },
      {
        name: "articles",
        description: "Formatted list of articles to rank",
        required: true,
        type: "string" as const,
      },
    ],
  },
  {
    feature: "generate_angles",
    title: "Content Angles Generation Prompt",
    description: "Generates content angles for the selected topic",
    variables: [
      {
        name: "clientName",
        description: "The name of the client",
        required: true,
        type: "string" as const,
      },
      {
        name: "clientBio",
        description: "Client bio information (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientNicheTags",
        description: "Client niche tags (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientBusinessInfo",
        description: "Client business information (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientIndustry",
        description: "Client industry (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientVoice",
        description: "Client voice and tone (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "topic",
        description: "The topic to generate angles for",
        required: true,
        type: "string" as const,
      },
      {
        name: "research",
        description:
          "Research content to base angles on (automatically uses either automated research from articles or manual research input based on user selection)",
        required: true,
        type: "string" as const,
      },
      {
        name: "selectedArticle",
        description: "Selected article information (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "customInstructions",
        description: "Custom instructions from the user",
        required: false,
        type: "string" as const,
      },
    ],
  },
  {
    feature: "generate_hooks",
    title: "Hook Generation Prompt",
    description: "Creates engaging hooks from selected angles",
    variables: [
      {
        name: "clientName",
        description: "The name of the client",
        required: true,
        type: "string" as const,
      },
      {
        name: "clientBio",
        description: "Client bio information (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientNicheTags",
        description: "Client niche tags (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientBusinessInfo",
        description: "Client business information (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientIndustry",
        description: "Client industry (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientVoice",
        description: "Client voice and tone (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "topic",
        description: "The topic/niche for the hooks",
        required: true,
        type: "string" as const,
      },
      {
        name: "selectedAngleTitle",
        description: "Title of the selected content angle",
        required: true,
        type: "string" as const,
      },
      {
        name: "selectedAngleExplanation",
        description: "Explanation of the selected content angle",
        required: true,
        type: "string" as const,
      },
      {
        name: "selectedAngleScore",
        description: "Engagement score of the selected angle",
        required: true,
        type: "string" as const,
      },
      {
        name: "selectedArticle",
        description: "Selected article information (formatted)",
        required: false,
        type: "string" as const,
      },
      {
        name: "customInstructions",
        description: "Custom instructions from the user",
        required: false,
        type: "string" as const,
      },
      {
        name: "research",
        description: "Research content to inform hooks",
        required: true,
        type: "string" as const,
      },
    ],
  },

  {
    feature: "thread_generation_workflow",
    title: "Thread Generation Workflow",
    description:
      "Complete 5-step thread generation: thread generation, fact check, apply transition, evaluate thread, and apply changes",
    variables: [
      {
        name: "clientName",
        description: "The name of the client",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientBio",
        description: "Client bio information",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientBusinessInfo",
        description: "Client business information",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientIndustry",
        description: "Client industry",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientNicheTags",
        description: "Client niche tags (comma-separated)",
        required: false,
        type: "string" as const,
      },
      {
        name: "topic",
        description: "The topic for the thread",
        required: true,
        type: "string" as const,
      },
      {
        name: "hook",
        description: "The selected hook to start the thread",
        required: true,
        type: "string" as const,
      },
      {
        name: "articleTitle",
        description: "Title of the selected article",
        required: false,
        type: "string" as const,
      },
      {
        name: "articleUrl",
        description: "URL of the selected article",
        required: false,
        type: "string" as const,
      },
      {
        name: "articleSource",
        description: "Source of the selected article",
        required: false,
        type: "string" as const,
      },
      {
        name: "articlePublishedAt",
        description: "Publication date of the article",
        required: false,
        type: "string" as const,
      },
      {
        name: "articleSummary",
        description: "Summary of the selected article",
        required: false,
        type: "string" as const,
      },
      {
        name: "angleTitle",
        description: "Title of the selected angle",
        required: false,
        type: "string" as const,
      },
      {
        name: "angleExplanation",
        description: "Explanation of the selected angle",
        required: false,
        type: "string" as const,
      },
      {
        name: "clientVoice",
        description: "Client voice and tone",
        required: true,
        type: "string" as const,
      },
      {
        name: "research",
        description: "Research content for the thread",
        required: true,
        type: "string" as const,
      },
    ],
  },
];

const hookPolisherPrompts = [
  {
    feature: "polish_hooks",
    title: "Hook Polishing Workflow",
    description: "Complete 3-step hook polishing and fact-checking workflow",
    variables: [
      {
        name: "hook",
        description: "The original hook",
        required: true,
        type: "string" as const,
      },
      {
        name: "threadContext",
        description: "Context about the thread content",
        required: false,
        type: "string" as const,
      },
      {
        name: "research",
        description: "Research content",
        required: false,
        type: "string" as const,
      },
      {
        name: "angle",
        description: "The content angle being used",
        required: false,
        type: "string" as const,
      },
    ],
  },
];

const linkedInPostPrompts = [
  {
    feature: "linkedin_post_generation",
    title: "LinkedIn Post Generation Workflow",
    description:
      "Complete 4-step LinkedIn post generation: process, fact check, evaluate, and optimize",
    variables: [
      {
        name: "thread",
        description: "The original thread content",
        required: true,
        type: "string" as const,
      },
      {
        name: "specificInstructions",
        description: "User-provided specific instructions",
        required: false,
        type: "string" as const,
      },
    ],
  },
];

const featureColors: Record<string, string> = {
  rank_articles: "blue",
  generate_angles: "green",
  generate_hooks: "orange",
  thread_generation_workflow: "violet",
  polish_hooks: "teal",
  linkedin_post_generation: "indigo",
};

interface PromptCardProps {
  promptConfig: any;
  existingPrompt?: Prompt;
  isDarkMode: boolean;
  theme: any;
  onClick: () => void;
}

function PromptCard({
  promptConfig,
  existingPrompt,
  isDarkMode,
  theme,
  onClick,
}: PromptCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="prompt-card"
      p="xl"
      radius="xl"
      style={{
        backgroundColor: isHovered
          ? isDarkMode
            ? "#334155"
            : "#f8fafc"
          : isDarkMode
          ? "#1e293b"
          : "white",
        border: isHovered
          ? isDarkMode
            ? "1px solid #6366f1"
            : "1px solid #6366f1"
          : isDarkMode
          ? "1px solid #374151"
          : "1px solid #e5e7eb",
        cursor: "pointer",
        height: "100%",
        transform: isHovered ? "translateY(-6px)" : "translateY(0px)",
        boxShadow: isHovered
          ? isDarkMode
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
          : isDarkMode
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Stack gap="md" style={{ height: "100%" }}>
        <Group justify="space-between" align="flex-start">
          <Badge
            color={featureColors[promptConfig.feature] || "gray"}
            variant="light"
            size="md"
            style={{
              backgroundColor: isDarkMode
                ? `rgba(${getColorRgb(
                    featureColors[promptConfig.feature]
                  )}, 0.2)`
                : `rgba(${getColorRgb(
                    featureColors[promptConfig.feature]
                  )}, 0.1)`,
              color: isDarkMode
                ? getBrightColor(featureColors[promptConfig.feature])
                : getDarkColor(featureColors[promptConfig.feature]),
              fontWeight: 600,
            }}
          >
            {promptConfig.feature.replace("_", " ").toUpperCase()}
          </Badge>
          <ActionIcon
            variant="filled"
            color={isDarkMode ? "grape.6" : "indigo.6"}
            size="lg"
            style={{
              backgroundColor: isDarkMode
                ? theme.colors.grape[6]
                : theme.colors.indigo[6],
              color: "white",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
            styles={{
              root: {
                "&:hover": {
                  backgroundColor: `${
                    isDarkMode ? theme.colors.grape[5] : theme.colors.indigo[5]
                  } !important`,
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
                },
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <IconEdit size={18} />
          </ActionIcon>
        </Group>

        <div style={{ flex: 1 }}>
          <Title
            order={3}
            c={isDarkMode ? theme.colors.gray[1] : theme.colors.dark[8]}
            mb="sm"
            style={{ fontWeight: 600 }}
          >
            {promptConfig.title}
          </Title>

          <Text
            size="sm"
            c={isDarkMode ? theme.colors.gray[3] : theme.colors.gray[6]}
            style={{ lineHeight: 1.6 }}
          >
            {promptConfig.description}
          </Text>
        </div>

        <Group justify="space-between" align="center" mt="auto">
          <Text
            size="xs"
            c={isDarkMode ? theme.colors.gray[4] : theme.colors.gray[5]}
            style={{ fontWeight: 500 }}
          >
            {promptConfig.variables.length} variable
            {promptConfig.variables.length !== 1 ? "s" : ""}
          </Text>
          {existingPrompt && (
            <Text
              size="xs"
              c={isDarkMode ? theme.colors.gray[4] : theme.colors.gray[5]}
              style={{ fontWeight: 500 }}
            >
              Updated {new Date(existingPrompt.updatedAt).toLocaleDateString()}
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
}

// Helper functions for dynamic colors
function getColorRgb(color: string): string {
  const colorMap: Record<string, string> = {
    blue: "59, 130, 246",
    green: "34, 197, 94",
    orange: "249, 115, 22",
    violet: "139, 92, 246",
    teal: "20, 184, 166",
    gray: "107, 114, 128",
  };
  return colorMap[color] || colorMap.gray;
}

function getBrightColor(color: string): string {
  const colorMap: Record<string, string> = {
    blue: "#60a5fa",
    green: "#4ade80",
    orange: "#fb923c",
    violet: "#a78bfa",
    teal: "#2dd4bf",
    gray: "#9ca3af",
  };
  return colorMap[color] || colorMap.gray;
}

function getDarkColor(color: string): string {
  const colorMap: Record<string, string> = {
    blue: "#1d4ed8",
    green: "#059669",
    orange: "#ea580c",
    violet: "#7c3aed",
    teal: "#0f766e",
    gray: "#374151",
  };
  return colorMap[color] || colorMap.gray;
}

export default function PromptsPage() {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>("thread-writer");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const response = await apiHelpers.get<Prompt[]>("/prompts");
      setPrompts(response);
    } catch (err) {
      console.error("Error fetching prompts:", err);
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  const getPromptByFeature = (feature: string) => {
    if (feature === "polish_hooks") {
      // For multi-step hook polishing, check if any step prompt exists
      const step1 = prompts.find((p) => p.feature === "polish_hooks_step1");
      const step2 = prompts.find(
        (p) => p.feature === "polish_hooks_step2_fact_check"
      );
      const step3 = prompts.find(
        (p) => p.feature === "polish_hooks_step3_hook_fact_check"
      );

      // Return the first step if it exists, or a combined status
      if (step1 || step2 || step3) {
        return {
          ...step1,
          isActive: !!(step1?.isActive || step2?.isActive || step3?.isActive),
          updatedAt:
            [step1?.updatedAt, step2?.updatedAt, step3?.updatedAt]
              .filter(Boolean)
              .sort()
              .reverse()[0] || new Date().toISOString(),
        } as Prompt;
      }
      return undefined;
    }
    return prompts.find((p) => p.feature === feature);
  };

  const handlePromptClick = (feature: string) => {
    router.push(`/prompts/${feature}`);
  };

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
      `}</style>
      <Container
        size="xl"
        style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
      >
        <Paper
          p="xl"
          style={{
            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "#f8f9fa",
            borderColor: isDarkMode ? "rgba(90, 50, 140, 0.3)" : undefined,
            marginBottom: "1.5rem",
            border: isDarkMode
              ? "1px solid rgba(90, 50, 140, 0.3)"
              : "1px solid #e9ecef",
          }}
        >
          <Title order={2} c={isDarkMode ? theme.colors.gray[2] : undefined}>
            Prompt Editor
          </Title>
          <Text mt="xs" c={isDarkMode ? theme.colors.gray[4] : undefined}>
            Edit AI prompts for Thread Writer, Hook Polisher, and LinkedIn Posts
          </Text>
        </Paper>

        {loading ? (
          <Box ta="center" py="xl">
            <Loader color={isDarkMode ? "grape.4" : "indigo"} />
            <Text mt="md" c={isDarkMode ? theme.colors.gray[4] : undefined}>
              Loading prompts...
            </Text>
          </Box>
        ) : (
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            style={{ marginBottom: "2rem" }}
          >
            <Tabs.List style={{ marginBottom: "2rem" }}>
              <Tabs.Tab
                value="thread-writer"
                leftSection={<IconBrandX size={18} />}
                styles={{
                  tab: {
                    padding: "12px 24px",
                    fontSize: "16px",
                    fontWeight: 500,
                    color:
                      activeTab === "thread-writer"
                        ? isDarkMode
                          ? theme.colors.gray[1]
                          : theme.colors.dark[8]
                        : isDarkMode
                        ? theme.colors.gray[4]
                        : theme.colors.gray[6],
                    borderBottom:
                      activeTab === "thread-writer"
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
                value="hook-polisher"
                leftSection={<IconMessageCircle size={18} />}
                styles={{
                  tab: {
                    padding: "12px 24px",
                    fontSize: "16px",
                    fontWeight: 500,
                    color:
                      activeTab === "hook-polisher"
                        ? isDarkMode
                          ? theme.colors.gray[1]
                          : theme.colors.dark[8]
                        : isDarkMode
                        ? theme.colors.gray[4]
                        : theme.colors.gray[6],
                    borderBottom:
                      activeTab === "hook-polisher"
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

            <Tabs.Panel value="thread-writer">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {threadWriterPrompts.map((promptConfig) => (
                  <PromptCard
                    key={promptConfig.feature}
                    promptConfig={promptConfig}
                    existingPrompt={getPromptByFeature(promptConfig.feature)}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    onClick={() => handlePromptClick(promptConfig.feature)}
                  />
                ))}
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="hook-polisher">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {hookPolisherPrompts.map((promptConfig) => (
                  <PromptCard
                    key={promptConfig.feature}
                    promptConfig={promptConfig}
                    existingPrompt={getPromptByFeature(promptConfig.feature)}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    onClick={() => handlePromptClick(promptConfig.feature)}
                  />
                ))}
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="linkedin-posts">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {linkedInPostPrompts.map((promptConfig) => (
                  <PromptCard
                    key={promptConfig.feature}
                    promptConfig={promptConfig}
                    existingPrompt={getPromptByFeature(promptConfig.feature)}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    onClick={() => handlePromptClick(promptConfig.feature)}
                  />
                ))}
              </SimpleGrid>
            </Tabs.Panel>
          </Tabs>
        )}
      </Container>
    </DashboardLayout>
  );
}
