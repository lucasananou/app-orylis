"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Phone, Save, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { saveSalesCall } from "@/app/actions/sales";
import { StepOpening, StepDiscovery, StepSolution, StepPrice, StepObjections, StepClosing } from "./sales-script-steps";

interface SalesCallDialogProps {
    prospectId: string;
    initialData?: any;
}

export function SalesCallDialog({ prospectId, initialData }: SalesCallDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentTab, setCurrentTab] = useState("opening");
    const [hasCopied, setHasCopied] = useState(false);
    const [data, setData] = useState<any>({
        stepOpening: {},
        stepDiscovery: {},
        stepSolution: {},
        stepPrice: { proposed_price: 990 },
        stepObjections: {},
        stepClosing: {},
        ...initialData
    });

    // Autosave effect (debounce 2s)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) {
                handleSave(true);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [data, isOpen]);

    // Confetti effect on closing
    useEffect(() => {
        if (data.stepClosing?.closing_status === "paiement_immediat") {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [data.stepClosing?.closing_status]);

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        const res = await saveSalesCall(prospectId, {
            stepOpening: data.stepOpening,
            stepDiscovery: data.stepDiscovery,
            stepSolution: data.stepSolution,
            stepPrice: data.stepPrice,
            stepObjections: data.stepObjections,
            stepClosing: data.stepClosing
        });
        setIsSaving(false);

        if (!silent) {
            if (res.success) {
                toast.success("Sauvegardé !");
            } else {
                toast.error("Erreur de sauvegarde");
            }
        }
    };

    const updateStep = (step: string, stepData: any) => {
        setData((prev: any) => ({
            ...prev,
            [step]: stepData
        }));
    };

    const tabs = ["opening", "discovery", "solution", "price", "objections", "closing"];
    const progress = ((tabs.indexOf(currentTab) + 1) / tabs.length) * 100;

    const handleNext = () => {
        const currentIndex = tabs.indexOf(currentTab);
        if (currentIndex < tabs.length - 1) {
            setCurrentTab(tabs[currentIndex + 1]);
        } else {
            // Last step: save and close
            handleSave(false);
            setIsOpen(false);
        }
    };

    const handlePrev = () => {
        const currentIndex = tabs.indexOf(currentTab);
        if (currentIndex > 0) {
            setCurrentTab(tabs[currentIndex - 1]);
        }
    };

    const handleCopyRecap = () => {
        const recap = `
📋 *RÉCAP APPEL DE VENTE*

🎯 *Objectif / Gap :*
${data.stepDiscovery?.main_goal || "-"}
${data.stepDiscovery?.gap_consequence ? `👉 Gap : ${data.stepDiscovery.gap_consequence}` : ""}

💡 *Offre & Angle :*
Angle : ${data.stepSolution?.sales_angle || "-"}
Prix : ${data.stepPrice?.proposed_price || 990}€
Acompte : ${data.stepPrice?.deposit_amount || "-"}€

🚧 *Objections :*
Principale : ${data.stepObjections?.main_objection || "-"}
${data.stepObjections?.secondary_objection ? `Secondaire : ${data.stepObjections.secondary_objection}` : ""}

📅 *Prochaine étape :*
${data.stepClosing?.closing_status || "En cours"}
${data.stepClosing?.follow_up_date ? `Relance le : ${new Date(data.stepClosing.follow_up_date).toLocaleString()}` : ""}
        `.trim();

        navigator.clipboard.writeText(recap);
        setHasCopied(true);
        toast.success("Récap copié !");
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Phone className="mr-2 h-4 w-4" />
                    Lancer l'appel
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="mb-2 shrink-0 space-y-4">
                    <div className="flex items-center justify-between mr-8">
                        <div>
                            <DialogTitle>Script d'Appel de Vente</DialogTitle>
                            <DialogDescription>Suis le script étape par étape pour closer.</DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSaving && <span className="text-xs text-slate-500 flex items-center"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Sauvegarde...</span>}
                            <Button size="sm" variant="outline" onClick={() => handleSave(false)}>
                                <Save className="h-4 w-4 mr-2" />
                                Sauvegarder
                            </Button>
                        </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 flex flex-col">
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-6 mb-8 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
                            <TabsTrigger value="opening">1. Intro</TabsTrigger>
                            <TabsTrigger value="discovery">2. Découverte</TabsTrigger>
                            <TabsTrigger value="solution">3. Solution</TabsTrigger>
                            <TabsTrigger value="price">4. Prix</TabsTrigger>
                            <TabsTrigger value="objections">5. Objections</TabsTrigger>
                            <TabsTrigger value="closing">6. Closing</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 pb-20">
                            <TabsContent value="opening" className="mt-0">
                                <StepOpening data={data.stepOpening} onChange={(d) => updateStep("stepOpening", d)} />
                            </TabsContent>
                            <TabsContent value="discovery" className="mt-0">
                                <StepDiscovery data={data.stepDiscovery} onChange={(d) => updateStep("stepDiscovery", d)} />
                            </TabsContent>
                            <TabsContent value="solution" className="mt-0">
                                <StepSolution data={data.stepSolution} onChange={(d) => updateStep("stepSolution", d)} />
                            </TabsContent>
                            <TabsContent value="price" className="mt-0">
                                <StepPrice data={data.stepPrice} onChange={(d) => updateStep("stepPrice", d)} />
                            </TabsContent>
                            <TabsContent value="objections" className="mt-0">
                                <StepObjections data={data.stepObjections} onChange={(d) => updateStep("stepObjections", d)} />
                            </TabsContent>
                            <TabsContent value="closing" className="mt-0">
                                <StepClosing data={data.stepClosing} onChange={(d) => updateStep("stepClosing", d)} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <div className="shrink-0 border-t pt-4 mt-auto flex justify-between bg-background items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500"
                        onClick={handleCopyRecap}
                    >
                        {hasCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {hasCopied ? "Copié !" : "Copier le récap"}
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handlePrev}
                            disabled={currentTab === "opening"}
                        >
                            Précédent
                        </Button>
                        <Button onClick={handleNext}>
                            {currentTab === "closing" ? "Terminer l'appel" : "Suivant"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
