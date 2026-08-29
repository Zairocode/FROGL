"use client";

import { useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { StudioRoom } from "@/components/pitch/StudioRoom";

export function EstudioApp() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(
    () => (url ? new ConvexReactClient(url) : null),
    [url],
  );

  if (!client) {
    return <StudioRoom />;
  }

  return (
    <ConvexProvider client={client}>
      <StudioRoom />
    </ConvexProvider>
  );
}
