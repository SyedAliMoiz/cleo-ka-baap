"use client";

import { Container, Title, Grid, Card, Text, Group, Button, Badge, ThemeIcon, RingProgress, Stack } from "@mantine/core";
import { IconPlus, IconArrowRight, IconUsers, IconFileText, IconRocket, IconTrendingUp } from "@tabler/icons-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <Container size="xl">
        <Group justify="space-between" mb={40}>
            <div>
                <Title order={2} fw={800} c="dark.8">Welcome back, Jason</Title>
                <Text c="dimmed">Ready to create some viral content?</Text>
            </div>
            <Button
                component={Link}
                href="/dashboard/workflow"
                size="md"
                radius="md"
                variant="gradient"
                gradient={{ from: 'indigo', to: 'cyan' }}
                leftSection={<IconPlus size={18}/>}
            >
                Start New Thread
            </Button>
        </Group>

        <Grid mb={40}>
            <Grid.Col span={{ base: 12, md: 4 }}>
                <Card padding="lg" radius="md" withBorder style={{ height: '100%' }}>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                            <IconUsers size={24} />
                        </ThemeIcon>
                        <Badge color="green" variant="light">+2 this week</Badge>
                    </Group>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase" mt="md">Total Clients</Text>
                    <Text size="3rem" fw={800} lh={1}>12</Text>
                </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
                <Card padding="lg" radius="md" withBorder style={{ height: '100%' }}>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size="xl" radius="md" variant="light" color="violet">
                            <IconFileText size={24} />
                        </ThemeIcon>
                        <Badge color="gray" variant="light">Drafts</Badge>
                    </Group>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase" mt="md">Threads Written</Text>
                    <Text size="3rem" fw={800} lh={1}>45</Text>
                </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
                <Card padding="lg" radius="md" withBorder style={{ height: '100%' }}>
                    <Group>
                        <RingProgress
                            size={80}
                            roundCaps
                            thickness={8}
                            sections={[{ value: 65, color: 'cyan' }]}
                            label={
                                <ThemeIcon color="cyan" variant="transparent" style={{ margin: '0 auto' }}>
                                    <IconRocket size={24} />
                                </ThemeIcon>
                            }
                        />
                        <div>
                            <Text fw={700} size="lg">Monthly Quota</Text>
                            <Text c="dimmed" size="sm">65% used (130/200)</Text>
                        </div>
                    </Group>
                </Card>
            </Grid.Col>
        </Grid>

        <Title order={3} mb="md">Recent Activity</Title>
        <Card radius="md" p={0} withBorder>
            <Stack gap={0}>
                {[1, 2, 3].map((i) => (
                    <Group key={i} p="md" justify="space-between" style={{ borderBottom: i < 3 ? '1px solid var(--mantine-color-gray-2)' : 'none' }}>
                        <Group>
                            <ThemeIcon radius="xl" color="gray" variant="light">
                                <IconTrendingUp size={16} />
                            </ThemeIcon>
                            <div>
                                <Text fw={500}>Generated 3 hooks for "SaaS Growth"</Text>
                                <Text size="xs" c="dimmed">2 hours ago • Client: Acme Corp</Text>
                            </div>
                        </Group>
                        <Button variant="subtle" size="xs" rightSection={<IconArrowRight size={14}/>}>View</Button>
                    </Group>
                ))}
            </Stack>
        </Card>
    </Container>
  );
}
