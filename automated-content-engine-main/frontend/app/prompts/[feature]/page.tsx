/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { StateField } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconDeviceFloppy,
  IconMaximize,
} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useDarkMode } from "../../../src/components/DarkModeProvider";
import { DashboardLayout } from "../../../src/components/DashboardLayout/DashboardLayout";
import { apiHelpers } from "../../../src/utils/apiClient";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../src/utils/notifications";

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

const promptConfigs: Record<string, any> = {
  rank_articles: {
    title: "Article Ranking Prompt",
    description: "Ranks articles based on relevance to client and topic",
    category: "Thread Writer",
    variables: [
      {
        name: "clientName",
        description: "The name of the client",
        required: true,
        type: "string",
      },
      {
        name: "clientBio",
        description: "Client bio information (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientNicheTags",
        description: "Client niche tags (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientBusinessInfo",
        description: "Client business information (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientIndustry",
        description: "Client industry (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientVoice",
        description: "Client voice and tone (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "topic",
        description: "The topic to find articles for",
        required: true,
        type: "string",
      },
      {
        name: "articles",
        description: "Formatted list of articles to rank",
        required: true,
        type: "string",
      },
    ],
  },
  generate_angles: {
    title: "Content Angles Generation Prompt",
    description: "Generates content angles for the selected topic",
    category: "Thread Writer",
    variables: [
      {
        name: "clientName",
        description: "The name of the client",
        required: true,
        type: "string",
      },
      {
        name: "clientBio",
        description: "Client bio information (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientNicheTags",
        description: "Client niche tags (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientBusinessInfo",
        description: "Client business information (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientIndustry",
        description: "Client industry (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientVoice",
        description: "Client voice and tone (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "topic",
        description: "The topic to generate angles for",
        required: true,
        type: "string",
      },
      {
        name: "research",
        description:
          "Research content to base angles on (automatically uses either automated research from articles or manual research input based on user selection)",
        required: true,
        type: "string",
      },
      {
        name: "selectedArticle",
        description: "Selected article information (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "customInstructions",
        description: "Custom instructions from the user",
        required: false,
        type: "string",
      },
    ],
  },
  generate_hooks: {
    title: "Hook Generation Prompt",
    description: "Creates engaging hooks from selected angles",
    category: "Thread Writer",
    variables: [
      {
        name: "clientName",
        description: "The name of the client",
        required: true,
        type: "string",
      },
      {
        name: "clientBio",
        description: "Client bio information (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientNicheTags",
        description: "Client niche tags (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientBusinessInfo",
        description: "Client business information (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientIndustry",
        description: "Client industry (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "clientVoice",
        description: "Client voice and tone (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "topic",
        description: "The topic/niche for the hooks",
        required: true,
        type: "string",
      },
      {
        name: "selectedAngleTitle",
        description: "Title of the selected content angle",
        required: true,
        type: "string",
      },
      {
        name: "selectedAngleExplanation",
        description: "Explanation of the selected content angle",
        required: true,
        type: "string",
      },
      {
        name: "selectedAngleScore",
        description: "Engagement score of the selected angle",
        required: true,
        type: "string",
      },
      {
        name: "selectedArticle",
        description: "Selected article information (formatted)",
        required: false,
        type: "string",
      },
      {
        name: "customInstructions",
        description: "Custom instructions from the user",
        required: false,
        type: "string",
      },
      {
        name: "research",
        description: "Research content to inform hooks",
        required: true,
        type: "string",
      },
    ],
  },

  thread_generation_workflow: {
    title: "Thread Generation Workflow",
    description:
      "Complete 5-step thread generation: thread generation, fact check, apply transition, evaluate thread, and apply changes",
    category: "Thread Writer",
    isMultiStep: true,
    steps: [
      {
        stepNumber: 1,
        title: "Thread Generation",
        description: "Generate initial thread content",
        variables: [
          {
            name: "clientName",
            description: "The name of the client",
            required: false,
            type: "string",
          },
          {
            name: "clientBio",
            description: "Client bio information",
            required: false,
            type: "string",
          },
          {
            name: "clientBusinessInfo",
            description: "Client business information",
            required: false,
            type: "string",
          },
          {
            name: "clientIndustry",
            description: "Client industry",
            required: false,
            type: "string",
          },
          {
            name: "clientNicheTags",
            description: "Client niche tags (comma-separated)",
            required: false,
            type: "string",
          },
          {
            name: "topic",
            description: "The topic for the thread",
            required: true,
            type: "string",
          },
          {
            name: "hook",
            description: "The selected hook to start the thread",
            required: true,
            type: "string",
          },
          {
            name: "articleTitle",
            description: "Title of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleUrl",
            description: "URL of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleSource",
            description: "Source of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articlePublishedAt",
            description: "Publication date of the article",
            required: false,
            type: "string",
          },
          {
            name: "articleSummary",
            description: "Summary of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "angleTitle",
            description: "Title of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "angleExplanation",
            description: "Explanation of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "clientVoice",
            description: "Client voice and tone",
            required: true,
            type: "string",
          },
          {
            name: "research",
            description: "Research content for the thread",
            required: true,
            type: "string",
          },
        ],
      },
      {
        stepNumber: 2,
        title: "Fact Checker",
        description: "Verify the accuracy of information in the thread content",
        variables: [
          {
            name: "clientName",
            description: "The name of the client",
            required: false,
            type: "string",
          },
          {
            name: "clientBio",
            description: "Client bio information",
            required: false,
            type: "string",
          },
          {
            name: "clientBusinessInfo",
            description: "Client business information",
            required: false,
            type: "string",
          },
          {
            name: "clientIndustry",
            description: "Client industry",
            required: false,
            type: "string",
          },
          {
            name: "clientNicheTags",
            description: "Client niche tags (comma-separated)",
            required: false,
            type: "string",
          },
          {
            name: "topic",
            description: "The topic for the thread",
            required: true,
            type: "string",
          },
          {
            name: "hook",
            description: "The selected hook to start the thread",
            required: true,
            type: "string",
          },
          {
            name: "articleTitle",
            description: "Title of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleUrl",
            description: "URL of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleSource",
            description: "Source of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articlePublishedAt",
            description: "Publication date of the article",
            required: false,
            type: "string",
          },
          {
            name: "articleSummary",
            description: "Summary of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "angleTitle",
            description: "Title of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "angleExplanation",
            description: "Explanation of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "clientVoice",
            description: "Client voice and tone",
            required: true,
            type: "string",
          },
          {
            name: "research",
            description: "Research content for the thread",
            required: true,
            type: "string",
          },
        ],
      },
      {
        stepNumber: 3,
        title: "Apply Transition",
        description: "Apply smooth transitions between thread posts",
        variables: [
          {
            name: "clientName",
            description: "The name of the client",
            required: false,
            type: "string",
          },
          {
            name: "clientBio",
            description: "Client bio information",
            required: false,
            type: "string",
          },
          {
            name: "clientBusinessInfo",
            description: "Client business information",
            required: false,
            type: "string",
          },
          {
            name: "clientIndustry",
            description: "Client industry",
            required: false,
            type: "string",
          },
          {
            name: "clientNicheTags",
            description: "Client niche tags (comma-separated)",
            required: false,
            type: "string",
          },
          {
            name: "topic",
            description: "The topic for the thread",
            required: true,
            type: "string",
          },
          {
            name: "hook",
            description: "The selected hook to start the thread",
            required: true,
            type: "string",
          },
          {
            name: "articleTitle",
            description: "Title of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleUrl",
            description: "URL of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleSource",
            description: "Source of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articlePublishedAt",
            description: "Publication date of the article",
            required: false,
            type: "string",
          },
          {
            name: "articleSummary",
            description: "Summary of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "angleTitle",
            description: "Title of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "angleExplanation",
            description: "Explanation of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "clientVoice",
            description: "Client voice and tone",
            required: true,
            type: "string",
          },
          {
            name: "research",
            description: "Research content for the thread",
            required: true,
            type: "string",
          },
        ],
      },
      {
        stepNumber: 4,
        title: "Evaluate Thread",
        description: "Evaluate the thread for engagement potential and quality",
        variables: [
          {
            name: "clientName",
            description: "The name of the client",
            required: false,
            type: "string",
          },
          {
            name: "clientBio",
            description: "Client bio information",
            required: false,
            type: "string",
          },
          {
            name: "clientBusinessInfo",
            description: "Client business information",
            required: false,
            type: "string",
          },
          {
            name: "clientIndustry",
            description: "Client industry",
            required: false,
            type: "string",
          },
          {
            name: "clientNicheTags",
            description: "Client niche tags (comma-separated)",
            required: false,
            type: "string",
          },
          {
            name: "topic",
            description: "The topic for the thread",
            required: true,
            type: "string",
          },
          {
            name: "hook",
            description: "The selected hook to start the thread",
            required: true,
            type: "string",
          },
          {
            name: "articleTitle",
            description: "Title of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleUrl",
            description: "URL of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleSource",
            description: "Source of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articlePublishedAt",
            description: "Publication date of the article",
            required: false,
            type: "string",
          },
          {
            name: "articleSummary",
            description: "Summary of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "angleTitle",
            description: "Title of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "angleExplanation",
            description: "Explanation of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "clientVoice",
            description: "Client voice and tone",
            required: true,
            type: "string",
          },
          {
            name: "research",
            description: "Research content for the thread",
            required: true,
            type: "string",
          },
        ],
      },
      {
        stepNumber: 5,
        title: "Apply Changes",
        description: "Generate the final thread with all improvements applied",
        variables: [
          {
            name: "clientName",
            description: "The name of the client",
            required: false,
            type: "string",
          },
          {
            name: "clientBio",
            description: "Client bio information",
            required: false,
            type: "string",
          },
          {
            name: "clientBusinessInfo",
            description: "Client business information",
            required: false,
            type: "string",
          },
          {
            name: "clientIndustry",
            description: "Client industry",
            required: false,
            type: "string",
          },
          {
            name: "clientNicheTags",
            description: "Client niche tags (comma-separated)",
            required: false,
            type: "string",
          },
          {
            name: "topic",
            description: "The topic for the thread",
            required: true,
            type: "string",
          },
          {
            name: "hook",
            description: "The selected hook to start the thread",
            required: true,
            type: "string",
          },
          {
            name: "articleTitle",
            description: "Title of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleUrl",
            description: "URL of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articleSource",
            description: "Source of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "articlePublishedAt",
            description: "Publication date of the article",
            required: false,
            type: "string",
          },
          {
            name: "articleSummary",
            description: "Summary of the selected article",
            required: false,
            type: "string",
          },
          {
            name: "angleTitle",
            description: "Title of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "angleExplanation",
            description: "Explanation of the selected angle",
            required: false,
            type: "string",
          },
          {
            name: "clientVoice",
            description: "Client voice and tone",
            required: true,
            type: "string",
          },
          {
            name: "research",
            description: "Research content for the thread",
            required: true,
            type: "string",
          },
        ],
      },
    ],
    // Combine all variables for the overall interface
    variables: [
      {
        name: "clientName",
        description: "The name of the client",
        required: false,
        type: "string",
      },
      {
        name: "clientBio",
        description: "Client bio information",
        required: false,
        type: "string",
      },
      {
        name: "clientBusinessInfo",
        description: "Client business information",
        required: false,
        type: "string",
      },
      {
        name: "clientIndustry",
        description: "Client industry",
        required: false,
        type: "string",
      },
      {
        name: "clientNicheTags",
        description: "Client niche tags (comma-separated)",
        required: false,
        type: "string",
      },
      {
        name: "topic",
        description: "The topic for the thread",
        required: true,
        type: "string",
      },
      {
        name: "hook",
        description: "The selected hook to start the thread",
        required: true,
        type: "string",
      },
      {
        name: "articleTitle",
        description: "Title of the selected article",
        required: false,
        type: "string",
      },
      {
        name: "articleUrl",
        description: "URL of the selected article",
        required: false,
        type: "string",
      },
      {
        name: "articleSource",
        description: "Source of the selected article",
        required: false,
        type: "string",
      },
      {
        name: "articlePublishedAt",
        description: "Publication date of the article",
        required: false,
        type: "string",
      },
      {
        name: "articleSummary",
        description: "Summary of the selected article",
        required: false,
        type: "string",
      },
      {
        name: "angleTitle",
        description: "Title of the selected angle",
        required: false,
        type: "string",
      },
      {
        name: "angleExplanation",
        description: "Explanation of the selected angle",
        required: false,
        type: "string",
      },
      {
        name: "clientVoice",
        description: "Client voice and tone",
        required: true,
        type: "string",
      },
      {
        name: "research",
        description: "Research content for the thread",
        required: true,
        type: "string",
      },
    ],
  },
  polish_hooks: {
    title: "Hook Polishing Workflow",
    description: "Complete 3-step hook polishing and fact-checking workflow",
    category: "Hook Polisher",
    isMultiStep: true,
    steps: [
      {
        stepNumber: 1,
        title: "Hook Polishing",
        description: "Polish and create 10 improved hook variations",
        variables: [
          {
            name: "hook",
            description: "The original hook to be polished",
            required: true,
            type: "string",
          },
          {
            name: "threadContext",
            description: "Context about the thread content",
            required: false,
            type: "string",
          },
          {
            name: "research",
            description: "Research content to inform polishing",
            required: false,
            type: "string",
          },
          {
            name: "angle",
            description: "The content angle being used",
            required: false,
            type: "string",
          },
        ],
      },
      {
        stepNumber: 2,
        title: "Information Fact Check",
        description: "Fact-check the source information for accuracy",
        variables: [
          {
            name: "hook",
            description: "The original hook being fact-checked",
            required: true,
            type: "string",
          },
          {
            name: "threadContext",
            description: "Context about the thread content",
            required: false,
            type: "string",
          },
          {
            name: "research",
            description: "Research content to verify",
            required: false,
            type: "string",
          },
          {
            name: "angle",
            description: "The content angle being used",
            required: false,
            type: "string",
          },
        ],
      },
      {
        stepNumber: 3,
        title: "Hook Fact Check",
        description: "Verify the polished hooks for accuracy and consistency",
        variables: [
          {
            name: "hook",
            description: "The original hook",
            required: true,
            type: "string",
          },
          {
            name: "threadContext",
            description: "Context about the thread content",
            required: false,
            type: "string",
          },
          {
            name: "research",
            description: "Research content for verification",
            required: false,
            type: "string",
          },
          {
            name: "angle",
            description: "The content angle being used",
            required: false,
            type: "string",
          },
        ],
      },
    ],
    // Combine all variables for the overall interface
    variables: [
      {
        name: "hook",
        description: "The original hook",
        required: true,
        type: "string",
      },
      {
        name: "threadContext",
        description: "Context about the thread content",
        required: false,
        type: "string",
      },
      {
        name: "research",
        description: "Research content",
        required: false,
        type: "string",
      },
      {
        name: "angle",
        description: "The content angle being used",
        required: false,
        type: "string",
      },
    ],
  },
  linkedin_post_generation: {
    title: "LinkedIn Post Generation Workflow",
    description:
      "Complete 4-step LinkedIn post generation: process, fact check, evaluate, and optimize",
    category: "LinkedIn Posts",
    isMultiStep: true,
    steps: [
      {
        stepNumber: 1,
        title: "Process Thread",
        description: "Initial processing and analysis of the thread content",
        variables: [
          {
            name: "thread",
            description: "The original thread content",
            required: true,
            type: "string",
          },
          {
            name: "specificInstructions",
            description: "User-provided specific instructions",
            required: false,
            type: "string",
          },
          {
            name: "clientContext",
            description:
              "Client context information (name, bio, industry, voice, etc.)",
            required: false,
            type: "string",
          },
        ],
      },
      {
        stepNumber: 2,
        title: "Fact Check",
        description: "Verify the accuracy of information in the thread content",
        variables: [
          {
            name: "thread",
            description: "The original thread content",
            required: true,
            type: "string",
          },
          {
            name: "specificInstructions",
            description: "User-provided specific instructions",
            required: false,
            type: "string",
          },
          {
            name: "clientContext",
            description:
              "Client context information (name, bio, industry, voice, etc.)",
            required: false,
            type: "string",
          },
        ],
      },
      {
        stepNumber: 3,
        title: "Evaluate Post",
        description:
          "Assess the LinkedIn engagement potential and optimize content",
        variables: [
          {
            name: "thread",
            description: "The original thread content",
            required: true,
            type: "string",
          },
          {
            name: "specificInstructions",
            description: "User-provided specific instructions",
            required: false,
            type: "string",
          },
          {
            name: "clientContext",
            description:
              "Client context information (name, bio, industry, voice, etc.)",
            required: false,
            type: "string",
          },
        ],
      },
      {
        stepNumber: 4,
        title: "Apply Optimization",
        description: "Generate the final optimized LinkedIn post",
        variables: [
          {
            name: "thread",
            description: "The original thread content",
            required: true,
            type: "string",
          },
          {
            name: "specificInstructions",
            description: "User-provided specific instructions",
            required: false,
            type: "string",
          },
          {
            name: "clientContext",
            description:
              "Client context information (name, bio, industry, voice, etc.)",
            required: false,
            type: "string",
          },
        ],
      },
    ],
    // Combine all variables for the overall interface
    variables: [
      {
        name: "thread",
        description: "The original thread content",
        required: true,
        type: "string",
      },
      {
        name: "specificInstructions",
        description: "User-provided specific instructions",
        required: false,
        type: "string",
      },
      {
        name: "clientContext",
        description:
          "Client context information (name, bio, industry, voice, etc.)",
        required: false,
        type: "string",
      },
    ],
  },
};

