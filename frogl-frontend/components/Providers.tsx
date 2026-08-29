"use client";

import { ChatProvider } from "@/lib/chat-context";
import { RoleProvider } from "@/lib/role-context";
import { AppNav } from "./AppNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <ChatProvider>
        <AppNav />
        {children}
      </ChatProvider>
    </RoleProvider>
  );
}
