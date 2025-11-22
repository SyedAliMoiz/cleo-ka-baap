"use client";

import { Container, Title, Grid, Card, Text, Badge, Group, Button, ThemeIcon } from "@mantine/core";
import { IconArrowRight, IconRobot, IconSearch, IconWriting, IconBulb, IconWand, IconMessageCircle } from "@tabler/icons-react";
import Link from "next/link";

const modules = [
  { key: 'topic-generator', name: 'Topic Generator', desc: 'Generate viral topics based on client niche.', icon: IconBulb, color: 'yellow' },
  { key: 'targeted-research', name: 'Targeted Research', desc: 'Get fast facts from Perplexity.', icon: IconSearch, color: 'blue' },
  { key: 'deep-research', name: 'Deep Research', desc: 'Comprehensive analysis via Google + Grok.', icon: IconSearch, color: 'violet' },
  { key: 'thread-writer', name: 'Thread Writer', desc: 'Draft a full Twitter thread from notes.', icon: IconWriting, color: 'cyan' },
  { key: 'hook-polisher', name: 'Hook Polisher', desc: 'Create 12 viral hook variations.', icon: IconWand, color: 'pink' },
  { key: 'cta-generator', name: 'CTA Generator', desc: 'Craft the perfect Call to Action.', icon: IconMessageCircle, color: 'green' },
];

export default function ModuleLibrary() {
  return (
    <Container size="xl" py="xl">
        <Title order={2} mb="xl" fw={800}>AI Module Library</Title>
        <Grid>
            {modules.map((mod) => (
                <Grid.Col key={mod.key} span={{ base: 12, md: 6, lg: 4 }}>
                    <Card withBorder shadow="sm" radius="md" padding="xl" style={{ height: '100%', transition: 'transform 0.2s' }}>
                        <Group justify="space-between" mb="md">
                            <ThemeIcon size={40} radius="md" variant="light" color={mod.color}>
                                <mod.icon size={22} />
                            </ThemeIcon>
                            <Badge color="gray" variant="light">Tool</Badge>
                        </Group>
                        <Text fw={700} size="lg" mb="xs">{mod.name}</Text>
                        <Text size="sm" c="dimmed" mb="xl" mih={40}>
                            {mod.desc}
                        </Text>
                        <Button
                            component={Link}
                            href={`/dashboard/modules/${mod.key}`}
                            variant="light"
                            color={mod.color}
                            fullWidth
                            rightSection={<IconArrowRight size={16}/>}
                            mt="auto"
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
