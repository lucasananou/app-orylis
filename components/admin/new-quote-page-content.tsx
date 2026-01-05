"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ArrowLeft, FileText, Settings2, Share2 } from "lucide-react";
import { createStandaloneQuote } from "@/actions/admin/quotes";
import { QuotePreviewLite } from "./quote-preview-lite";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NewQuotePageContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        company: "",
        projectName: "",
        amount: "",
        services: "Site internet optimisé Orylis\nBranding et design sur-mesure\nResponsive PC, Tablette et Smartphone\nRéférencement Google optimisé",
        delay: "2-4 semaines"
    });
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let pdfUrl = undefined;

            if (file) {
                const uploadData = new FormData();
                uploadData.append("file", file);

                const uploadRes = await fetch("/api/admin/quotes/upload", {
                    method: "POST",
                    body: uploadData
                });

                if (!uploadRes.ok) throw new Error("Erreur lors de l'upload du PDF");
                const { url } = await uploadRes.json();
                pdfUrl = url;
            }

            const result = await createStandaloneQuote({
                ...formData,
                amount: formData.amount ? parseFloat(formData.amount) : undefined,
                services: formData.services.split("\n").filter(s => s.trim() !== ""),
                pdfUrl
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message);
                router.push("/admin/quotes");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/quotes">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Nouveau Devis</h1>
                </div>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Générer et envoyer
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Form Side */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-primary" />
                                Configuration
                            </CardTitle>
                            <CardDescription>Informations du prospect et détails de l&apos;offre.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nom complet</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Jean Dupont"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="jean@exemple.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="projectName">Nom du projet</Label>
                                    <Input
                                        id="projectName"
                                        placeholder="Site Vitrine"
                                        value={formData.projectName}
                                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company">Société (optionnel)</Label>
                                    <Input
                                        id="company"
                                        placeholder="Ma Boutique SAS"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Montant HT (€)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="1490"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="delay">Délai estimé</Label>
                                    <Input
                                        id="delay"
                                        placeholder="2-4 semaines"
                                        value={formData.delay}
                                        onChange={(e) => setFormData({ ...formData, delay: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="services">Services inclus (un par ligne)</Label>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Le 1er est le titre principal</span>
                                </div>
                                <textarea
                                    id="services"
                                    className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.services}
                                    onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <Label htmlFor="pdf">Import manuel (Remplace la génération auto)</Label>
                                <Input
                                    id="pdf"
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <p className="text-[10px] text-muted-foreground italic">Si vous uploadez un PDF, les champs montant/services ne seront utilisés que pour la zone de signature.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Side */}
                <div className="lg:sticky lg:top-24 space-y-4">
                    <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Aperçu en temps réel
                        </div>
                        <div className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            Génération PDF Kit
                        </div>
                    </div>
                    <QuotePreviewLite data={formData} />
                </div>
            </div>
        </div>
    );
}
