"use client";

import { RealtimeCursors } from "@/components/realtime-cursors";

export default function CafePage() {
  return (
    <div className="w-full min-h-screen">
      <RealtimeCursors
        roomName="macrodata_refinement_office"
        username="Mark Scout"
      />
    </div>
  );
}
