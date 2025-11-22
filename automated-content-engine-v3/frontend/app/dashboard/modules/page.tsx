"use client";

import { Container, Title, Grid, Card, Text, Badge, Group, Button } from "@mantine/core";
import { IconArrowRight, IconRobot } from "@tabler/icons-react";
import Link from "next/link";

const modules = [
  { key: 'topic-generator', name: 'Topic Generator', desc: 'Generate viral topics based on client niche.' },
  { key: 'targeted-research', name: 'Targeted Research', desc: 'Get fast facts from Perplexity.' },
  { key: 'deep-research', name: 'Deep Research', desc: 'Comprehensive analysis via Google + Grok.' },
  { key: 'thread-writer', name: 'Thread Writer', desc: 'Draft a full Twitter thread from notes.' },
  { key: 'hook-polisher', name: 'Hook Polisher', desc: 'Create 12 viral hook variations.' },
  { key: 'cta-generator', name: 'CTA Generator', desc: 'Craft the perfect Call to Action.' },
];

export default function ModuleLibrary() {
  return (
    <Container size="xl" py="xl">
        <Title order={2} mb="xl">AI Modules</Title>
        <Grid>
            {modules.map((mod) => (
                <Grid.Col key={mod.key} span={{ base: 12, md: 6, lg: 4 }}>
                    <Card withBorder shadow="sm" radius="md" padding="lg">
                        <Group justify="space-between" mb="xs">
                            <Group>
                                <IconRobot size={20} color="blue" />
                                <Text fw={600}>{mod.name}</Text>
                            </Group>
                            <Badge color="gray" variant="light">Tool</Badge>
                        </Group>
                        <Text size="sm" c="dimmed" mb="lg" mih={40}>
                            {mod.desc}
                        </Text>
                        <Button
                            component={Link}
                            href={`/dashboard/modules/${mod.key}`}
                            variant="light"
                            fullWidth
                            rightSection={<IconArrowRight size={16}/>}
                        >
                            Run Module
                        </Button>
                    </Card>
                </Grid.Col>
            ))}
        </Grid>
    </Container>
  );
}
