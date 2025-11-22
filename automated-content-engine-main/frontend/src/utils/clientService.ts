import { apiClient } from './apiClient';

/**
 * Interface representing a client
 */
export interface Client {
  id: string;
  _id?: string; // Add support for MongoDB-style _id
  name: string;
  industry?: string;
  logo?: string;
  // Additional fields for enhanced client display
  bio?: string;
  businessInfo?: string;
  goals?: string;
  voice?: string;
  voiceAnalysis?: string;
  feedback?: string;
  tags?: string[];
  nicheTags?: string[];
  website?: string;
  primaryColor?: string;
}

/**
 * Service for managing client data
 */
export class ClientService {
  /**
   * Fetches all available clients
   * @returns Promise<Client[]> A promise that resolves to an array of clients
   */
  static async getClients(): Promise<Client[]> {
    try {
      const clients = await apiClient<any[]>('/clients');
      // Map _id to id if needed
      return clients.map(client => ({
        ...client,
        id: client.id || client._id // Ensure id property exists
      }));
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      throw new Error('Failed to fetch clients');
    }
  }

  /**
   * Fetches a specific client by ID
   * @param id The client ID
   * @returns Promise<Client> A promise that resolves to a client
   */
  static async getClientById(id: string): Promise<Client | null> {
    try {
      const client = await apiClient<any>(`/clients/${id}`);
      // Map _id to id if needed
      return {
        ...client,
        id: client.id || client._id // Ensure id property exists
      };
    } catch (error) {
      console.error(`Failed to fetch client with ID ${id}:`, error);
      throw new Error(`Failed to fetch client with ID ${id}`);
    }
  }
} 