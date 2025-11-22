'use client';

import React from 'react';
import { Box, Text, Loader, Alert, useMantineTheme } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useDarkMode } from '../DarkModeProvider';

interface LoadingErrorStateProps {
  loading: boolean;
  error: string | null;
  loadingMessage?: string;
  fullHeight?: boolean;
}

/**
 * Helper function to convert hex to rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  // If hex is already in rgb/rgba format, return it
  if (hex.startsWith('rgb')) {
    return hex;
  }
  
  // Remove # from start if present
  const cleanHex = hex.charAt(0) === '#' ? hex.substring(1) : hex;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Reusable component for displaying loading and error states in thread-writer components
 */
export function LoadingErrorState({ 
  loading, 
  error, 
  loadingMessage = 'Loading...', 
  fullHeight = false 
}: LoadingErrorStateProps) {
  const theme = useMantineTheme();
  const { isDarkMode } = useDarkMode();
  
  const textColor = isDarkMode
    ? theme.colors.gray[4]
    : theme.colors.gray[7];

  if (loading) {
    return (
      <Box 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem',
          height: fullHeight ? '400px' : 'auto',
          minHeight: fullHeight ? '400px' : 'auto'
        }}
      >
        <Loader size="lg" />
        <Text mt="md" style={{ color: textColor }}>{loadingMessage}</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        icon={<IconAlertCircle size={18} />}
        title="Error"
        color="red"
        variant={isDarkMode ? 'filled' : 'light'}
        styles={{
          root: {
            backgroundColor: isDarkMode ? hexToRgba(theme.colors.red[9], 0.65) : undefined,
          },
          title: {
            color: isDarkMode ? theme.white : undefined,
          },
          message: {
            color: isDarkMode ? theme.colors.gray[3] : undefined,
          }
        }}
      >
        {error}
      </Alert>
    );
  }

  // Return null if not loading and no error
  return null;
} 