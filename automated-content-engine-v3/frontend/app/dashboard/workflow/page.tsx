"use client";

import { Container, Stepper, Button, Group, Title, Paper, Text, Stack, Card, SimpleGrid, Badge, Textarea, LoadingOverlay } from "@mantine/core";
import { useState } from "react";
import { IconBulb, IconSearch, IconWriting, IconWand, IconCheck } from "@tabler/icons-react";

export default function WorkflowWizard() {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  // Workflow State
  const [selectedClient, setSelectedClient] = useState<string>("mock-client-id");
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [researchData, setResearchData] = useState<string>("");
  const [threadDraft, setThreadDraft] = useState<string>("");
  const [hookVariants, setHookVariants] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState<string>("");
  const [ctaOptions, setCtaOptions] = useState<string[]>([]);

  // Steps Handlers
  const handleGenerateTopics = async () => {
    setLoading(true);
    // Call API /modules/run with 'topic-generator'
    setTimeout(() => {
        setGeneratedTopics([
            "Why most SaaS founders fail at marketing (and how to fix it)",
            "The 5-step framework for scaling to $1M ARR",
            "Stop doing cold outreach. Do this instead.",
            "My controversial take on Product Led Growth"
        ]);
        setLoading(false);
        setActive(1); // Move to Topic Select
    }, 1500);
  };

  const handleResearch = async () => {
     if (!selectedTopic) return alert("Select a topic!");
     setLoading(true);
     // Call API /modules/run with 'targeted-research'
     setTimeout(() => {
        setResearchData("- 90% of SaaS fail in 5 years\n- CAC is rising by 20% YoY\n- Source: TechCrunch 2024 report...");
        setLoading(false);
        setActive(2);
     }, 1500);
  };

  const handleWriteThread = async () => {
      setLoading(true);
      // Call API /modules/run with 'thread-writer'
      setTimeout(() => {
          setThreadDraft("1/ Most SaaS founders fail because they build first and sell later.\n\nHere's why that's a death sentence 🧵\n\n2/ The market doesn't care about your code...\n\n3/ ...");
          setLoading(false);
          setActive(3);
      }, 2000);
  };

  const handlePolishHooks = async () => {
      setLoading(true);
      // Call API /modules/run with 'hook-polisher'
      setTimeout(() => {
          setHookVariants([
              "I built a $1M SaaS in 6 months. Here is the exact playbook 🧵",
              "If you are building a SaaS, stop. Read this first 🛑",
              "99% of developers build products nobody wants. Don't be one of them."
          ]);
          setLoading(false);
          setActive(4);
      }, 1500);
  };

  const handleGenerateCTA = async () => {
      setLoading(true);
      // Call API /modules/run with 'cta-generator'
      setTimeout(() => {
          setCtaOptions([
              "Follow me @user for more SaaS tips!",
              "Check out my course link in bio 👆",
              "DM me 'GROWTH' to work with us."
          ]);
          setLoading(false);
          setActive(5);
      }, 1000);
  };

  return (
    <Container size="xl" py="xl">
        <Title order={2} mb="xl" ta="center">New Thread Workflow</Title>

        <Stepper active={active} onStepClick={setActive} mb="xl">
            <Stepper.Step label="Topic" description="Generate & Select" icon={<IconBulb size={18} />} />
            <Stepper.Step label="Research" description="Gather Facts" icon={<IconSearch size={18} />} />
            <Stepper.Step label="Draft" description="Write Thread" icon={<IconWriting size={18} />} />
            <Stepper.Step label="Hooks" description="Polish & Pick" icon={<IconWand size={18} />} />
            <Stepper.Step label="CTA" description="Finalize" icon={<IconCheck size={18} />} />
        </Stepper>

        <Paper p="xl" withBorder pos="relative" mih={400}>
            <LoadingOverlay visible={loading} />

            {/* Step 0: Topic Generation */}
            {active === 0 && (
                <Stack>
                    <Text>Click to generate topics for <strong>My Tech Brand</strong> based on your Voice Guide.</Text>
                    <Button onClick={handleGenerateTopics}>Generate Topics</Button>
                </Stack>
            )}

            {/* Step 1: Select Topic */}
            {active === 1 && (
                <Stack>
                    <Title order={4}>Select a Topic</Title>
                    <SimpleGrid cols={2}>
                        {generatedTopics.map((topic) => (
                            <Card
                                key={topic}
                                withBorder
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                style={{ cursor: 'pointer', borderColor: selectedTopic === topic ? '#228be6' : undefined, borderWidth: selectedTopic === topic ? 2 : 1 }}
                                onClick={() => setSelectedTopic(topic)}
                            >
                                <Text fw={500}>{topic}</Text>
                            </Card>
                        ))}
                    </SimpleGrid>
                    <Group justify="flex-end">
                         <Button onClick={handleResearch} disabled={!selectedTopic}>Start Research</Button>
                    </Group>
                </Stack>
            )}

            {/* Step 2: Research */}
            {active === 2 && (
                <Stack>
                    <Title order={4}>Research Data</Title>
                    <Textarea
                        value={researchData}
                        onChange={(e) => setResearchData(e.target.value)}
                        minRows={10}
                        label="Review & Edit Facts"
                    />
                    <Group justify="flex-end">
                         <Button onClick={handleWriteThread}>Write Thread Draft</Button>
                    </Group>
                </Stack>
            )}

            {/* Step 3: Draft */}
            {active === 3 && (
                <Stack>
                    <Title order={4}>Thread Draft</Title>
                    <Textarea
                        value={threadDraft}
                        onChange={(e) => setThreadDraft(e.target.value)}
                        minRows={15}
                    />
                    <Group justify="flex-end">
                         <Button onClick={handlePolishHooks}>Polish Hooks</Button>
                    </Group>
                </Stack>
            )}

             {/* Step 4: Hooks */}
             {active === 4 && (
                <Stack>
                    <Title order={4}>Select Final Hook</Title>
                    <Stack>
                        {hookVariants.map((hook) => (
                             <Card
                             key={hook}
                             withBorder
                             padding="md"
                             style={{ cursor: 'pointer', backgroundColor: selectedHook === hook ? '#f0f9ff' : undefined }}
                             onClick={() => setSelectedHook(hook)}
                         >
                             <Text>{hook}</Text>
                         </Card>
                        ))}
                    </Stack>
                    <Group justify="flex-end">
                         <Button onClick={handleGenerateCTA} disabled={!selectedHook}>Generate CTA</Button>
                    </Group>
                </Stack>
            )}

             {/* Step 5: CTA */}
             {active === 5 && (
                <Stack>
                    <Title order={4}>Finalize Thread</Title>
                    <Text size="sm" c="dimmed">Complete Thread Preview</Text>
                    <Paper withBorder p="md" bg="gray.0">
                        <Text fw={700} mb="md">{selectedHook}</Text>
                        <Text style={{ whiteSpace: 'pre-line' }}>{threadDraft}</Text>
                        <Text mt="md" c="blue">{ctaOptions[0] || "CTA Placeholder"}</Text>
                    </Paper>
                    <Button color="green" fullWidth mt="xl" onClick={() => alert("Thread Published to Dashboard!")}>Save & Finish</Button>
                </Stack>
            )}

        </Paper>
    </Container>
  );
}
