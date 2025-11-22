"use client";

import { Container, Title, Grid, Card, Text, Group, Button, Badge } from "@mantine/core";
import { IconPlus, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <Container size="xl">
        <Group justify="space-between" mb="xl">
            <Title order={2}>Dashboard</Title>
            <Button component={Link} href="/dashboard/workflow" leftSection={<IconPlus size={16}/>}>
                Start New Thread
            </Button>
        </Group>

        <Grid>
            <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="xs">
                        <Text fw={500}>Total Clients</Text>
                        <Badge color="blue">Active</Badge>
                    </Group>
                    <Text size="xl" fw={700}>12</Text>
                </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="xs">
                        <Text fw={500}>Threads Drafted</Text>
                    </Group>
                    <Text size="xl" fw={700}>45</Text>
                </Card>
            </Grid.Col>
        </Grid>
    </Container>
  );
}
