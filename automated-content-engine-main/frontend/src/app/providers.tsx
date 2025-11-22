"use client";

import React from "react";
import { DarkModeProvider } from "../components/DarkModeProvider";
import { AuthProvider } from "../components/AuthProvider";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

// Create a theme with brand colors
const theme = createTheme({
  // Define your theme here if needed
  primaryColor: "indigo",
  colors: {
    // Add any custom colors here
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MantineProvider theme={theme}>
        <DarkModeProvider>
          <Notifications position="top-right" zIndex={1000} />
          {children}
        </DarkModeProvider>
      </MantineProvider>
    </AuthProvider>
  );
}
