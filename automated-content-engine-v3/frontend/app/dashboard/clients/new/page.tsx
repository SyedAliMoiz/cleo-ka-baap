"use client";

import { Container, Title, TextInput, Button, Paper, Group, Stack, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";

export default function CreateClientPage() {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      website: '',
      industry: '',
      rawNotes: '', // The "Intake" part
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
        // Mock Step 1: Client Intake
        console.log("Processing Client Intake", values);
        // await axios.post('/api/clients', ...);
        // Trigger AI analysis here to generate reports
        setTimeout(() => {
            alert("Client Created & Reports Generated!");
            setLoading(false);
        }, 1500);
    } catch (e) {
        setLoading(false);
    }
  };

  return (
    <Container size="md">
      <Title order={2} mb="xl">New Client Intake</Title>

      <Paper p="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Client Name"
              required
              placeholder="Brand Name"
              {...form.getInputProps('name')}
            />

            <Group grow>
                <TextInput
                label="Website"
                placeholder="https://..."
                {...form.getInputProps('website')}
                />
                <TextInput
                label="Industry"
                placeholder="SaaS, Health, etc."
                {...form.getInputProps('industry')}
                />
            </Group>

            <Textarea
              label="Intake Notes (Raw)"
              description="Paste raw notes about voice, tone, goals, and products. AI will structure this."
              minRows={8}
              required
              placeholder="Client wants a witty tone, focuses on B2B marketing..."
              {...form.getInputProps('rawNotes')}
            />

            <Group justify="flex-end">
              <Button type="submit" loading={loading}>
                Generate Client Profile
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
