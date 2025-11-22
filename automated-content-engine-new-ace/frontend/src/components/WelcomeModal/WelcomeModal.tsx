"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedToolName: string;
  recommendedToolSlug: string;
}

const STORAGE_KEY = "welcome_modal_dismissed";

export function WelcomeModal({
  isOpen,
  onClose,
  recommendedToolName,
  recommendedToolSlug,
}: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <Card className="relative z-50 w-full max-w-md mx-4 bg-[rgba(255,255,255,0.06)] backdrop-blur-sm border-[rgba(0,255,136,0.25)] shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-white font-bold">
              Welcome!
            </CardTitle>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-white/90 text-base leading-relaxed">
            Welcome! Most users start with{" "}
            <Link
              href={`/modules/${recommendedToolSlug}`}
              className="text-[#00ff88] hover:text-[#00ff88]/80 font-semibold underline underline-offset-2 transition-colors"
              onClick={handleClose}
            >
              {recommendedToolName}
            </Link>{" "}
            to get started quickly. Or browse all tools below.
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dont-show-again"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-400 text-[#00ff88] focus:ring-[#00ff88] focus:ring-offset-0 cursor-pointer accent-[#00ff88]"
            />
            <Label
              htmlFor="dont-show-again"
              className="text-white/80 text-sm cursor-pointer select-none"
            >
              Don't show again
            </Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-gray-600 text-white hover:bg-white/10"
            >
              Browse Tools
            </Button>
            <Link href={`/modules/${recommendedToolSlug}`} onClick={handleClose}>
              <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90">
                Get Started
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function shouldShowWelcomeModal(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== "true";
}

