'use client';

import React, { useState, useEffect } from 'react';
import { Text, Loader, Alert, TextInput, Box, Title, Button, Flex, Notification, useMantineTheme, SimpleGrid, Group } from '@mantine/core';
import { Client, ClientService } from '../../utils/clientService';
import { IconAlertCircle, IconSearch, IconArrowRight, IconInfoCircle, IconArrowLeft } from '@tabler/icons-react';
import { ClientCard } from './ClientCard';
import { useDarkMode } from '../DarkModeProvider';
import { useClient } from '../ClientContext';

interface ClientSelectionStepProps {
  onClientSelect: (clientId: string) => void;
  selectedClientId?: string | null;
  onContinue?: () => void;
  onBack?: () => void;
}

/**
 * Component for selecting a client with search functionality and client card display
 */
export function ClientSelectionStep({ onClientSelect, selectedClientId: propSelectedClientId, onContinue, onBack }: ClientSelectionStepProps) {
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();
  const { selectedClientId: contextClientId } = useClient();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(propSelectedClientId || null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [validationMsg, setValidationMsg] = useState<{message: string, type: 'error' | 'info' | 'success'} | null>(null);

  // Fetch clients when component mounts
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await ClientService.getClients();
        setClients(data);
        setFilteredClients(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError('Failed to load clients. Please try again later.');
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filter clients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        client => 
          client.name.toLowerCase().includes(query) || 
          (client.industry && client.industry.toLowerCase().includes(query)) ||
          (client.tags && client.tags.some(tag => tag.toLowerCase().includes(query)))
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  // Fetch detailed client information
  const fetchClientDetails = async (clientId: string) => {
    setIsLoadingDetails(true);
    try {
      const clientDetails = await ClientService.getClientById(clientId);
      setSelectedClientDetails(clientDetails);
      // Show success message when client details are loaded
      setValidationMsg({
        message: `Selected ${clientDetails.name}. Ready to continue.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error fetching client details:', error);
      setValidationMsg({
        message: 'Error loading client details. Please try selecting again.',
        type: 'error'
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <Box style={{ textAlign: 'center', padding: '2rem' }}>
        <Loader color={isDarkMode ? 'grape.4' : 'indigo'} />
        <Text mt="md" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>Loading clients...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        icon={<IconAlertCircle size={16} />} 
        title="Error" 
        color="red"
        styles={{
          root: {
            backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : undefined,
            color: isDarkMode ? '#FCA5A5' : undefined,
            borderColor: isDarkMode ? 'rgba(220, 38, 38, 0.25)' : undefined,
          },
          title: {
            color: isDarkMode ? '#FCA5A5' : undefined,
          },
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Title order={3} mb="md" style={{ color: isDarkMode ? theme.colors.gray[2] : undefined }}>Select a Client</Title>
      <Text mb="md" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>Choose the client you're creating content for.</Text>
      
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, color: isDarkMode ? theme.colors.gray[5] : undefined }}>
          <IconSearch size={16} />
        </div>
        <TextInput
          placeholder="Filter by name, industry, etc..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          mb="lg"
          styles={{
            input: {
              backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.5)' : undefined,
              color: isDarkMode ? theme.colors.gray[2] : undefined,
              borderColor: isDarkMode ? 'rgba(90, 50, 140, 0.3)' : undefined,
              paddingLeft: 36,
            },
            section: {
              color: isDarkMode ? theme.colors.gray[5] : undefined,
            },
          }}
        />
      </div>

      {validationMsg && (
        <Notification 
          color={validationMsg.type === 'error' ? 'red' : validationMsg.type === 'success' ? 'green' : 'blue'} 
          withCloseButton
          onClose={() => setValidationMsg(null)}
          mb="md"
          icon={validationMsg.type === 'error' ? <IconAlertCircle size={18} /> : <IconInfoCircle size={18} />}
          styles={{
            root: {
              backgroundColor: isDarkMode 
                ? validationMsg.type === 'error' 
                  ? 'rgba(220, 38, 38, 0.15)' 
                  : validationMsg.type === 'success' 
                    ? 'rgba(34, 197, 94, 0.15)' 
                    : 'rgba(59, 130, 246, 0.15)'
                : undefined,
              color: isDarkMode 
                ? validationMsg.type === 'error' 
                  ? '#FCA5A5'
                  : validationMsg.type === 'success'
                    ? '#86EFAC' 
                    : '#93C5FD'
                : undefined,
              borderColor: isDarkMode 
                ? validationMsg.type === 'error' 
                  ? 'rgba(220, 38, 38, 0.25)'
                  : validationMsg.type === 'success'
                    ? 'rgba(34, 197, 94, 0.25)'
                    : 'rgba(59, 130, 246, 0.25)'
                : undefined,
            },
            title: {
              color: isDarkMode 
                ? validationMsg.type === 'error' 
                  ? '#FCA5A5'
                  : validationMsg.type === 'success'
                    ? '#86EFAC' 
                    : '#93C5FD'
                : undefined,
            },
            description: {
              color: isDarkMode 
                ? validationMsg.type === 'error' 
                  ? '#FCA5A5'
                  : validationMsg.type === 'success'
                    ? '#86EFAC' 
                    : '#93C5FD'
                : undefined,
            },
          }}
        >
          {validationMsg.message}
        </Notification>
      )}

      {isLoadingDetails && (
        <Box style={{ textAlign: 'center', padding: '1rem' }}>
          <Loader size="sm" color={isDarkMode ? 'grape.4' : 'indigo'} />
          <Text size="sm" mt="xs" style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }}>Loading client details...</Text>
        </Box>
      )}

      {filteredClients.length === 0 ? (
        <Text style={{ color: isDarkMode ? theme.colors.gray[4] : undefined }} ta="center" py="xl">No clients found matching your search criteria.</Text>
      ) : (
        <Box mb="lg">
          {filteredClients.map(client => (
            <ClientCard
              key={client.id}
              client={selectedClientDetails && client.id === selectedClient ? selectedClientDetails : client}
              isSelected={selectedClient === client.id}
              onClick={() => {
                // Set client selection
                setSelectedClient(client.id);
                onClientSelect(client.id);
                
                // Don't wait for validation, just continue immediately
                if (onContinue) onContinue();
              }}
            />
          ))}
        </Box>
      )}
      
      {onBack && (
        <Group justify="flex-start" mt="xl">
          <Button 
            variant="outline" 
            onClick={onBack} 
            leftSection={<IconArrowLeft size={16} />}
            color={isDarkMode ? 'grape.4' : 'indigo'}
            styles={{
              root: {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : undefined,
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(90, 50, 140, 0.15)' : undefined,
                },
              },
            }}
          >
            Back
          </Button>
        </Group>
      )}
    </Box>
  );
} 