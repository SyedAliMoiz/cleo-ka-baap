"use client";

import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Box,
  ThemeIcon,
} from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
      // Mock login
      router.push('/dashboard');
  };

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, var(--mantine-color-indigo-0) 0%, transparent 100%)' }}>
        <Container size={420} my={40}>
        <Group justify="center" gap="xs" mb="xl">
             <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                <IconSparkles size={24} />
             </ThemeIcon>
             <Text fw={900} size="xl" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>ACE v3</Text>
        </Group>

        <Title ta="center" order={2}>
            Welcome back!
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
            Do not have an account yet?{' '}
            <Anchor size="sm" component="button">
            Create account
            </Anchor>
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <TextInput label="Email" placeholder="you@mantine.dev" required />
            <PasswordInput label="Password" placeholder="Your password" required mt="md" />
            <Group justify="space-between" mt="lg">
            <Checkbox label="Remember me" />
            <Anchor component="button" size="sm">
                Forgot password?
            </Anchor>
            </Group>
            <Button fullWidth mt="xl" onClick={handleLogin} variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
            Sign in
            </Button>
        </Paper>
        </Container>
    </Box>
  );
}
