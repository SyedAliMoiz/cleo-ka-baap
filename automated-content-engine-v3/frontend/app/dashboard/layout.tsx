"use client";

import { AppShell, Burger, Group, NavLink, Text, Button, Avatar, Box, ThemeIcon, Divider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLayoutDashboard, IconUsers, IconPencil, IconLogout, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={(theme) => ({
        main: {
          backgroundColor: 'var(--mantine-color-gray-0)',
        },
        header: {
            backgroundColor: 'white',
            borderBottom: `1px solid var(--mantine-color-gray-2)`,
        },
        navbar: {
            backgroundColor: '#0f172a', // Dark Sidebar
            color: 'white',
            borderRight: 'none',
        }
      })}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
                <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} radius="md">
                    <IconSparkles size={20} />
                </ThemeIcon>
                <Text fw={800} size="xl" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>ACE v3</Text>
            </Group>
          </Group>
          <Group>
             <Avatar radius="xl" color="indigo">JD</Avatar>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Box mb="xl" px="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">Main Menu</Text>
            <NavLink
            component={Link}
            href="/dashboard"
            label="Overview"
            leftSection={<IconLayoutDashboard size="1.2rem" />}
            active={pathname === "/dashboard"}
            styles={{
                root: { color: 'var(--mantine-color-gray-3)', borderRadius: '8px' },
                label: { fontWeight: 500 },
            }}
            variant="subtle"
            color="cyan"
            />
            <NavLink
            component={Link}
            href="/dashboard/clients"
            label="Clients"
            leftSection={<IconUsers size="1.2rem" />}
            active={pathname?.startsWith("/dashboard/clients")}
            styles={{
                root: { color: 'var(--mantine-color-gray-3)', borderRadius: '8px' },
                label: { fontWeight: 500 },
            }}
            variant="subtle"
            color="cyan"
            />
             <NavLink
            component={Link}
            href="/dashboard/modules"
            label="Module Library"
            leftSection={<IconSparkles size="1.2rem" />}
            active={pathname?.startsWith("/dashboard/modules")}
            styles={{
                root: { color: 'var(--mantine-color-gray-3)', borderRadius: '8px' },
                label: { fontWeight: 500 },
            }}
            variant="subtle"
            color="cyan"
            />
        </Box>

        <Box px="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">Create</Text>
            <NavLink
            component={Link}
            href="/dashboard/workflow"
            label="New Thread"
            leftSection={<IconPencil size="1.2rem" />}
            active={pathname?.startsWith("/dashboard/workflow")}
            styles={{
                root: {
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    color: '#22d3ee',
                    borderRadius: '8px',
                    border: '1px solid rgba(6, 182, 212, 0.2)'
                },
                label: { fontWeight: 600 },
            }}
            />
        </Box>

        <Box mt="auto" pt="md" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
             <Button
                variant="subtle"
                color="gray"
                fullWidth
                justify="flex-start"
                leftSection={<IconLogout size={18}/>}
                component={Link}
                href="/login"
             >
                Sign Out
             </Button>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
