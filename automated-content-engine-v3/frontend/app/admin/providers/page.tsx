"use client";

import { useState } from "react";
import { Container, Title, TextInput, Button, Paper, Group, Stack, Select } from "@mantine/core";
import { useForm } from "@mantine/form";

export default function ProvidersPage() {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      type: '',
      apiKey: '',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Mock API call
      console.log("Saving provider", values);
      // await axios.post('/api/providers', values);
      alert("Provider Saved (Mock)");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm">
      <Title order={2} mb="xl">Provider Configuration</Title>

      <Paper p="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Provider Type"
              placeholder="Select provider"
              data={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'anthropic', label: 'Anthropic' },
                { value: 'perplexity', label: 'Perplexity' },
                { value: 'google', label: 'Google' },
                { value: 'grok', label: 'Grok' },
              ]}
              {...form.getInputProps('type')}
            />

            <TextInput
              label="API Key"
              placeholder="sk-..."
              type="password"
              {...form.getInputProps('apiKey')}
            />

            <Group justify="flex-end">
              <Button type="submit" loading={loading}>Save Configuration</Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
