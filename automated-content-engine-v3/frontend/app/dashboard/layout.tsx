"use client";

import { AppShell, Burger, Group, NavLink, Text, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLayoutDashboard, IconUsers, IconPencil, IconLogout } from "@tabler/icons-react";
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
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">ACE v3</Text>
          </Group>
          <Button variant="subtle" color="red" leftSection={<IconLogout size={16}/>}>Logout</Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          href="/dashboard"
          label="Dashboard"
          leftSection={<IconLayoutDashboard size="1rem" stroke={1.5} />}
          active={pathname === "/dashboard"}
        />
        <NavLink
          component={Link}
          href="/dashboard/clients"
          label="Clients"
          leftSection={<IconUsers size="1rem" stroke={1.5} />}
          active={pathname?.startsWith("/dashboard/clients")}
        />
        <NavLink
          component={Link}
          href="/dashboard/workflow"
          label="New Thread Workflow"
          leftSection={<IconPencil size="1rem" stroke={1.5} />}
          active={pathname?.startsWith("/dashboard/workflow")}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
