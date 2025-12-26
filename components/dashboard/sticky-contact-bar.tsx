"use client";

import { Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StickyContactBar() {
    return (
        <div className="fixed bottom-0 left-0 w-full z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 pb-safe-offset-4 shadow-lg animate-in slide-in-from-bottom duration-500">
            <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900">
                        Une question urgente ?
                    </p>
                    <p className="text-xs text-slate-500">
                        Notre équipe est disponible pour vous répondre.
                    </p>
                </div>

                <div className="flex w-full sm:w-auto gap-3">
                    <Button
                        asChild
                        className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#1DA851] text-white border-none shadow-sm rounded-xl h-12"
                    >
                        <a
                            href="https://wa.me/33613554022?text=Bonjour%20Lucas%2C%20j%27attends%20ma%20d%C3%A9mo%20Orylis%20et%20j%27aimerais%20%C3%A0%20propos%20de%20mon%20site."
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <MessageCircle className="mr-2 h-5 w-5" />
                            WhatsApp
                        </a>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        className="flex-1 sm:flex-none border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-12"
                    >
                        <a href="https://calendly.com/lucas-orylis/30min" target="_blank" rel="noopener noreferrer">
                            <Calendar className="mr-2 h-5 w-5" />
                            Rendez-vous
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