const featureColors: Record<string, string> = {
  rank_articles: "blue",
  generate_angles: "green",
  generate_hooks: "orange",
  thread_generation_workflow: "violet",
  polish_hooks_step1: "teal",
  polish_hooks_step2_fact_check: "teal",
  polish_hooks_step3_hook_fact_check: "teal",
  linkedin_post_generation_step1: "indigo",
  linkedin_post_generation_step2_fact_check: "indigo",
  linkedin_post_generation_step3_evaluate: "indigo",
  linkedin_post_generation_step4_optimize: "indigo",
};

// Fullscreen Editor Component
interface FullscreenEditorProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  extensions: any[];
  theme: any;
  placeholder?: string;
  onClose: () => void;
}

const FullscreenEditor: React.FC<FullscreenEditorProps> = ({
  title,
  value,
  onChange,
  extensions,
  theme,
  placeholder,
  onClose,
}) => {
  const { isDarkMode } = useDarkMode();
  const mantineTheme = useMantineTheme();

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconMaximize size={18} />
          <Text fw={600}>{title}</Text>
        </Group>
      }
      size="70%"
      padding="xl"
      centered
      styles={{
        content: {
          backgroundColor: isDarkMode ? "rgb(15, 23, 42)" : "#ffffff",
          border: isDarkMode
            ? "1px solid rgb(51, 65, 85)"
            : "1px solid #e2e8f0",
        },
        header: {
          backgroundColor: isDarkMode ? "rgb(15, 23, 42)" : "#ffffff",
          borderBottom: isDarkMode
            ? "1px solid rgb(51, 65, 85)"
            : "1px solid #e2e8f0",
        },
        body: {
          backgroundColor: isDarkMode ? "rgb(15, 23, 42)" : "#ffffff",
          padding: 0,
        },
      }}
    >
      <Box
        style={{
          height: "80vh",
          backgroundColor: isDarkMode ? "rgb(15, 23, 42)" : "#ffffff",
        }}
      >
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={[
            ...extensions,
            EditorView.theme({
              "&": {
                height: "100%",
                fontSize: "16px", // Larger font for fullscreen
              },
              ".cm-content": {
                padding: "2rem",
                minHeight: "100%",
                lineHeight: "1.8", // More comfortable line height
              },
              ".cm-focused": {
                outline: "none",
              },
              ".cm-editor": {
                height: "100%",
                border: isDarkMode
                  ? "1px solid rgb(51, 65, 85)"
                  : "1px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: isDarkMode ? "rgb(30, 41, 59)" : "white",
                boxShadow: isDarkMode
                  ? "0 8px 25px rgba(0, 0, 0, 0.5)"
                  : "0 4px 20px rgba(0, 0, 0, 0.1)",
              },
              ".cm-scroller": {
                fontSize: "16px",
              },
            }),
          ]}
          theme={theme}
          placeholder={placeholder}
          height="100%"
        />
        {/* Character count in fullscreen */}
        <Box
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            backgroundColor: isDarkMode
              ? "rgba(30, 41, 59, 0.9)"
              : "rgba(255, 255, 255, 0.9)",
            padding: "8px 12px",
            borderRadius: "6px",
            border: isDarkMode
              ? "1px solid rgb(51, 65, 85)"
              : "1px solid #e2e8f0",
            backdropFilter: "blur(10px)",
          }}
        >
          <Text
            size="sm"
            c={
              isDarkMode
                ? mantineTheme.colors.gray[4]
                : mantineTheme.colors.gray[6]
            }
          >
            {value.length} characters
          </Text>
        </Box>
      </Box>
    </Modal>
  );
};

