import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import React from "react";

interface NotificationOptions {
  title: string;
  message: string;
  autoClose?: number;
  id?: string;
}

export const showSuccessNotification = (options: NotificationOptions) => {
  notifications.show({
    id: options.id,
    title: options.title,
    message: options.message,
    color: "green",
    icon: React.createElement(IconCheck, { size: 18 }),
    autoClose: options.autoClose || 4000,
    styles: {
      root: {
        backgroundColor: "var(--mantine-color-dark-6)",
        borderLeft: "4px solid var(--mantine-color-green-6)",
        border: "1px solid var(--mantine-color-dark-4)",
      },
      title: {
        color: "var(--mantine-color-gray-0)",
        fontWeight: 600,
      },
      description: {
        color: "var(--mantine-color-gray-2)",
      },
      closeButton: {
        color: "var(--mantine-color-gray-4)",
        "&:hover": {
          backgroundColor: "var(--mantine-color-dark-5)",
        },
      },
    },
  });
};

export const showErrorNotification = (options: NotificationOptions) => {
  notifications.show({
    id: options.id,
    title: options.title,
    message: options.message,
    color: "red",
    icon: React.createElement(IconX, { size: 18 }),
    autoClose: options.autoClose || 4000,
    styles: {
      root: {
        backgroundColor: "var(--mantine-color-dark-6)",
        borderLeft: "4px solid var(--mantine-color-red-6)",
        border: "1px solid var(--mantine-color-dark-4)",
      },
      title: {
        color: "var(--mantine-color-gray-0)",
        fontWeight: 600,
      },
      description: {
        color: "var(--mantine-color-gray-2)",
      },
      closeButton: {
        color: "var(--mantine-color-gray-4)",
        "&:hover": {
          backgroundColor: "var(--mantine-color-dark-5)",
        },
      },
    },
  });
};
