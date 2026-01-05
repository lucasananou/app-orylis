"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuotePreviewLiteProps {
    data: {
        fullName: string;
        email: string;
        company?: string;
        projectName: string;
        amount?: string;
        services: string;
        delay: string;
    };
}

export function QuotePreviewLite({ data }: QuotePreviewLiteProps) {
    const servicesList = data.services.split("\n").filter(s => s.trim() !== "");
    const today = new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    const amountHT = data.amount ? parseFloat(data.amount) : 1490;
    const formattedAmount = amountHT.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";

    return (
        <div className="w-full h-full min-h-[800px] bg-slate-100 p-4 md:p-8 overflow-y-auto custom-scrollbar rounded-xl border-dashed border-2 border-slate-300">
            <Card className="max-w-[800px] mx-auto bg-white shadow-2xl p-[50px] min-h-[1000px] flex flex-col font-sans text-slate-900 border-none rounded-none aspect-[1/1.414]">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <div className="mb-6">
                            <img
                                src="/logo-orylis.png"
                                alt="Orylis"
                                className="h-8 w-auto object-contain"
                            />
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                            <p className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-2">Client :</p>
                            <p>Nom : {data.fullName || "---"}</p>
                            <p>Email : {data.email || "---"}</p>
                            {data.company && <p>Société : {data.company}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Devis</div>
                        <div className="text-lg font-mono font-bold">#2026-XXXXXX</div>
                        <div className="text-sm text-slate-500 mt-2">Date : {today}</div>

                        <div className="mt-8 space-y-1 text-sm text-slate-600">
                            <p className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-2">Prestataire :</p>
                            <p>Orylis France</p>
                            <p>orylisfrance@gmail.com</p>
                            <p>Toulouse, France</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 mb-8">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                            <div className="font-bold text-lg">{servicesList[0] || "Prestation de service"}</div>
                            <div className="font-bold text-lg text-[#005eff]">{formattedAmount}</div>
                        </div>

                        <ul className="space-y-3">
                            {servicesList.length > 1 ? (
                                servicesList.slice(1).map((service, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#005eff] mt-1.5 shrink-0" />
                                        <span>{service}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-slate-400 italic">Aucun détail de service fourni</li>
                            )}
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold uppercase text-[10px] tracking-widest text-slate-400 mb-2">Moyen de paiement</h4>
                                <p className="text-slate-600">Lien de paiement sécurisé (CB / Virement)</p>
                            </div>
                            <div>
                                <h4 className="font-bold uppercase text-[10px] tracking-widest text-slate-400 mb-2">Délai estimé</h4>
                                <p className="text-slate-600">{data.delay || "À définir"}</p>
                            </div>
                        </div>
                        <div className="bg-slate-900 text-white p-6 rounded-lg self-start">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">TOTAL HT</span>
                                <span className="text-xl font-bold">{formattedAmount}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-right italic">TVA non applicable, art. 293 B du CGI</p>
                        </div>
                    </div>
                </div>

                {/* Footer / Signature Area */}
                <div className="mt-auto pt-12 border-t border-slate-100 flex justify-between items-end">
                    <div className="text-[10px] text-slate-400 max-w-[300px]">
                        Ce devis est valable 30 jours. La validation du devis par signature électronique entraîne l&apos;acceptation des CGV.
                    </div>
                    <div className="w-[220px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">Signature du client</p>
                        <div className="h-[100px] border border-slate-200 rounded bg-slate-50/50 flex items-center justify-center text-slate-300 text-xs italic">
                            Zone de signature
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
