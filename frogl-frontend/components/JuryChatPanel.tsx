"use client";

import { useRef, useState, type FormEvent } from "react";
import { useAccount } from "@/lib/account-context";
import { useJuryChat } from "@/lib/chat-context";

export function JuryChatPanel() {
  const { account } = useAccount();
  const { messages, send } = useJuryChat();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(text);
    setText("");
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="label-caps">Chat del panel</p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-fg">
            Escribís con tu cuenta
          </h2>
        </div>
        {account ? (
          <p className="text-sm text-fg-muted">
            Como <span style={{ color: account.color }}>{account.name}</span>
          </p>
        ) : null}
      </div>

      <div
        ref={listRef}
        className="flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto pr-1"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-fg-muted">
            Todavía no hay reacciones. Escribí la primera.
          </p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="flex flex-col gap-1">
              <p className="label-caps" style={{ color: message.color }}>
                {message.author}
              </p>
              <p className="max-w-[36rem] text-[1.05rem] leading-relaxed text-fg">
                {message.text}
              </p>
            </article>
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="jury-chat">
          Mensaje al pitcher
        </label>
        <input
          id="jury-chat"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Tu reacción al expositor…"
          className="h-12 flex-1 rounded-full border border-border bg-bg-elevated px-5 text-fg outline-none placeholder:text-fg-muted focus:border-fg-muted"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="cta-primary disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
