"use client";

import { AccountProvider } from "@/lib/account-context";
import { CameraProvider } from "@/lib/camera-context";
import { ChatProvider } from "@/lib/chat-context";
import { RoleProvider } from "@/lib/role-context";
import { AppNav } from "./AppNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <AccountProvider>
        <CameraProvider>
          <ChatProvider>
            <AppNav />
            {children}
          </ChatProvider>
        </CameraProvider>
      </AccountProvider>
    </RoleProvider>
  );
}
