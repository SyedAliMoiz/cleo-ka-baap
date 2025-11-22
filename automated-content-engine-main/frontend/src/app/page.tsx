'use client';

import { Card, Text, Container, Title, createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: [
      '#00C6FF', '#00C6FF', '#00C6FF', '#00C6FF', '#00C6FF',
      '#00C6FF', '#00C6FF', '#00C6FF', '#00C6FF', '#00C6FF'
    ],
    purple: [
      '#D946EF', '#D946EF', '#D946EF', '#D946EF', '#D946EF',
      '#D946EF', '#D946EF', '#D946EF', '#D946EF', '#D946EF'
    ],
  },
});

export default function Home() {
  return (
    <MantineProvider theme={theme}>
      <main className="min-h-screen bg-ace-black flex items-center justify-center">
        <Container size="sm">
          <Card 
            className="bg-gradient-to-r from-neon-blue to-electric-purple p-8 rounded-xl shadow-xl"
            radius="md"
          >
            <Title 
              order={1} 
              className="text-ace-white text-center mb-4 font-sans"
            >
              Welcome Ali and Kyle 👋
            </Title>
            <Text 
              className="text-ace-white text-center text-lg"
            >
              Your web app is building... Stay tuned.
            </Text>
          </Card>
        </Container>
      </main>
    </MantineProvider>
  );
} 