export default function PromptEditPage() {
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();
  const params = useParams();
  const router = useRouter();
  const feature = params?.feature as string;

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [template, setTemplate] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  // For multi-step prompts like hook polishing
  const [stepTemplates, setStepTemplates] = useState<{ [key: number]: string }>(
    {}
  );
  const [lastFocusedEditor, setLastFocusedEditor] =
    useState<string>("template");

  // Fullscreen state management
  const [fullscreenEditor, setFullscreenEditor] = useState<{
    type: "system" | "template" | "step";
    stepNumber?: number;
    title: string;
  } | null>(null);

  const promptConfig = promptConfigs[feature];

  // Fullscreen toggle functions
  const openFullscreen = (
    type: "system" | "template" | "step",
    title: string,
    stepNumber?: number
  ) => {
    setFullscreenEditor({ type, title, stepNumber });
  };

  const closeFullscreen = () => {
    setFullscreenEditor(null);
  };

  // Get fullscreen editor value and onChange based on type
  const getFullscreenEditorProps = () => {
    if (!fullscreenEditor) return null;

    switch (fullscreenEditor.type) {
      case "system":
        return {
          value: systemPrompt,
          onChange: setSystemPrompt,
          extensions: systemPromptExtensions,
        };
      case "template":
        return {
          value: template,
          onChange: setTemplate,
          extensions: templateExtensions,
        };
      case "step":
        return {
          value: stepTemplates[fullscreenEditor.stepNumber || 1] || "",
          onChange: (value: string) =>
            setStepTemplates((prev) => ({
              ...prev,
              [fullscreenEditor.stepNumber || 1]: value,
            })),
          extensions: stepExtensions,
        };
      default:
        return null;
    }
  };

  // Create decoration types for valid and invalid variables
  const validVariableDecoration = Decoration.mark({
    attributes: {
      style: `
        color: ${isDarkMode ? "#A78BFA" : "#7C3AED"};
        background-color: ${
          isDarkMode ? "rgba(167, 139, 250, 0.15)" : "rgba(124, 58, 237, 0.1)"
        };
        border-radius: 3px;
        padding: 1px 3px;
        font-weight: 600;
      `,
    },
  });

  const invalidVariableDecoration = Decoration.mark({
    attributes: {
      style: `
        color: ${isDarkMode ? "#F87171" : "#DC2626"};
        background-color: ${
          isDarkMode ? "rgba(248, 113, 113, 0.15)" : "rgba(220, 38, 38, 0.1)"
        };
        border-radius: 3px;
        padding: 1px 3px;
        font-weight: 600;
        text-decoration: underline wavy;
      `,
    },
  });

  // State field for managing variable decorations
  const variableHighlightField = StateField.define<DecorationSet>({
    create() {
      return Decoration.none;
    },
    update(decorations, tr) {
      if (!promptConfig) return decorations;

      const availableVarNames = promptConfig.variables.map((v) => v.name);
      const doc = tr.state.doc;
      const newDecorations: any[] = [];

      // Find all variable patterns, but ignore escaped ones
      // This regex looks for {{ }} that are not preceded by \
      const variableRegex = /(?<!\\)\{\{([^}]+)\}\}/g;
      const text = doc.toString();
      let match;

      while ((match = variableRegex.exec(text)) !== null) {
        const varName = match[1];
        const from = match.index;
        const to = match.index + match[0].length;

        const decoration = availableVarNames.includes(varName)
          ? validVariableDecoration
          : invalidVariableDecoration;

        newDecorations.push(decoration.range(from, to));
      }

      return Decoration.set(newDecorations);
    },
    provide: (f) => EditorView.decorations.from(f),
  });

  // Function to validate variables in template
  const validateTemplate = (text: string) => {
    const availableVarNames = promptConfig?.variables.map((v) => v.name) || [];
    // Use the same regex that ignores escaped braces
    const usedVariables = [...text.matchAll(/(?<!\\)\{\{([^}]+)\}\}/g)].map(
      (match) => match[1]
    );
    const invalidVariables = usedVariables.filter(
      (varName) => !availableVarNames.includes(varName)
    );

    return {
      isValid: invalidVariables.length === 0,
      invalidVariables,
      usedVariables,
    };
  };

  // Function to validate variables in system prompt
  const validateSystemPrompt = (text: string) => {
    const availableVarNames = promptConfig?.variables.map((v) => v.name) || [];
    // Use the same regex that ignores escaped braces
    const usedVariables = [...text.matchAll(/(?<!\\)\{\{([^}]+)\}\}/g)].map(
      (match) => match[1]
    );
    const invalidVariables = usedVariables.filter(
      (varName) => !availableVarNames.includes(varName)
    );

    return {
      isValid: invalidVariables.length === 0,
      invalidVariables,
      usedVariables,
    };
  };

  const templateValidation = validateTemplate(template);
  const systemPromptValidation = validateSystemPrompt(systemPrompt);

  // Simple, static extensions for all editors
  const basicExtensions = useMemo(
    () => [variableHighlightField, EditorView.lineWrapping],
    [variableHighlightField]
  );

  const systemPromptExtensions = useMemo(
    () => [
      ...basicExtensions,
      EditorView.theme({
        "&": {
          fontSize: "14px",
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        },
        ".cm-content": {
          padding: "1rem",
          minHeight: "200px",
          lineHeight: "1.6",
        },
        ".cm-focused": {
          outline: "none",
        },
        ".cm-editor": {
          borderRadius: "4px",
          border: `2px solid ${
            isDarkMode ? "rgba(90, 50, 140, 0.3)" : "#e9ecef"
          }`,
          backgroundColor: isDarkMode ? "rgba(30, 30, 40, 0.5)" : "white",
        },
        ".cm-editor.cm-focused": {
          borderColor: isDarkMode ? "rgba(90, 50, 140, 0.6)" : "#6c5ce7",
          boxShadow: `0 0 0 3px ${
            isDarkMode ? "rgba(90, 50, 140, 0.15)" : "rgba(108, 92, 231, 0.15)"
          }`,
        },
        ".cm-placeholder": {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          fontStyle: "italic",
        },
        ".cm-gutter": {
          order: 2,
          borderLeft: `1px solid ${
            isDarkMode ? "rgba(90, 50, 140, 0.3)" : "#e9ecef"
          }`,
          borderRight: "none",
        },
        ".cm-scroller": {
          display: "flex",
          flexDirection: "row-reverse",
        },
      }),
    ],
    [basicExtensions, isDarkMode]
  );

  const templateExtensions = useMemo(
    () => [
      ...basicExtensions,
      EditorView.theme({
        "&": {
          fontSize: "14px",
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        },
        ".cm-content": {
          padding: "1rem",
          minHeight: "400px",
          lineHeight: "1.6",
        },
        ".cm-focused": {
          outline: "none",
        },
        ".cm-editor": {
          borderRadius: "4px",
          border: `2px solid ${
            templateValidation.isValid
              ? isDarkMode
                ? "rgba(90, 50, 140, 0.3)"
                : "#e9ecef"
              : isDarkMode
              ? "rgba(248, 113, 113, 0.4)"
              : "#dc2626"
          }`,
          backgroundColor: isDarkMode ? "rgba(30, 30, 40, 0.5)" : "white",
        },
        ".cm-editor.cm-focused": {
          borderColor: isDarkMode ? "rgba(90, 50, 140, 0.6)" : "#6c5ce7",
          boxShadow: `0 0 0 3px ${
            isDarkMode ? "rgba(90, 50, 140, 0.15)" : "rgba(108, 92, 231, 0.15)"
          }`,
        },
        ".cm-placeholder": {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          fontStyle: "italic",
        },
        ".cm-gutter": {
          order: 2,
          borderLeft: `1px solid ${
            isDarkMode ? "rgba(90, 50, 140, 0.3)" : "#e9ecef"
          }`,
          borderRight: "none",
        },
        ".cm-scroller": {
          display: "flex",
          flexDirection: "row-reverse",
        },
      }),
    ],
    [basicExtensions, isDarkMode, templateValidation.isValid]
  );

  const stepExtensions = useMemo(
    () => [
      ...basicExtensions,
      EditorView.theme({
        "&": {
          fontSize: "14px",
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        },
        ".cm-content": {
          padding: "1rem",
          minHeight: "300px",
          lineHeight: "1.6",
        },
        ".cm-focused": {
          outline: "none",
        },
        ".cm-editor": {
          borderRadius: "4px",
          border: `2px solid ${
            isDarkMode ? "rgba(90, 50, 140, 0.3)" : "#e9ecef"
          }`,
          backgroundColor: isDarkMode ? "rgba(30, 30, 40, 0.5)" : "white",
        },
        ".cm-editor.cm-focused": {
          borderColor: isDarkMode ? "rgba(90, 50, 140, 0.6)" : "#6c5ce7",
          boxShadow: `0 0 0 3px ${
            isDarkMode ? "rgba(90, 50, 140, 0.15)" : "rgba(108, 92, 231, 0.15)"
          }`,
        },
        ".cm-placeholder": {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          fontStyle: "italic",
        },
        ".cm-gutter": {
          order: 2,
          borderLeft: `1px solid ${
            isDarkMode ? "rgba(90, 50, 140, 0.3)" : "#e9ecef"
          }`,
          borderRight: "none",
        },
        ".cm-scroller": {
          display: "flex",
          flexDirection: "row-reverse",
        },
      }),
    ],
    [basicExtensions, isDarkMode]
  );

  useEffect(() => {
    if (feature && promptConfig) {
      fetchPrompt();
    }
  }, [feature]);

  const fetchPrompt = async () => {
    try {
      setLoading(true);

      const prompts = await apiHelpers.get<Prompt[]>("/prompts");

      if (promptConfig.isMultiStep) {
        // For multi-step prompts like hook polishing and LinkedIn post generation, load all step prompts
        let stepPrompts: { [key: number]: Prompt | undefined } = {};

        if (feature === "polish_hooks") {
          stepPrompts = {
            1: prompts.find((p) => p.feature === "polish_hooks_step1"),
            2: prompts.find(
              (p) => p.feature === "polish_hooks_step2_fact_check"
            ),
            3: prompts.find(
              (p) => p.feature === "polish_hooks_step3_hook_fact_check"
            ),
          };
        } else if (feature === "linkedin_post_generation") {
          stepPrompts = {
            1: prompts.find(
              (p) => p.feature === "linkedin_post_generation_step1"
            ),
            2: prompts.find(
              (p) => p.feature === "linkedin_post_generation_step2_fact_check"
            ),
            3: prompts.find(
              (p) => p.feature === "linkedin_post_generation_step3_evaluate"
            ),
            4: prompts.find(
              (p) => p.feature === "linkedin_post_generation_step4_optimize"
            ),
          };
        } else if (feature === "thread_generation_workflow") {
          stepPrompts = {
            1: prompts.find((p) => p.feature === "thread_generation_step1"),
            2: prompts.find(
              (p) => p.feature === "thread_generation_step2_fact_check"
            ),
            3: prompts.find(
              (p) => p.feature === "thread_generation_step3_apply_transition"
            ),
            4: prompts.find(
              (p) => p.feature === "thread_generation_step4_evaluate_thread"
            ),
            5: prompts.find(
              (p) => p.feature === "thread_generation_step5_apply_changes"
            ),
          };
        }

        // Load step templates
        const loadedStepTemplates: { [key: number]: string } = {};
        Object.entries(stepPrompts).forEach(([stepNum, prompt]) => {
          if (prompt) {
            loadedStepTemplates[parseInt(stepNum)] = prompt.template;
          }
        });
        setStepTemplates(loadedStepTemplates);

        // Use the first step's system prompt or empty
        const firstStepPrompt = stepPrompts[1];
        setSystemPrompt(firstStepPrompt?.systemPrompt || "");

        // Set prompt to first step for reference
        if (firstStepPrompt) {
          setPrompt(firstStepPrompt);
        }
      } else {
        // Single-step prompt
        const existingPrompt = prompts.find((p) => p.feature === feature);

        if (existingPrompt) {
          setPrompt(existingPrompt);
          setTemplate(existingPrompt.template);
          setSystemPrompt(existingPrompt.systemPrompt || "");
        } else {
          // No existing prompt - start with empty template
          setTemplate("");
          setSystemPrompt("");
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching prompt:", err);
      setError("Failed to load prompt");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (promptConfig.isMultiStep) {
        // Save all step prompts for multi-step workflows
        let stepFeatures: string[] = [];
        let stepTitles: string[] = [];

        if (feature === "polish_hooks") {
          stepFeatures = [
            "polish_hooks_step1",
            "polish_hooks_step2_fact_check",
            "polish_hooks_step3_hook_fact_check",
          ];
          stepTitles = [
            "Step 1: Hook Polishing",
            "Step 2: Information Fact Check",
            "Step 3: Hook Fact Check",
          ];
        } else if (feature === "linkedin_post_generation") {
          stepFeatures = [
            "linkedin_post_generation_step1",
            "linkedin_post_generation_step2_fact_check",
            "linkedin_post_generation_step3_evaluate",
            "linkedin_post_generation_step4_optimize",
          ];
          stepTitles = [
            "Step 1: Process Thread",
            "Step 2: Fact Check",
            "Step 3: Evaluate Post",
            "Step 4: Apply Optimization",
          ];
        } else if (feature === "thread_generation_workflow") {
          stepFeatures = [
            "thread_generation_step1",
            "thread_generation_step2_fact_check",
            "thread_generation_step3_apply_transition",
            "thread_generation_step4_evaluate_thread",
            "thread_generation_step5_apply_changes",
          ];
          stepTitles = [
            "Step 1: Thread Generation",
            "Step 2: Fact Checker",
            "Step 3: Apply Transition",
            "Step 4: Evaluate Thread",
            "Step 5: Apply Changes",
          ];
        }

        // Get existing prompts
        const prompts = await apiHelpers.get<Prompt[]>("/prompts");

        // Save each step (only if it has content)
        const stepCount =
          feature === "linkedin_post_generation"
            ? 4
            : feature === "thread_generation_workflow"
            ? 5
            : 3;
        for (let i = 0; i < stepCount; i++) {
          const stepNumber = i + 1;
          const stepFeature = stepFeatures[i];
          const stepTitle = stepTitles[i];
          const stepTemplate = stepTemplates[stepNumber] || "";

          // Skip empty templates - don't save steps without content
          if (!stepTemplate.trim()) {
            continue;
          }

          const stepPromptData = {
            name: stepTitle,
            feature: stepFeature,
            template: stepTemplate,
            systemPrompt,
            description:
              promptConfig.steps[i]?.description ||
              `Step ${stepNumber} of the ${promptConfig.title} workflow`,
            category: promptConfig.category,
            availableVariables:
              promptConfig.steps[i]?.variables || promptConfig.variables,
            isActive: true,
            isDefault: true,
          };

          const existingStepPrompt = prompts.find(
            (p) => p.feature === stepFeature
          );

          if (existingStepPrompt) {
            // Update existing step prompt
            await apiHelpers.patch(
              `/prompts/${existingStepPrompt._id}`,
              stepPromptData
            );
          } else {
            // Create new step prompt
            await apiHelpers.post("/prompts", stepPromptData);
          }
        }
      } else {
        // Single-step prompt save logic
        const promptData = {
          name: promptConfig.title,
          feature: feature,
          template,
          systemPrompt,
          description: promptConfig.description,
          category: promptConfig.category,
          availableVariables: promptConfig.variables,
          isActive: true,
          isDefault: true,
        };

        if (prompt) {
          // Update existing prompt
          await apiHelpers.patch(`/prompts/${prompt._id}`, promptData);
        } else {
          // Create new prompt
          const newPrompt = await apiHelpers.post<Prompt>(
            "/prompts",
            promptData
          );
          setPrompt(newPrompt);
        }
      }

      await fetchPrompt(); // Refresh

      // Show success notification
      showSuccessNotification({
        id: "prompt-save-success",
        title: "Prompts Updated!",
        message: `Successfully updated the ${promptConfig.title.toLowerCase()}`,
      });
    } catch (err) {
      console.error("Error saving prompt:", err);
      const errorMessage = "Failed to save prompt";
      setError(errorMessage);

      // Show error notification
      showErrorNotification({
        id: "prompt-save-error",
        title: "Save Failed",
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variableName: string) => {
    const variableText = `{{${variableName}}}`;

    // Check if user is in fullscreen mode and insert into the correct editor
    if (fullscreenEditor) {
      switch (fullscreenEditor.type) {
        case "system":
          setSystemPrompt((prev) => prev + variableText);
          break;
        case "template":
          setTemplate((prev) => prev + variableText);
          break;
        case "step":
          setStepTemplates((prev) => ({
            ...prev,
            [fullscreenEditor.stepNumber || 1]:
              (prev[fullscreenEditor.stepNumber || 1] || "") + variableText,
          }));
          break;
      }
      return;
    }

    // Normal mode: based on last focused editor or default behavior
    if (lastFocusedEditor === "system") {
      setSystemPrompt((prev) => prev + variableText);
    } else if (promptConfig.isMultiStep) {
      // For multi-step, append to step 1 by default
      setStepTemplates((prev) => ({
        ...prev,
        1: (prev[1] || "") + variableText,
      }));
    } else {
      // For single-step, append to main template
      setTemplate((prev) => prev + variableText);
    }
  };

  if (!promptConfig) {
    return (
      <DashboardLayout>
        <Container size="xl" style={{ paddingTop: "2rem" }}>
          <Alert color="red" title="Invalid Feature">
            The feature &quot;{feature}&quot; is not recognized.
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Container size="xl" style={{ paddingTop: "2rem" }}>
          <Box ta="center" py="xl">
            <Loader color={isDarkMode ? "grape.4" : "indigo"} />
            <Text mt="md" c={isDarkMode ? theme.colors.gray[4] : undefined}>
              Loading prompt...
            </Text>
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  const fullscreenProps = getFullscreenEditorProps();

  return (
    <DashboardLayout>
      <style jsx global>{`
        .cm-gutter,
        .cm-gutters,
        .cm-lineNumbers,
        .cm-gutter.cm-lineNumbers {
          display: none !important;
        }
        .cm-editor .cm-scroller {
          padding-left: 0 !important;
        }
        .cm-content {
          padding-left: 1rem !important;
        }
      `}</style>
      {/* Fullscreen Editor Modal */}
      {fullscreenEditor && fullscreenProps && (
        <FullscreenEditor
          title={fullscreenEditor.title}
          value={fullscreenProps.value}
          onChange={fullscreenProps.onChange}
          extensions={fullscreenProps.extensions}
          theme={isDarkMode ? oneDark : undefined}
          placeholder="Enter your prompt here..."
          onClose={closeFullscreen}
        />
      )}

      <Container
        size="xl"
        style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
      >
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Group gap="md">
              <ActionIcon
                variant="light"
                size="lg"
                color={isDarkMode ? "grape.4" : "indigo"}
                onClick={() => router.push("/prompts")}
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
              <div>
                <Group gap="xs" mb="xs">
                  <Badge
                    color={featureColors[feature] || "gray"}
                    variant="light"
                  >
                    {feature.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge color="gray" variant="outline">
                    {promptConfig.category}
                  </Badge>
                  {!prompt && (
                    <Badge color="gray" variant="outline">
                      Not Configured
                    </Badge>
                  )}
                </Group>
                <Title
                  order={1}
                  fw={600}
                  c={isDarkMode ? theme.colors.gray[2] : theme.colors.dark[7]}
                >
                  {promptConfig.title}
                </Title>
                <Text
                  size="lg"
                  c={isDarkMode ? theme.colors.gray[4] : theme.colors.gray[6]}
                >
                  {promptConfig.description}
                </Text>
              </div>
            </Group>
            <Button
              leftSection={<IconDeviceFloppy size={18} />}
              color={isDarkMode ? "grape.4" : "indigo"}
              onClick={handleSave}
              loading={saving}
              disabled={
                promptConfig.isMultiStep
                  ? !Object.values(stepTemplates).some((t) => t?.trim())
                  : !template.trim() ||
                    !templateValidation.isValid ||
                    !systemPromptValidation.isValid
              }
              size="lg"
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
              {prompt ? "Update Prompts" : "Create Prompts"}
            </Button>
          </Group>

          {/* Error Alert */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Group align="flex-start" gap="xl">
            {/* Main Editor */}
            <Box style={{ flex: 2 }}>
              <Paper
                p="xl"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(30, 41, 59, 0.8)"
                    : "#f8f9fa",
                  borderColor: isDarkMode
                    ? "rgba(90, 50, 140, 0.3)"
                    : "#e9ecef",
                  border: isDarkMode
                    ? "1px solid rgba(90, 50, 140, 0.3)"
                    : "1px solid #e9ecef",
                }}
              >
                <Stack gap="lg">
                  <div>
                    <Group justify="space-between" align="center" mb="sm">
                      <div>
                        <Title
                          order={3}
                          c={
                            isDarkMode
                              ? theme.colors.gray[2]
                              : theme.colors.dark[7]
                          }
                        >
                          System Prompt
                        </Title>
                        <Text
                          size="sm"
                          c={
                            isDarkMode
                              ? theme.colors.gray[4]
                              : theme.colors.gray[6]
                          }
                          mt="xs"
                        >
                          Set the AI&apos;s context and behavior. You can use
                          dynamic variables like {"{{clientName}}"} or{" "}
                          {"{{topic}}"}.
                        </Text>
                      </div>
                      <ActionIcon
                        variant="light"
                        size="lg"
                        color={isDarkMode ? "grape.4" : "indigo"}
                        onClick={() =>
                          openFullscreen("system", "System Prompt")
                        }
                        title="Fullscreen Mode"
                      >
                        <IconMaximize size={18} />
                      </ActionIcon>
                    </Group>

                    <Box
                      style={{ position: "relative" }}
                      onClick={() => setLastFocusedEditor("system")}
                      onFocus={() => setLastFocusedEditor("system")}
                    >
                      <CodeMirror
                        value={systemPrompt}
                        onChange={(value) => setSystemPrompt(value)}
                        extensions={systemPromptExtensions}
                        theme={isDarkMode ? oneDark : undefined}
                        height="350px"
                        placeholder={`You are an AI assistant specialized in content creation for {{clientName}}.\n\nYour role is to help create engaging social media content about {{topic}}.\n\nUse variables like {{clientName}}, {{topic}}, {{clientVoice}} to personalize the context...`}
                      />
                    </Box>

                    {/* System Prompt Validation Errors */}
                    {!systemPromptValidation.isValid && (
                      <Alert
                        icon={<IconAlertCircle size={16} />}
                        color="red"
                        mt="sm"
                        styles={{
                          root: {
                            backgroundColor: isDarkMode
                              ? "rgba(220, 38, 38, 0.15)"
                              : undefined,
                            borderColor: isDarkMode
                              ? "rgba(220, 38, 38, 0.25)"
                              : undefined,
                          },
                          title: {
                            color: isDarkMode ? "#F87171" : undefined,
                          },
                          message: {
                            color: isDarkMode ? "#F87171" : undefined,
                          },
                        }}
                      >
                        <Text size="sm">
                          Invalid variables in system prompt:{" "}
                          <strong>
                            {systemPromptValidation.invalidVariables.join(", ")}
                          </strong>
                        </Text>
                        <Text size="xs" mt="xs">
                          Please use only the available variables from the
                          sidebar or remove the invalid ones.
                        </Text>
                      </Alert>
                    )}

                    {/* System Prompt Character Count */}
                    <Group justify="flex-end" align="center" mt="sm">
                      <Text
                        size="sm"
                        c={
                          isDarkMode
                            ? theme.colors.gray[5]
                            : theme.colors.gray[6]
                        }
                      >
                        {systemPrompt.length} characters
                      </Text>
                    </Group>
                  </div>

                  <Divider
                    color={isDarkMode ? "rgba(90, 50, 140, 0.4)" : undefined}
                  />

                  {/* Multi-step prompts (like hook polishing) */}
                  {promptConfig.isMultiStep ? (
                    promptConfig.steps?.map((step: any, stepIndex: number) => (
                      <div key={stepIndex}>
                        <Divider
                          color={
                            isDarkMode ? "rgba(90, 50, 140, 0.4)" : undefined
                          }
                          my="lg"
                        />
                        <Group justify="space-between" align="center" mb="sm">
                          <div>
                            <Title
                              order={3}
                              c={
                                isDarkMode
                                  ? theme.colors.gray[2]
                                  : theme.colors.dark[7]
                              }
                            >
                              Step {step.stepNumber}: {step.title}
                            </Title>
                            <Text
                              size="sm"
                              c={
                                isDarkMode
                                  ? theme.colors.gray[4]
                                  : theme.colors.gray[6]
                              }
                              mt="xs"
                            >
                              {step.description}
                            </Text>
                          </div>
                          <ActionIcon
                            variant="light"
                            size="lg"
                            color={isDarkMode ? "grape.4" : "indigo"}
                            onClick={() =>
                              openFullscreen(
                                "step",
                                `Step ${step.stepNumber}: ${step.title}`,
                                step.stepNumber
                              )
                            }
                            title="Fullscreen Mode"
                          >
                            <IconMaximize size={18} />
                          </ActionIcon>
                        </Group>

                        <Box style={{ position: "relative" }}>
                          <CodeMirror
                            value={stepTemplates[step.stepNumber] || ""}
                            onChange={(value) =>
                              setStepTemplates((prev) => ({
                                ...prev,
                                [step.stepNumber]: value,
                              }))
                            }
                            extensions={stepExtensions}
                            theme={isDarkMode ? oneDark : undefined}
                            height="450px"
                            placeholder={`Enter prompt template for step ${
                              step.stepNumber
                            }...\n\nExample:\nYou are an AI assistant for ${step.title.toLowerCase()}.\n\nUse variables like {{hook}} or {{threadContext}}\n\nPlease provide...`}
                          />
                        </Box>

                        <Group justify="flex-end" align="center" mt="sm">
                          <Text
                            size="sm"
                            c={
                              isDarkMode
                                ? theme.colors.gray[5]
                                : theme.colors.gray[6]
                            }
                          >
                            {(stepTemplates[step.stepNumber] || "").length}{" "}
                            characters
                          </Text>
                        </Group>
                      </div>
                    ))
                  ) : (
                    /* Single-step prompt */
                    <>
                      <Group justify="space-between" align="flex-start" mb="sm">
                        <div style={{ flex: 1, maxWidth: "calc(100% - 60px)" }}>
                          <Title
                            order={3}
                            c={
                              isDarkMode
                                ? theme.colors.gray[2]
                                : theme.colors.dark[7]
                            }
                          >
                            User Prompt Template
                          </Title>
                          <Text
                            size="sm"
                            c={
                              isDarkMode
                                ? theme.colors.gray[4]
                                : theme.colors.gray[6]
                            }
                            mt="xs"
                          >
                            Write your prompt template using the available
                            variables. Variables are referenced using double
                            curly braces like {"{{variable_name}}"}.
                          </Text>
                        </div>
                        <ActionIcon
                          variant="light"
                          size="lg"
                          color={isDarkMode ? "grape.4" : "indigo"}
                          onClick={() =>
                            openFullscreen("template", "User Prompt Template")
                          }
                          title="Fullscreen Mode"
                          style={{ flexShrink: 0 }}
                        >
                          <IconMaximize size={18} />
                        </ActionIcon>
                      </Group>

                      <Box
                        style={{ position: "relative" }}
                        onClick={() => setLastFocusedEditor("template")}
                        onFocus={() => setLastFocusedEditor("template")}
                      >
                        <CodeMirror
                          value={template}
                          onChange={(value) => setTemplate(value)}
                          extensions={templateExtensions}
                          theme={isDarkMode ? oneDark : undefined}
                          height="500px"
                          placeholder={`Enter your prompt template here...\n\nExample:\nYou are an AI assistant helping to ${promptConfig.description.toLowerCase()}.\n\nClient: {{clientName}}\nTopic: {{topic}}\n\nPlease provide...`}
                        />
                      </Box>

                      {!templateValidation.isValid && (
                        <Alert
                          icon={<IconAlertCircle size={16} />}
                          color="red"
                          mb="sm"
                          styles={{
                            root: {
                              backgroundColor: isDarkMode
                                ? "rgba(220, 38, 38, 0.15)"
                                : undefined,
                              borderColor: isDarkMode
                                ? "rgba(220, 38, 38, 0.25)"
                                : undefined,
                            },
                            title: {
                              color: isDarkMode ? "#F87171" : undefined,
                            },
                            message: {
                              color: isDarkMode ? "#F87171" : undefined,
                            },
                          }}
                        >
                          <Text size="sm">
                            Invalid variables detected:{" "}
                            <strong>
                              {templateValidation.invalidVariables.join(", ")}
                            </strong>
                          </Text>
                          <Text size="xs" mt="xs">
                            Please use only the available variables from the
                            sidebar or remove the invalid ones.
                          </Text>
                        </Alert>
                      )}

                      <Group justify="flex-end" align="center">
                        <Text
                          size="sm"
                          c={
                            isDarkMode
                              ? theme.colors.gray[5]
                              : theme.colors.gray[6]
                          }
                        >
                          {template.length} characters
                        </Text>
                      </Group>
                    </>
                  )}
                </Stack>
              </Paper>
            </Box>

            {/* Variables Sidebar */}
            <Box style={{ width: 350 }}>
              <Paper
                p="lg"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(30, 41, 59, 0.8)"
                    : "#f8f9fa",
                  borderColor: isDarkMode
                    ? "rgba(90, 50, 140, 0.3)"
                    : "#e9ecef",
                  border: isDarkMode
                    ? "1px solid rgba(90, 50, 140, 0.3)"
                    : "1px solid #e9ecef",
                  height: "fit-content",
                }}
              >
                <Stack gap="md">
                  <Title
                    order={4}
                    c={isDarkMode ? theme.colors.gray[2] : theme.colors.dark[7]}
                  >
                    Available Variables
                  </Title>

                  <Text
                    size="xs"
                    c={isDarkMode ? theme.colors.gray[5] : theme.colors.gray[6]}
                  >
                    These variables are provided by the backend and can be used
                    in both your system prompt and user prompt templates.
                  </Text>

                  <Divider
                    color={isDarkMode ? "rgba(90, 50, 140, 0.3)" : "#e0e0e0"}
                  />

                  <Stack gap="sm">
                    {promptConfig.variables.map(
                      (variable: any, index: number) => (
                        <Box
                          key={index}
                          p="sm"
                          style={{
                            backgroundColor: isDarkMode
                              ? "rgba(30, 30, 40, 0.5)"
                              : "white",
                            borderRadius: "6px",
                            border: isDarkMode
                              ? "1px solid rgba(90, 50, 140, 0.2)"
                              : "1px solid #e9ecef",
                            cursor: "pointer",
                          }}
                          onClick={() => insertVariable(variable.name)}
                        >
                          <Group justify="space-between" align="flex-start">
                            <Stack gap="xs" style={{ flex: 1 }}>
                              <Group gap="xs" align="center">
                                <Text
                                  size="sm"
                                  fw={500}
                                  c={
                                    isDarkMode
                                      ? theme.colors.gray[2]
                                      : theme.colors.dark[7]
                                  }
                                  style={{ fontFamily: "monospace" }}
                                >
                                  {"{" + "{" + variable.name + "}" + "}"}
                                </Text>
                                {variable.required && (
                                  <Badge size="xs" color="red" variant="light">
                                    Required
                                  </Badge>
                                )}
                              </Group>
                              <Text
                                size="xs"
                                c={
                                  isDarkMode
                                    ? theme.colors.gray[4]
                                    : theme.colors.gray[6]
                                }
                              >
                                {variable.description}
                              </Text>
                            </Stack>
                          </Group>
                        </Box>
                      )
                    )}
                  </Stack>

                  <Text
                    size="xs"
                    c={isDarkMode ? theme.colors.gray[5] : theme.colors.gray[6]}
                    ta="center"
                    mt="md"
                  >
                    Click on any variable to insert it into your prompt
                  </Text>
                </Stack>
              </Paper>
            </Box>
          </Group>
        </Stack>
      </Container>
    </DashboardLayout>
  );
}
