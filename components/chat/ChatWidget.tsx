"use client";

import * as React from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { faqCategories, WHATSAPP_NUMBER, type FaqQuestion } from "./faqConfig";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
};

function formatWhatsAppUrl(currentUrl: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  const text = `Bonjour Lucas, je viens de tester ma démo Orylis et j’aimerais en discuter pour mon site.\n\nVoici la page où je suis : ${currentUrl}`;
  const encoded = encodeURIComponent(text);
  return `${base}?text=${encoded}`;
}

export function ChatWidget(): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "bot",
      text:
        "Bonjour 👋 Je peux vous aider concernant la démo, les prix, les délais et le fonctionnement. Choisissez une question ci-dessous."
    }
  ]);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const [faqCollapsed, setFaqCollapsed] = React.useState(false);

  const scrollToBottom = React.useCallback(() => {
    // Smoothly scroll to the last message
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  const pushUserAndBot = React.useCallback((question: FaqQuestion) => {
    setMessages((prev) => [
      ...prev,
      { id: `q-${question.id}`, role: "user", text: question.question },
      { id: `a-${question.id}`, role: "bot", text: question.answer }
    ]);
    // Collapse FAQ after the first interaction to keep the focus on the conversation
    setFaqCollapsed(true);
  }, []);

  const onSend = React.useCallback(() => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: input.trim() },
      {
        id: `bot-${Date.now()}`,
        role: "bot",
        text:
          "Merci pour votre message. Pour une réponse précise, vous pouvez cliquer sur une question ci‑dessous ou nous écrire sur WhatsApp."
      }
    ]);
    setInput("");
  }, [input]);

  const openWhatsApp = React.useCallback(() => {
    const href = typeof window !== "undefined" ? window.location.href : "";
    const url = formatWhatsAppUrl(href);
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <>
      {/* Floating bubble */}
      <button
        type="button"
        aria-label="Ouvrir le chat"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 inline-flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#0D69FF] text-white shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[90vw] max-w-sm h-[60vh] sm:h-[70vh] bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col">
          {/* Header */}
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Orylis – Aide & questions</div>
                <div className="text-xs text-slate-500">Réponses rapides · Pas d’IA · WhatsApp possible</div>
              </div>
              <button
                type="button"
                aria-label="Fermer le chat"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body: messages only (scrollable) */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl bg-[#0D69FF] px-3 py-2 text-sm text-white"
                    : "mr-auto max-w-[85%] rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-800"
                }
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* FAQ section: outside scroll area */}
          <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4">
            {faqCollapsed ? (
              <button
                type="button"
                onClick={() => setFaqCollapsed(false)}
                className="text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
              >
                Voir les questions fréquentes
              </button>
            ) : (
              <div className="space-y-2">
                {faqCategories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
                      {cat.label}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cat.questions.map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => pushUserAndBot(q)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          {q.question}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-3 sm:p-4 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSend();
                }}
                placeholder="Votre question (optionnel)"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0D69FF]/40"
              />
              <button
                type="button"
                onClick={onSend}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                <Send className="h-4 w-4" />
                Envoyer
              </button>
            </div>
            <button
              type="button"
              onClick={openWhatsApp}
              className="w-full rounded-xl bg-[#0D69FF] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0b5ee6]"
            >
              Parler avec Lucas sur WhatsApp
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;


