"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "./session-context";
import { useAccount } from "./account-context";
import { buildActivity, type ChatMessage } from "./chat-store";

// ============================================================
//  CHAT DEL PANEL (Convex)
//  Lee el stream completo del jurado (reactions + questions + messages)
//  y manda los mensajes humanos por api.live.send. Sin localStorage,
//  sin BroadcastChannel: todo vive en el backend y se actualiza solo.
// ============================================================

type ChatContextValue = {
  messages: ChatMessage[];
  send: (text: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { session, sessionId } = useSession();
  const { account } = useAccount();
  const sendMessage = useMutation(api.live.send);

  const reactions = useQuery(
    api.live.reactions,
    sessionId ? { sessionId } : "skip",
  );
  const questions = useQuery(
    api.live.questions,
    sessionId ? { sessionId } : "skip",
  );
  const messagesQuery = useQuery(
    api.live.messages,
    sessionId ? { sessionId } : "skip",
  );
  const seats = useQuery(api.seats.list, sessionId ? { sessionId } : "skip");
  const profiles = useQuery(api.profiles.list, sessionId ? {} : "skip");

  const messages = useMemo(() => {
    if (!session || !reactions || !questions || !messagesQuery || !seats || !profiles) {
      return [] as ChatMessage[];
    }
    return buildActivity({
      session,
      reactions,
      questions,
      messages: messagesQuery,
      seats,
      profiles,
    });
  }, [session, reactions, questions, messagesQuery, seats, profiles]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !account || !sessionId) return;
      void sendMessage({ sessionId, author: account.name, text: trimmed });
    },
    [account, sessionId, sendMessage],
  );

  const value = useMemo(() => ({ messages, send }), [messages, send]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useJuryChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useJuryChat must be used within ChatProvider");
  return ctx;
}
