"use client";

import { useChat } from "@ai-sdk/react";
import {
  Bot,
  CalendarClock,
  Code2,
  Loader2,
  Mic2,
  Send,
  ShieldCheck
} from "lucide-react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useMemo, useState } from "react";
import { ChatMessage } from "@/components/chat-message";

const prompts = [
  "Why is Sankalp a strong fit for the AI Engineer Intern role?",
  "What projects has Sankalp built with AI agents or automation?",
  "What public GitHub repositories should I look at?",
  "Can you help schedule a 30 minute interview this week?"
];

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat"
    })
  });

  const isBusy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  const helper = useMemo(() => {
    if (error) return "The backend returned an error. Check env vars and server logs.";
    if (isBusy) return "Reading grounded sources and tools...";
    return "Ask about Sankalp's work, GitHub projects, fit, or interview availability.";
  }, [error, isBusy]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setInput("");
  }

  function handlePrompt(prompt: string) {
    if (isBusy) return;
    sendMessage({ text: prompt });
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Scaler screening persona
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
              Sankalp Shukla AI Representative
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              A concise chat and voice backend for recruiters to review Sankalp&apos;s
              work, projects, technical fit, and real interview availability.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm md:w-[360px]">
            <StatusBadge icon={<ShieldCheck size={16} />} label="RAG grounded" />
            <StatusBadge icon={<CalendarClock size={16} />} label="Calendar tools" />
            <StatusBadge icon={<Code2 size={16} />} label="GitHub ingest" />
            <StatusBadge icon={<Mic2 size={16} />} label="Voice ready" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-5 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="border border-[var(--line)] bg-[var(--panel)] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Try asking
            </h2>
            <div className="mt-3 space-y-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePrompt(prompt)}
                  className="w-full border border-[var(--line)] bg-white px-3 py-2 text-left text-sm leading-5 transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] disabled:opacity-60"
                  disabled={isBusy}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-h-[640px] flex-col border border-[var(--line)] bg-[var(--panel)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-[var(--accent)]" />
              <span className="font-semibold">Grounded chat</span>
            </div>
            <span className="text-sm text-[var(--muted)]">{helper}</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {!hasMessages ? (
              <div className="mx-auto flex h-full max-w-xl flex-col justify-center text-center">
                <Bot className="mx-auto mb-4 text-[var(--accent)]" size={42} />
                <h2 className="text-2xl font-semibold">Ask like a hiring panel.</h2>
                <p className="mt-3 leading-7 text-[var(--muted)]">
                  The assistant gives short, recruiter-ready answers and uses
                  calendar tools when interview scheduling is requested.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
          </div>

          <form onSubmit={submit} className="border-t border-[var(--line)] p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about fit, repos, projects, or availability..."
                rows={2}
                className="min-h-[52px] flex-1 resize-none border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={isBusy || !input.trim()}
                className="flex h-[52px] w-[52px] items-center justify-center bg-[var(--accent)] text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                title="Send message"
              >
                {isBusy ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function StatusBadge({
  icon,
  label
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 border border-[var(--line)] bg-[#f8fbf9] px-3 py-2">
      <span className="text-[var(--accent)]">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
