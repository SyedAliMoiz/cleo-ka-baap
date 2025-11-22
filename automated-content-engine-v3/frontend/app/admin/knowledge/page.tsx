"use client";

import { Container, Title, FileInput, Button, Paper, Group, Stack, Text } from "@mantine/core";
import { useState } from "react";

export default function KnowledgePage() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    console.log("Uploading file", file.name);
    // const formData = new FormData();
    // formData.append('file', file);
    // await axios.post('/api/knowledge/upload', formData);
    alert("File Uploaded (Mock)");
    setFile(null);
  };

  return (
    <Container size="sm">
      <Title order={2} mb="xl">Knowledge Base</Title>

      <Paper p="md" withBorder>
        <Stack>
            <FileInput
              label="Upload Document"
              description="PDF, TXT, MD supported"
              placeholder="Select file"
              value={file}
              onChange={setFile}
            />

            <Group justify="flex-end">
              <Button onClick={handleUpload} disabled={!file}>Upload File</Button>
            </Group>
        </Stack>
      </Paper>

      <Title order={4} mt="xl" mb="md">Existing Files</Title>
      <Paper p="md" withBorder>
        <Text c="dimmed" ta="center">No files uploaded yet.</Text>
      </Paper>
    </Container>
  );
}
