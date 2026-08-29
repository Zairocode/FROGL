"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAccount } from "./account-context";
import { useCurrentSession } from "./frogl";
import type { ChatMessage, CueKind } from "./chat-store";

// El chat vive en Convex, no en localStorage. Antes BroadcastChannel solo
// cruzaba pestanias del MISMO navegador: dos jurados en dos laptops no se
// veian. La forma de ChatMessage queda igual, asi los componentes no cambian.

type ChatContextValue = {
  messages: ChatMessage[];
  send: (text: string, cue?: CueKind) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { account } = useAccount();
  const session = useCurrentSession();
  const sendMessage = useMutation(api.live.send);

  const rows = useQuery(
    api.live.messages,
    session ? { sessionId: session._id } : "skip",
  );

  const messages = useMemo<ChatMessage[]>(
    () =>
      (rows ?? []).map((r) => ({
        id: r._id,
        accountId: r.accountId,
        author: r.author,
        color: r.color,
        text: r.text,
        createdAt: r._creationTime,
        cue: r.cue as CueKind | undefined,
      })),
    [rows],
  );

  const send = useCallback(
    (text: string, cue?: CueKind) => {
      const trimmed = text.trim();
      if (!trimmed || !account || !session) return;
      void sendMessage({
        sessionId: session._id,
        accountId: account.id,
        author: account.name,
        color: account.color,
        text: trimmed,
        cue,
      });
    },
    [account, session, sendMessage],
  );

  const value = useMemo(() => ({ messages, send }), [messages, send]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useJuryChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useJuryChat must be used within ChatProvider");
  return ctx;
}
