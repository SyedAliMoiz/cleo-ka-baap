"use client";

import {
  Badge,
  Card,
  Group,
  Image,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useDarkMode } from "./DarkModeProvider";

interface ModuleCardProps {
  name: string;
  tier: string;
  coverImage: string;
  isSelected?: boolean;
  onClick: () => void;
}

export function ModuleCard({
  name,
  tier,
  coverImage,
  isSelected,
  onClick,
}: ModuleCardProps) {
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "MVP":
        return theme.colors.green[6];
      case "Pro+":
        return theme.colors.blue[6];
      default:
        return theme.colors.gray[6];
    }
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        cursor: "pointer",
        backgroundColor: isDarkMode
          ? theme.colors.dark[7]
          : theme.colors.gray[0],
        border: isSelected
          ? `2px solid ${theme.colors.green[6]}`
          : `1px solid ${
              isDarkMode ? theme.colors.dark[4] : theme.colors.gray[3]
            }`,
        transition: "all 0.2s ease",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
        boxShadow: isSelected
          ? `0 0 20px ${theme.colors.green[6]}40`
          : "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
      onClick={onClick}
    >
      <Card.Section>
        <Image
          src={coverImage}
          height={200}
          alt={name}
          style={{
            objectFit: "cover",
            filter: isDarkMode ? "brightness(0.8)" : "brightness(1)",
          }}
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text
          fw={600}
          size="lg"
          style={{
            color: isDarkMode ? "#ffffff" : "#1a1a1a",
            textAlign: "center",
            width: "100%",
          }}
        >
          {name}
        </Text>
      </Group>

      <Badge
        color={getTierColor(tier)}
        variant="light"
        size="sm"
        style={{
          backgroundColor: `${getTierColor(tier)}20`,
          color: getTierColor(tier),
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {tier}
      </Badge>
    </Card>
  );
}
