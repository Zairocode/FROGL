"use client";

import { useRef, useState, type FormEvent } from "react";
import { useJuryChat } from "@/lib/chat-context";
import { JURY, JURY_LIST, type JurySlug } from "@/lib/jury";

export function JuryChatPanel({ activeSeat }: { activeSeat: JurySlug }) {
  const { messages, send } = useJuryChat();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const seat = JURY[activeSeat];

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(activeSeat, seat.name, text);
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
            Solo el jurado escribe aquí
          </h2>
        </div>
        <p className="text-sm text-fg-muted">
          Como <span style={{ color: seat.color }}>{seat.name}</span>
        </p>
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
          messages.map((message) => {
            const who = JURY[message.seat];
            return (
              <article key={message.id} className="flex flex-col gap-1">
                <p className="label-caps" style={{ color: who.color }}>
                  {who.name}
                </p>
                <p className="max-w-[36rem] text-[1.05rem] leading-relaxed text-fg">
                  {message.text}
                </p>
              </article>
            );
          })
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
          placeholder={`Reaccioná como ${seat.name}…`}
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

      <p className="mt-3 text-xs text-fg-muted">
        El pitcher no entra a esta sala. Ve tus mensajes como globos sobre su
        pantalla. Asientos:{" "}
        {JURY_LIST.map((j) => j.name.split(" ")[0]).join(" · ")}.
      </p>
    </section>
  );
}
