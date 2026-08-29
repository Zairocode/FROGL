"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AccountProvider } from "@/lib/account-context";
import { CameraProvider } from "@/lib/camera-context";
import { ChatProvider } from "@/lib/chat-context";
import { RoleProvider } from "@/lib/role-context";
import { SessionProvider } from "@/lib/session-context";
import { AppNav } from "./AppNav";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <SessionProvider>
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
      </SessionProvider>
    </ConvexProvider>
  );
}
