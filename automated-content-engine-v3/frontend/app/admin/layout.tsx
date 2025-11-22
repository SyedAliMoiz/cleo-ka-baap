"use client";

import { AppShell, Burger, Group, NavLink, Text, ThemeIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSettings, IconDatabase, IconRobot, IconKey, IconShieldLock } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
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
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <ThemeIcon color="red" variant="light">
            <IconShieldLock size={20} />
          </ThemeIcon>
          <Text fw={700} size="lg" c="red.8">ACE Admin Panel</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          href="/admin/providers"
          label="API Providers"
          leftSection={<IconKey size="1rem" stroke={1.5} />}
          active={pathname === "/admin/providers"}
          color="red"
          variant="filled"
        />
        <NavLink
          component={Link}
          href="/admin/modules"
          label="Modules"
          leftSection={<IconRobot size="1rem" stroke={1.5} />}
          active={pathname === "/admin/modules"}
          color="red"
          variant="filled"
        />
        <NavLink
          component={Link}
          href="/admin/knowledge"
          label="Knowledge Base"
          leftSection={<IconDatabase size="1rem" stroke={1.5} />}
          active={pathname === "/admin/knowledge"}
          color="red"
          variant="filled"
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
