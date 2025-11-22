"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ClientForm from "../../components/ClientForm";
import { DashboardLayout } from "../../../../src/components/DashboardLayout/DashboardLayout";
import { apiClient } from "../../../../src/utils/apiClient";

interface Client {
  _id: string;
  name: string;
  businessInfo: string;
  goals: string;
  voice: string;
  voiceAnalysis: string;
  feedback: string;
  nicheTags: string[];
  bio: string;
}

export default function EditClientPage() {
  const params = useParams();
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const clientData = await apiClient<Client>(`/clients/${params.id}`);
        setClient(clientData);
      } catch (err) {
        console.error("Failed to fetch client:", err);
        setError("Failed to load client information");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchClient();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">
            <div className="h-12 w-12 rounded-full bg-primary/30"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ClientForm client={client} isEditing={true} />
    </DashboardLayout>
  );
}
