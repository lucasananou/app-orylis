"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface StepProps {
    data: any;
    onChange: (data: any) => void;
}

export function StepOpening({ data, onChange }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700 space-y-2">
                <p className="font-semibold">🗣️ SCRIPT :</p>
                <p>« Salut [Prénom], Lucas. Merci d’avoir pris le temps.</p>
                <p>Avant qu’on regarde ensemble ce que je peux mettre en place pour toi, je te pose juste une question simple :</p>
                <p className="font-bold">Tu as bien vu la démo que je t’ai envoyée ? »</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>A vu la démo ?</Label>
                    <RadioGroup
                        value={data?.demo_seen}
                        onValueChange={(v) => onChange({ ...data, demo_seen: v })}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="oui" id="demo-oui" />
                            <Label htmlFor="demo-oui">Oui</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="non" id="demo-non" />
                            <Label htmlFor="demo-non">Non</Label>
                        </div>
                    </RadioGroup>
                </div>

                {data?.demo_seen === "non" && (
                    <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm text-amber-800">
                        🗣️ « Aucun souci. Je te fais un récap ultra clair maintenant, et tu pourras revoir la démo juste après. »
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Température du prospect</Label>
                    <Select
                        value={data?.prospect_temperature}
                        onValueChange={(v) => onChange({ ...data, prospect_temperature: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="chaud">🔥 Chaud</SelectItem>
                            <SelectItem value="tiede">😐 Tiède</SelectItem>
                            <SelectItem value="froid">❄️ Froid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

export function StepDiscovery({ data, onChange }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700 space-y-2">
                <p className="font-semibold">🗣️ SCRIPT :</p>
                <p>« Pour te proposer quelque chose d’intelligent, j’ai besoin de comprendre 3 points : où tu en es, où tu veux aller, et ce qui t’empêche d’y aller aujourd’hui. »</p>
            </div>

            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Site actuel ?</Label>
                        <Select
                            value={data?.has_website}
                            onValueChange={(v) => onChange({ ...data, has_website: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="oui">Oui</SelectItem>
                                <SelectItem value="non">Non (Création)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {data?.has_website === "oui" && (
                        <div className="space-y-2">
                            <Label>Performance actuelle</Label>
                            <Input
                                placeholder="Ex: 2 clients/mois"
                                value={data?.current_performance || ""}
                                onChange={(e) => onChange({ ...data, current_performance: e.target.value })}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Objectif principal</Label>
                    <Select
                        value={data?.main_goal}
                        onValueChange={(v) => onChange({ ...data, main_goal: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="plus_clients">Plus de clients</SelectItem>
                            <SelectItem value="credibilite">Crédibilité / Image</SelectItem>
                            <SelectItem value="seo_local">SEO Local / Visibilité</SelectItem>
                            <SelectItem value="automatisation">Automatisation</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Douleur principale (Pain)</Label>
                    <Select
                        value={data?.main_pain}
                        onValueChange={(v) => onChange({ ...data, main_pain: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="temps">Manque de temps</SelectItem>
                            <SelectItem value="technique">Trop technique</SelectItem>
                            <SelectItem value="aucun_resultat">Aucun résultat actuel</SelectItem>
                            <SelectItem value="image_obsolete">Image obsolète</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Select
                        value={data?.deadline}
                        onValueChange={(v) => onChange({ ...data, deadline: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="asap">ASAP (Urgent)</SelectItem>
                            <SelectItem value="1_mois">Dans 1 mois</SelectItem>
                            <SelectItem value="3_mois">Dans 3 mois</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Notes libres</Label>
                    <Textarea
                        placeholder="Notes sur la situation..."
                        value={data?.notes || ""}
                        onChange={(e) => onChange({ ...data, notes: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}

export function StepSolution({ data, onChange }: StepProps) {
    const toggleFeature = (feature: string) => {
        const current = data?.features || [];
        const updated = current.includes(feature)
            ? current.filter((f: string) => f !== feature)
            : [...current, feature];
        onChange({ ...data, features: updated });
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700 space-y-2">
                <p className="font-semibold">🗣️ SCRIPT :</p>
                <p>« Ce qu’il te faut, c’est : un site pro, optimisé, visible, et qui tourne automatiquement. »</p>
                <p>Présenter : 1. Site Premium (Outil commercial) / 2. SEO Local / 3. Espace Client Orylis</p>
            </div>

            <div className="space-y-4">
                <Label>Points clés validés :</Label>
                <div className="grid gap-2">
                    {[
                        { id: "site_wordpress_pro", label: "Site WordPress Premium" },
                        { id: "seo_local", label: "SEO Local Intégré" },
                        { id: "espace_client_premium", label: "Espace Client Premium" },
                        { id: "tunnel_acquisition", label: "Tunnel d'acquisition" },
                        { id: "securisation_vitesse", label: "Sécurisation & Vitesse" },
                        { id: "delais_rapides", label: "Délais rapides" },
                    ].map((item) => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={item.id}
                                checked={(data?.features || []).includes(item.id)}
                                onCheckedChange={() => toggleFeature(item.id)}
                            />
                            <Label htmlFor={item.id}>{item.label}</Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function StepPrice({ data, onChange }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700 space-y-2">
                <p className="font-semibold">🗣️ SCRIPT :</p>
                <p>« Pour tout mettre en place — le site complet, l’optimisation, le SEO local, l’espace client premium — on est sur 990€, tout inclus. »</p>
                <p className="font-bold text-red-600">⛔️ SILENCE ABSOLU APRÈS L'ANNONCE</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Prix annoncé (€)</Label>
                    <Input
                        type="number"
                        defaultValue={990}
                        value={data?.proposed_price}
                        onChange={(e) => onChange({ ...data, proposed_price: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Réaction du prospect</Label>
                    <Select
                        value={data?.prospect_reaction}
                        onValueChange={(v) => onChange({ ...data, prospect_reaction: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ok">✅ OK / Accepte</SelectItem>
                            <SelectItem value="hesite">🤔 Hésite</SelectItem>
                            <SelectItem value="trop_cher">💸 Trop cher</SelectItem>
                            <SelectItem value="comparatif">⚖️ Veut comparer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

export function StepObjections({ data, onChange }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700 space-y-2">
                <p className="font-semibold">🗣️ SCRIPT :</p>
                <p>« Je comprends. Mais en général, derrière un "je dois réfléchir", il y a soit un doute sur la valeur, soit sur le budget. C’est lequel pour toi ? »</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Objection principale</Label>
                    <Select
                        value={data?.main_objection}
                        onValueChange={(v) => onChange({ ...data, main_objection: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="prix">Prix</SelectItem>
                            <SelectItem value="reflechir">Besoin de réfléchir</SelectItem>
                            <SelectItem value="concurrence">Concurrence</SelectItem>
                            <SelectItem value="timing">Timing / Pas le moment</SelectItem>
                            <SelectItem value="indecision">Indécision</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Réponse / Notes</Label>
                    <Textarea
                        placeholder="Arguments utilisés..."
                        value={data?.sales_answer || ""}
                        onChange={(e) => onChange({ ...data, sales_answer: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}

export function StepClosing({ data, onChange }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700 space-y-2">
                <p className="font-semibold">🗣️ SCRIPT :</p>
                <p>« Tu préfères valider maintenant ou je t’envoie le lien par SMS ? »</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Statut du Closing</Label>
                    <Select
                        value={data?.closing_status}
                        onValueChange={(v) => onChange({ ...data, closing_status: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paiement_immediat">🎉 Paiement Immédiat</SelectItem>
                            <SelectItem value="lien_sms">📱 Lien SMS envoyé</SelectItem>
                            <SelectItem value="relance_2h">⏰ Relance 2h (Créneau bloqué)</SelectItem>
                            <SelectItem value="relance_24h">📅 Relance 24h</SelectItem>
                            <SelectItem value="perdu">❌ Prospect Perdu</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
