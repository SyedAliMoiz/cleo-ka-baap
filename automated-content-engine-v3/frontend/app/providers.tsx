"use client";

import { createTheme, MantineProvider, rem } from '@mantine/core';
import '@mantine/core/styles.css';

const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: 'Inter, system-ui, sans-serif',
  defaultRadius: 'md',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    sizes: {
      h1: { fontSize: rem(32), fontWeight: '700' },
      h2: { fontSize: rem(24), fontWeight: '600' },
    },
  },
  components: {
    Button: {
      defaultProps: {
        fw: 500,
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
        shadow: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        variant: 'filled',
      },
    },
    Select: {
      defaultProps: {
        variant: 'filled',
      },
    },
    Textarea: {
      defaultProps: {
        variant: 'filled',
      },
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
