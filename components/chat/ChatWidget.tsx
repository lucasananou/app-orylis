"use client";

import * as React from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { faqCategories, WHATSAPP_NUMBER, type FaqQuestion } from "./faqConfig";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
};

function findQuestionById(id: string): FaqQuestion | null {
  for (const category of faqCategories) {
    const q = category.questions.find((qq) => qq.id === id);
    if (q) return q;
  }
  return null;
}

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
  const [showHint, setShowHint] = React.useState(false);
  const hintMessages = React.useMemo(
    () => [
      "Une question ? Je suis dispo 👋",
      "Besoin d’aide pour votre démo ?",
      "Je peux vous aider en 10 secondes 😊",
      "Vous hésitez ? Posez-moi une question."
    ],
    []
  );
  const [hintText] = React.useState(
    () => hintMessages[Math.floor(Math.random() * hintMessages.length)]
  );
  // Courtes suggestions mises en avant (ordre optimisé)
  const suggestionIds = React.useMemo(
    () => ["pricing_after_demo", "final_timing", "can_edit_demo", "ecommerce", "installments"],
    []
  );
  const suggestionQuestions = React.useMemo(
    () => suggestionIds.map((id) => findQuestionById(id)).filter(Boolean) as FaqQuestion[],
    [suggestionIds]
  );
  const [openCategoryId, setOpenCategoryId] = React.useState<string | null>(null);

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

  // Very subtle one-shot "pop" using Web Audio, guarded by sessionStorage
  const playPop = React.useCallback(() => {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880; // high, short
      g.gain.value = 0.0008; // very low volume
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 90); // ~90ms tap
    } catch {
      // ignore audio errors
    }
  }, []);

  // Delayed, one-time per session hint (4–6s), never re-shown
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isOpen) return; // don't show if already open
    const already = sessionStorage.getItem("chatBubbleHintShown") === "1";
    if (already) return;

    const delay = 4000 + Math.floor(Math.random() * 2000); // 4–6s
    const t = setTimeout(() => {
      setShowHint(true);
      sessionStorage.setItem("chatBubbleHintShown", "1");
      playPop();
    }, delay);
    return () => clearTimeout(t);
  }, [isOpen, playPop]);

  // Hide hint after user interacts or after 7s visible
  React.useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), 7000);
    return () => clearTimeout(t);
  }, [showHint]);

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
        onClick={() => {
          setIsOpen((v) => !v);
          // Any interaction suppresses hint for the rest of the session
          if (typeof window !== "undefined") {
            sessionStorage.setItem("chatBubbleHintShown", "1");
          }
          setShowHint(false);
        }}
        className="fixed bottom-24 right-4 z-50 inline-flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#0D69FF] text-white shadow-lg transition-transform hover:scale-105 sm:bottom-28 sm:right-6"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Bubble hint (one-shot, subtle) */}
      {showHint && !isOpen && (
        <div
          className="fixed bottom-[88px] right-4 z-50 max-w-[70vw] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-lg sm:bottom-[96px]"
          role="status"
          aria-live="polite"
        >
          {hintText}
        </div>
      )}

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
                {/* Suggestions rapides */}
                {suggestionQuestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
                      Suggestions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestionQuestions.map((q) => (
                        <button
                          key={`s-${q.id}`}
                          type="button"
                          onClick={() => pushUserAndBot(q)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          {q.question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catégories (pills) + contenu déroulant */}
                <div className="space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
                    Parcourir par catégorie
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {faqCategories.map((cat) => {
                      const isOpen = openCategoryId === cat.id;
                      return (
                        <button
                          key={`cat-pill-${cat.id}`}
                          type="button"
                          onClick={() => setOpenCategoryId(isOpen ? null : cat.id)}
                          className={
                            isOpen
                              ? "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm"
                              : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                          }
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {openCategoryId && (
                    <div className="rounded-xl border border-slate-200 bg-white p-2 sm:p-3">
                      {faqCategories
                        .find((c) => c.id === openCategoryId)
                        ?.questions.map((q) => (
                          <button
                            key={`q-${q.id}`}
                            type="button"
                            onClick={() => pushUserAndBot(q)}
                            className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 last:mb-0"
                          >
                            {q.question}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
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
              className="w-full rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1DA851]"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M20.52 3.48A11.87 11.87 0 0 0 12.06 0C5.47 0 .11 5.36.11 11.95a11.86 11.86 0 0 0 1.67 6.07L0 24l6.11-1.76a11.9 11.9 0 0 0 5.94 1.6h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.2-3.49-8.41ZM12.06 21.34h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.63 1.05 1.04-3.54-.22-.36a9.43 9.43 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.43-9.43 2.52 0 4.88.98 6.66 2.76a9.38 9.38 0 0 1 2.77 6.66c0 5.2-4.23 9.43-9.46 9.43Zm5.19-7.05c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.65.14-.19.28-.74.91-.91 1.1-.17.19-.34.21-.62.07-.28-.14-1.17-.43-2.22-1.38-.82-.73-1.38-1.63-1.54-1.9-.16-.28-.02-.43.12-.57.12-.12.28-.31.43-.48.14-.17.19-.28.28-.48.09-.19.05-.36-.02-.5-.07-.14-.65-1.56-.88-2.13-.23-.55-.47-.47-.65-.48h-.55c-.19 0-.5.07-.76.36-.26.28-1 1-1 2.43 0 1.43 1.03 2.82 1.17 3.02.14.19 2.02 3.08 4.89 4.32.68.29 1.21.46 1.62.59.68.22 1.3.19 1.8.12.55-.08 1.66-.68 1.9-1.33.24-.64.24-1.19.17-1.33-.07-.14-.26-.21-.54-.36Z" />
                </svg>
                Parler avec Lucas sur WhatsApp
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;


