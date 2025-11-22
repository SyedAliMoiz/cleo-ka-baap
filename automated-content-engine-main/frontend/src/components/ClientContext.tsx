"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Client, ClientService } from "../utils/clientService";

// Define constants for localStorage keys to avoid typos
// const STORAGE_KEY_CLIENT_ID = "ace_selectedClientId";

interface ClientContextType {
  selectedClientId: string | null;
  selectedClient: Client | null;
  setSelectedClientId: (id: string | null) => void;
  setSelectedClient: (client: Client | null) => void;
}

const ClientContext = createContext<ClientContextType>({
  selectedClientId: null,
  selectedClient: null,
  setSelectedClientId: () => {},
  setSelectedClient: () => {},
});

export const useClient = () => useContext(ClientContext);

export function ClientProvider({ children }: { children: ReactNode }) {
  // Only read from localStorage on first mount
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("clientId");
      }
      return null;
    }
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Only update localStorage when the setter is called
  const setSelectedClientId = (id: string | null) => {
    setSelectedClientIdState(id);
    if (id) {
      localStorage.setItem("clientId", id);
    } else {
      localStorage.removeItem("clientId");
    }
  };

  // Fetch client details when selectedClientId changes
  useEffect(() => {
    if (!selectedClientId) {
      setSelectedClient(null);
      return;
    }
    const fetchClient = async () => {
      try {
        const client = await ClientService.getClientById(selectedClientId);
        setSelectedClient(client);
      } catch (err) {
        console.error("Error fetching client:", err);
        setSelectedClient(null);
      }
    };
    fetchClient();
  }, [selectedClientId]);

  return (
    <ClientContext.Provider
      value={{
        selectedClientId,
        selectedClient,
        setSelectedClientId,
        setSelectedClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}
