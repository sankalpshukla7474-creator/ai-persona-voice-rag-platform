import type { UIMessage } from "ai";
import { Bot, User } from "lucide-react";

export function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((part) => {
      if (part.type === "text") return part.text;
      if (part.type.startsWith("tool-")) return "";
      return "";
    })
    .join("")
    .trim();

  const visibleText = isUser ? text : stripSourceLabels(text);

  if (!visibleText) return null;

  return (
    <article className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--line)] bg-[#eef8f6] text-[var(--accent)]">
          <Bot size={17} />
        </div>
      )}
      <div
        className={`max-w-[760px] whitespace-pre-wrap border px-4 py-3 text-sm leading-6 ${
          isUser
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--line)] bg-white text-[var(--foreground)]"
        }`}
      >
        {visibleText}
      </div>
      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--accent)] bg-[var(--accent)] text-white">
          <User size={17} />
        </div>
      )}
    </article>
  );
}

function stripSourceLabels(text: string) {
  return text
    .replace(/\s*\[(?:Resume|Portfolio|GitHub[^\]]*)\]/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
