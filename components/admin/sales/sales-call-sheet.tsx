"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveSalesCall } from "@/app/actions/sales";
import { StepOpening, StepDiscovery, StepSolution, StepPrice, StepObjections, StepClosing } from "./sales-script-steps";

interface SalesCallSheetProps {
    prospectId: string;
    initialData?: any;
}

export function SalesCallSheet({ prospectId, initialData }: SalesCallSheetProps) {
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
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Phone className="mr-2 h-4 w-4" />
                    Lancer l'appel
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <SheetTitle>Script d'Appel de Vente</SheetTitle>
                            <SheetDescription>Suis le script étape par étape pour closer.</SheetDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSaving && <span className="text-xs text-slate-500 flex items-center"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Sauvegarde...</span>}
                            <Button size="sm" variant="outline" onClick={() => handleSave(false)}>
                                <Save className="h-4 w-4 mr-2" />
                                Sauvegarder
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs defaultValue="opening" className="w-full">
                    <TabsList className="grid w-full grid-cols-6 mb-8">
                        <TabsTrigger value="opening">1. Intro</TabsTrigger>
                        <TabsTrigger value="discovery">2. Découverte</TabsTrigger>
                        <TabsTrigger value="solution">3. Solution</TabsTrigger>
                        <TabsTrigger value="price">4. Prix</TabsTrigger>
                        <TabsTrigger value="objections">5. Objections</TabsTrigger>
                        <TabsTrigger value="closing">6. Closing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="opening">
                        <StepOpening data={data.stepOpening} onChange={(d) => updateStep("stepOpening", d)} />
                    </TabsContent>
                    <TabsContent value="discovery">
                        <StepDiscovery data={data.stepDiscovery} onChange={(d) => updateStep("stepDiscovery", d)} />
                    </TabsContent>
                    <TabsContent value="solution">
                        <StepSolution data={data.stepSolution} onChange={(d) => updateStep("stepSolution", d)} />
                    </TabsContent>
                    <TabsContent value="price">
                        <StepPrice data={data.stepPrice} onChange={(d) => updateStep("stepPrice", d)} />
                    </TabsContent>
                    <TabsContent value="objections">
                        <StepObjections data={data.stepObjections} onChange={(d) => updateStep("stepObjections", d)} />
                    </TabsContent>
                    <TabsContent value="closing">
                        <StepClosing data={data.stepClosing} onChange={(d) => updateStep("stepClosing", d)} />
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
