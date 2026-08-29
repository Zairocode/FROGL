"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccount } from "./account-context";
import {
  CHAT_CHANNEL,
  CHAT_STORAGE_KEY,
  createMessage,
  readChat,
  writeChat,
  type ChatMessage,
  type CueKind,
} from "./chat-store";

type ChatContextValue = {
  messages: ChatMessage[];
  send: (text: string, cue?: CueKind) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

/** Front-only: chat en localStorage + BroadcastChannel (sin Convex). */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { account } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setMessages(readChat());
    const onStorage = (event: StorageEvent) => {
      if (event.key === CHAT_STORAGE_KEY) setMessages(readChat());
    };
    window.addEventListener("storage", onStorage);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHAT_CHANNEL);
      channel.onmessage = () => setMessages(readChat());
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  const send = useCallback(
    (text: string, cue?: CueKind) => {
      const trimmed = text.trim();
      if (!trimmed || !account) return;
      const next = [...readChat(), createMessage(account, trimmed, cue)];
      writeChat(next);
      setMessages(next);
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel(CHAT_CHANNEL);
        channel.postMessage("update");
        channel.close();
      }
    },
    [account],
  );

  const value = useMemo(() => ({ messages, send }), [messages, send]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useJuryChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useJuryChat must be used within ChatProvider");
  return ctx;
}
