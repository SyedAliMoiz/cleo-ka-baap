"use client";

import { Container, Title, Textarea, Button, Paper, Group, Text, Select, LoadingOverlay } from "@mantine/core";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ModuleRunner() {
  const params = useParams();
  const moduleKey = params.key;

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    // Mock API call to /llm/run
    setTimeout(() => {
        setOutput(`[AI Output for ${moduleKey}]\n\nHere is the result based on your input:\n\n"${input}"\n\n- Insight 1\n- Insight 2\n- Insight 3`);
        setLoading(false);
    }, 2000);
  };

  return (
    <Container size="md" py="xl">
      <Group mb="xl">
          <Title order={2}>Run Module: {moduleKey}</Title>
      </Group>

      <Paper p="md" withBorder mb="xl">
        <Select label="Select Client Context (Optional)" placeholder="Pick a client..." data={['My Tech Brand', 'Personal Brand']} mb="md" />

        <Textarea
            label="Input Context"
            description="Paste your notes, topic, or draft here."
            placeholder="Enter text..."
            minRows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
        />

        <Group justify="flex-end" mt="md">
            <Button onClick={handleRun} loading={loading}>Run AI</Button>
        </Group>
      </Paper>

      {output && (
          <Paper p="md" withBorder bg="gray.0" pos="relative">
              <Title order={5} mb="sm">Result</Title>
              <Text style={{ whiteSpace: 'pre-line' }}>{output}</Text>
          </Paper>
      )}
    </Container>
  );
}
