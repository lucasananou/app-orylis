"use client";

import dynamic from "next/dynamic";

// Lazy load ChatWidget côté client uniquement
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget").then(mod => ({ default: mod.default })), {
  ssr: false // Chat widget n'a pas besoin de SSR
});

export function ChatWidgetClient() {
  return <ChatWidget />;
}

