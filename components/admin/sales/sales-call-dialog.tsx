"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveSalesCall } from "@/app/actions/sales";
import { StepOpening, StepDiscovery, StepSolution, StepPrice, StepObjections, StepClosing } from "./sales-script-steps";

interface SalesCallDialogProps {
    prospectId: string;
    initialData?: any;
}

export function SalesCallDialog({ prospectId, initialData }: SalesCallDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Phone className="mr-2 h-4 w-4" />
                    Lancer l'appel
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="mb-2 shrink-0">
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
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2">
                    <Tabs defaultValue="opening" className="w-full">
                        <TabsList className="grid w-full grid-cols-6 mb-8 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <TabsTrigger value="opening">1. Intro</TabsTrigger>
                            <TabsTrigger value="discovery">2. Découverte</TabsTrigger>
                            <TabsTrigger value="solution">3. Solution</TabsTrigger>
                            <TabsTrigger value="price">4. Prix</TabsTrigger>
                            <TabsTrigger value="objections">5. Objections</TabsTrigger>
                            <TabsTrigger value="closing">6. Closing</TabsTrigger>
                        </TabsList>

                        <div className="pb-8">
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
            </DialogContent>
        </Dialog>
    );
}
