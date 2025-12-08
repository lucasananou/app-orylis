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

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Importance du site (Business)</Label>
                        <Select
                            value={data?.website_importance}
                            onValueChange={(v) => onChange({ ...data, website_importance: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="faible">Faible</SelectItem>
                                <SelectItem value="moyen">Moyen</SelectItem>
                                <SelectItem value="fort">Fort (Vital)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Conséquence si rien ne change (Gap)</Label>
                        <Textarea
                            placeholder="Perte de CA, image dégradée..."
                            value={data?.gap_consequence || ""}
                            onChange={(e) => onChange({ ...data, gap_consequence: e.target.value })}
                            className="h-10 min-h-[40px]"
                        />
                    </div>
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

            <div className="space-y-2 pt-4 border-t">
                <Label>Angle de vente choisi</Label>
                <Input
                    placeholder="Ex: Image + Crédibilité / Leadgen + SEO..."
                    value={data?.sales_angle || ""}
                    onChange={(e) => onChange({ ...data, sales_angle: e.target.value })}
                />
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

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Acompte proposé (€)</Label>
                        <Input
                            type="number"
                            placeholder="Ex: 300"
                            value={data?.deposit_amount || ""}
                            onChange={(e) => onChange({ ...data, deposit_amount: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Bonus annoncé</Label>
                        <Select
                            value={data?.bonus_offered}
                            onValueChange={(v) => onChange({ ...data, bonus_offered: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="aucun">Aucun</SelectItem>
                                <SelectItem value="seo_boost">🚀 Boost SEO Offert</SelectItem>
                                <SelectItem value="formation">🎓 Formation Offerte</SelectItem>
                                <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
    const getObjectionScript = (objection: string) => {
        switch (objection) {
            case "prix":
                return "💡 SCRIPT PRIX : « Je comprends. C'est un budget. Mais si ce site te rapporte ne serait-ce que 1 client par mois à 500€, il est rentabilisé en 2 mois. Le reste, c'est du bonus pur. C'est un investissement, pas une dépense. »";
            case "reflechir":
                return "💡 SCRIPT RÉFLEXION : « Je comprends. Mais dis-moi franchement, qu'est-ce qui te fait hésiter ? C'est la valeur que tu n'es pas sûr de récupérer, ou c'est vraiment une question de trésorerie maintenant ? »";
            case "concurrence":
                return "💡 SCRIPT CONCURRENCE : « OK. Eux ils font des sites. Nous on fait des machines à clients avec SEO local intégré. C'est comme comparer une carte de visite et un commercial qui bosse 24/7. »";
            default:
                return null;
        }
    };

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

                {data?.main_objection && getObjectionScript(data.main_objection) && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm text-blue-800 italic">
                        {getObjectionScript(data.main_objection)}
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Objection secondaire</Label>
                    <Select
                        value={data?.secondary_objection}
                        onValueChange={(v) => onChange({ ...data, secondary_objection: v })}
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

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Date de relance prévue</Label>
                    <Input
                        type="datetime-local"
                        value={data?.follow_up_date || ""}
                        onChange={(e) => onChange({ ...data, follow_up_date: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Canal de relance</Label>
                    <Select
                        value={data?.follow_up_channel}
                        onValueChange={(v) => onChange({ ...data, follow_up_channel: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tel">📞 Téléphone</SelectItem>
                            <SelectItem value="sms">📱 SMS</SelectItem>
                            <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                            <SelectItem value="email">📧 Email</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Probabilité de Closing</Label>
                <Select
                    value={data?.closing_probability}
                    onValueChange={(v) => onChange({ ...data, closing_probability: v })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0-25">🔴 0-25% (Froid)</SelectItem>
                        <SelectItem value="25-50">🟠 25-50% (Incertain)</SelectItem>
                        <SelectItem value="50-75">🟡 50-75% (Possible)</SelectItem>
                        <SelectItem value="75-100">🟢 75-100% (Très chaud)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
