"use client";

import ClientForm from "../components/ClientForm";
import { DashboardLayout } from "../../../src/components/DashboardLayout/DashboardLayout";

export default function NewClientPage() {
  return (
    <DashboardLayout>
      <ClientForm />
    </DashboardLayout>
  );
}
