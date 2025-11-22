"use client";

import { Container, Title, TextInput, Button, Paper, Group, Stack, Select, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";

export default function ModulesPage() {
  const form = useForm({
    initialValues: {
      key: '',
      name: '',
      provider: '',
      model: '',
      systemPrompt: '',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    console.log("Saving module", values);
    alert("Module Saved (Mock)");
  };

  return (
    <Container size="md">
      <Title order={2} mb="xl">Module Manager</Title>

      <Paper p="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Group grow>
                <TextInput
                label="Module Key"
                placeholder="e.g., topic-generator"
                {...form.getInputProps('key')}
                />
                <TextInput
                label="Module Name"
                placeholder="e.g., Topic Generator"
                {...form.getInputProps('name')}
                />
            </Group>

            <Group grow>
                <Select
                label="Provider"
                data={['openai', 'anthropic', 'perplexity']}
                {...form.getInputProps('provider')}
                />
                <TextInput
                label="Model ID"
                placeholder="e.g., gpt-4o"
                {...form.getInputProps('model')}
                />
            </Group>

            <Textarea
              label="System Instructions"
              placeholder="You are an expert ghostwriter..."
              minRows={6}
              {...form.getInputProps('systemPrompt')}
            />

            <Group justify="flex-end">
              <Button type="submit">Create / Update Module</Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
