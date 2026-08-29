"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { JurySlug } from "./jury";
import {
  CHAT_CHANNEL,
  createMessage,
  readChat,
  writeChat,
  type ChatMessage,
} from "./chat-store";

type ChatContextValue = {
  messages: ChatMessage[];
  send: (seat: JurySlug, author: string, text: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setMessages(readChat());

    const onStorage = (event: StorageEvent) => {
      if (event.key === "frogl:jury-chat:v1") setMessages(readChat());
    };
    window.addEventListener("storage", onStorage);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHAT_CHANNEL);
      channel.onmessage = (event: MessageEvent<ChatMessage[]>) => {
        if (Array.isArray(event.data)) setMessages(event.data);
      };
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  const send = useCallback((seat: JurySlug, author: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => {
      const next = [...prev, createMessage(seat, author, trimmed)];
      writeChat(next);
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel(CHAT_CHANNEL);
        channel.postMessage(next);
        channel.close();
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ messages, send }), [messages, send]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useJuryChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useJuryChat must be used within ChatProvider");
  return ctx;
}
