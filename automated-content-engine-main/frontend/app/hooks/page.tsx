"use client";

import React from "react";
import { DashboardLayout } from "../../src/components/DashboardLayout/DashboardLayout";
import { HookPolisher } from "../../src/components/HookPolisher";

export default function HooksPage() {
  return (
    <DashboardLayout>
      <HookPolisher />
    </DashboardLayout>
  );
}
