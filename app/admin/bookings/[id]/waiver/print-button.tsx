"use client";

import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PrintButton() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Button size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-1" />
        Print A4
      </Button>
    </div>
  );
}
