"use client";

import { Container, Stepper, Button, Group, Title, Paper, Text, Stack, Card, SimpleGrid, Badge, Textarea, LoadingOverlay, ThemeIcon, Box, Transition } from "@mantine/core";
import { useState } from "react";
import { IconBulb, IconSearch, IconWriting, IconWand, IconCheck, IconSparkles, IconArrowRight } from "@tabler/icons-react";

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

  // Handlers (Mock)
  const handleGenerateTopics = async () => {
    setLoading(true);
    setTimeout(() => {
        setGeneratedTopics([
            "Why most SaaS founders fail at marketing",
            "The 5-step framework for scaling to $1M ARR",
            "Stop doing cold outreach. Do this instead.",
            "My controversial take on Product Led Growth"
        ]);
        setLoading(false);
        setActive(1);
    }, 1200);
  };

  const handleResearch = async () => {
     if (!selectedTopic) return;
     setLoading(true);
     setTimeout(() => {
        setResearchData("- 90% of SaaS fail in 5 years\n- CAC is rising by 20% YoY\n- Source: TechCrunch 2024 report...");
        setLoading(false);
        setActive(2);
     }, 1200);
  };

  const handleWriteThread = async () => {
      setLoading(true);
      setTimeout(() => {
          setThreadDraft("1/ Most SaaS founders fail because they build first and sell later.\n\nHere's why that's a death sentence 🧵\n\n2/ The market doesn't care about your code...\n\n3/ ...");
          setLoading(false);
          setActive(3);
      }, 1500);
  };

  const handlePolishHooks = async () => {
      setLoading(true);
      setTimeout(() => {
          setHookVariants([
              "I built a $1M SaaS in 6 months. Here is the exact playbook 🧵",
              "If you are building a SaaS, stop. Read this first 🛑",
              "99% of developers build products nobody wants. Don't be one of them."
          ]);
          setLoading(false);
          setActive(4);
      }, 1200);
  };

  const handleGenerateCTA = async () => {
      setLoading(true);
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
        <Box mb={40} style={{ textAlign: 'center' }}>
            <Badge variant="dot" color="cyan" size="lg" mb="xs">AI Content Workflow</Badge>
            <Title order={1}>New Thread Generator</Title>
            <Text c="dimmed" mt="sm">From idea to viral thread in 5 steps.</Text>
        </Box>

        <Stepper active={active} onStepClick={setActive} mb={50} color="cyan" radius="md">
            <Stepper.Step label="Topic" description="Ideation" icon={<IconBulb size={18} />} />
            <Stepper.Step label="Research" description="Facts" icon={<IconSearch size={18} />} />
            <Stepper.Step label="Draft" description="Writing" icon={<IconWriting size={18} />} />
            <Stepper.Step label="Hooks" description="Viralize" icon={<IconWand size={18} />} />
            <Stepper.Step label="CTA" description="Finish" icon={<IconCheck size={18} />} />
        </Stepper>

        <Paper p={40} withBorder shadow="md" radius="lg" pos="relative" mih={400}>
            <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'cyan', type: 'bars' }} />

            {/* Step 0: Topic Generation */}
            {active === 0 && (
                <Stack align="center" justify="center" mih={300}>
                    <ThemeIcon size={80} radius="100%" variant="light" color="indigo" mb="md">
                        <IconSparkles size={40} />
                    </ThemeIcon>
                    <Title order={3}>Ready to brainstorm?</Title>
                    <Text c="dimmed" ta="center" maw={500} mb="xl">
                        We will analyze your client's Voice Guide and Niche to generate high-performance topic ideas.
                    </Text>
                    <Button size="lg" onClick={handleGenerateTopics} rightSection={<IconArrowRight size={18} />}>
                        Generate Topics
                    </Button>
                </Stack>
            )}

            {/* Step 1: Select Topic */}
            {active === 1 && (
                <Stack>
                    <Group justify="space-between">
                        <Title order={3}>Select a Topic</Title>
                        <Badge color="indigo">{generatedTopics.length} Ideas Generated</Badge>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                        {generatedTopics.map((topic) => (
                            <Card
                                key={topic}
                                withBorder
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                onClick={() => setSelectedTopic(topic)}
                                style={{
                                    cursor: 'pointer',
                                    borderColor: selectedTopic === topic ? 'var(--mantine-color-cyan-6)' : undefined,
                                    borderWidth: selectedTopic === topic ? 2 : 1,
                                    backgroundColor: selectedTopic === topic ? 'var(--mantine-color-cyan-0)' : undefined,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Text fw={600} size="lg" lh={1.4}>{topic}</Text>
                            </Card>
                        ))}
                    </SimpleGrid>
                    <Group justify="flex-end" mt="xl">
                         <Button size="md" onClick={handleResearch} disabled={!selectedTopic}>Start Research</Button>
                    </Group>
                </Stack>
            )}

            {/* Step 2: Research */}
            {active === 2 && (
                <Stack>
                    <Title order={3}>Research Data</Title>
                    <Textarea
                        value={researchData}
                        onChange={(e) => setResearchData(e.target.value)}
                        minRows={12}
                        radius="md"
                        label="Review & Edit Facts"
                        styles={{ input: { fontFamily: 'monospace', fontSize: '14px' } }}
                    />
                    <Group justify="flex-end" mt="md">
                         <Button size="md" onClick={handleWriteThread}>Write Thread Draft</Button>
                    </Group>
                </Stack>
            )}

            {/* Step 3: Draft */}
            {active === 3 && (
                <Stack>
                    <Title order={3}>Thread Draft</Title>
                    <Textarea
                        value={threadDraft}
                        onChange={(e) => setThreadDraft(e.target.value)}
                        minRows={15}
                        radius="md"
                    />
                    <Group justify="flex-end" mt="md">
                         <Button size="md" onClick={handlePolishHooks}>Polish Hooks</Button>
                    </Group>
                </Stack>
            )}

             {/* Step 4: Hooks */}
             {active === 4 && (
                <Stack>
                    <Title order={3}>Choose the Best Hook</Title>
                    <Text c="dimmed" mb="md">Select the most attention-grabbing opener.</Text>
                    <Stack gap="md">
                        {hookVariants.map((hook) => (
                             <Card
                             key={hook}
                             withBorder
                             padding="lg"
                             radius="md"
                             onClick={() => setSelectedHook(hook)}
                             style={{
                                 cursor: 'pointer',
                                 borderColor: selectedHook === hook ? 'var(--mantine-color-cyan-6)' : undefined,
                                 borderWidth: selectedHook === hook ? 2 : 1,
                                 backgroundColor: selectedHook === hook ? 'var(--mantine-color-cyan-0)' : undefined
                             }}
                         >
                             <Text size="lg">{hook}</Text>
                         </Card>
                        ))}
                    </Stack>
                    <Group justify="flex-end" mt="xl">
                         <Button size="md" onClick={handleGenerateCTA} disabled={!selectedHook}>Generate CTA</Button>
                    </Group>
                </Stack>
            )}

             {/* Step 5: CTA */}
             {active === 5 && (
                <Stack align="center">
                    <ThemeIcon size={60} radius="100%" color="green" variant="light" mb="md">
                        <IconCheck size={32} />
                    </ThemeIcon>
                    <Title order={2}>Thread Ready!</Title>
                    <Text c="dimmed" mb="xl">Your content is ready to be published.</Text>

                    <Paper withBorder p="xl" bg="gray.0" w="100%" maw={600} radius="md">
                        <Text fw={700} mb="md" size="lg">{selectedHook}</Text>
                        <Text style={{ whiteSpace: 'pre-line' }} mb="md">{threadDraft}</Text>
                        <Text c="blue" fw={500}>{ctaOptions[0] || "CTA Placeholder"}</Text>
                    </Paper>

                    <Group mt="xl">
                        <Button variant="default" onClick={() => setActive(0)}>Start Over</Button>
                        <Button color="green" size="md" onClick={() => alert("Saved to Library!")}>Save to Library</Button>
                    </Group>
                </Stack>
            )}

        </Paper>
    </Container>
  );
}
