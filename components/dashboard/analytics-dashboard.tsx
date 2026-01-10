"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, Eye, MousePointerClick, Clock, Globe, Smartphone, Loader2, AlertCircle, TrendingUp, UserPlus, Repeat, Search } from "lucide-react";
import { SmartTips } from "./smart-tips";

interface AnalyticsData {
    kpis: {
        visitors: number;
        views: number;
        bounceRate: string;
        avgTime: string;
        newUsers?: string;
        returningUsers?: string;
    };
    traffic: Array<{ name: string; visitors: number; views: number }>;
    devices: Array<{ name: string; value: number; color: string }>;
    pages: Array<{ path: string; title: string; views: number; unique: number; time: string }>;
    geo: Array<{ country: string; users: number }>;
    sources?: Array<{ channel: string; users: number; sessions: number }>;
    userType?: {
        new: number;
        returning: number;
        newPercent: number;
        returningPercent: number;
    };
}

export function AnalyticsDashboard({ projectId }: { projectId?: string }) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notConfigured, setNotConfigured] = useState(false);

    useEffect(() => {
        if (!projectId) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/projects/${projectId}/analytics`);
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) throw new Error("Non autorisé");
                    throw new Error("Erreur chargement analytics");
                }
                const json = await res.json();

                if (json.notConfigured) {
                    setNotConfigured(true);
                } else if (json.error) {
                    throw new Error(json.error);
                } else {
                    setData(json);
                }
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Erreur inconnue");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    if (!projectId) return null;

    if (isLoading) {
        return (
            <div className="flex h-64 w-full items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (notConfigured) {
        return (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 text-center p-8">
                <div className="rounded-full bg-slate-200 p-3 mb-4">
                    <TrendingUp className="h-6 w-6 text-slate-500 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Statistiques non configurées</h3>
                <p className="text-slate-500 max-w-sm">
                    Les données analytiques ne sont pas encore disponibles pour ce projet. Contactez votre chef de projet pour activer le suivi.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Préparer les données du pie chart
    const userTypeChartData = data.userType ? [
        { name: 'Nouveaux visiteurs', value: data.userType.new, fill: '#3b82f6' },
        { name: 'Visiteurs récurrents', value: data.userType.returning, fill: '#8b5cf6' }
    ] : [];

    // Préparer les couleurs pour les sources
    const sourceColors: Record<string, string> = {
        "Recherche Google": "#34a853",
        "Accès Direct": "#4285f4",
        "Réseaux Sociaux": "#ea4335",
        "Sites Référents": "#fbbc04",
        "Publicité Payante": "#9333ea",
        "Email": "#06b6d4",
        "Display": "#f59e0b",
        "Autre": "#6b7280"
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h2>
                <p className="text-slate-500">Performances du site sur les 7 derniers jours.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visiteurs (7j)</CardTitle>
                        <Users className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpis.visitors.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Personnes ayant visité votre site</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pages Vues (7j)</CardTitle>
                        <Eye className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpis.views.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Nombre total de pages consultées</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nouveaux Visiteurs</CardTitle>
                        <UserPlus className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{data.kpis.newUsers || '0%'}</div>
                        <p className="text-xs text-muted-foreground mt-1">Découvrent votre site pour la 1ère fois</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visiteurs Fidèles</CardTitle>
                        <Repeat className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{data.kpis.returningUsers || '0%'}</div>
                        <p className="text-xs text-muted-foreground mt-1">Reviennent sur votre site</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taux de Rebond</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpis.bounceRate}</div>
                        <p className="text-xs text-muted-foreground mt-1">Visiteurs partis sans interaction</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
                        <Clock className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpis.avgTime}</div>
                        <p className="text-xs text-muted-foreground mt-1">Durée moyenne par visite</p>
                    </CardContent>
                </Card>
            </div>



            {/* Smart Tips Widget */}
            <SmartTips data={data} />

            {/* Toutes les sections en vertical */}
            <div className="space-y-6">
                {/* Évolution du Trafic */}
                <Card>
                    <CardHeader>
                        <CardTitle>Évolution du Trafic</CardTitle>
                        <CardDescription>Comparaison entre le nombre de visiteurs et les pages consultées au fil du temps</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.traffic} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                                        labelStyle={{ color: "#1e293b", fontWeight: "bold" }}
                                    />
                                    <Area type="monotone" dataKey="visitors" name="Visiteurs" stroke="#2563eb" fillOpacity={1} fill="url(#colorVisitors)" />
                                    <Area type="monotone" dataKey="views" name="Pages Vues" stroke="#9333ea" fillOpacity={1} fill="url(#colorViews)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Sources de Trafic + Nouveaux vs Récurrents */}
                {data.sources && data.userType && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-5 w-5 text-green-500" />
                                    D'où viennent vos visiteurs ?
                                </CardTitle>
                                <CardDescription>Canaux d'acquisition sur les 7 derniers jours</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.sources.map((source, idx) => {
                                        const total = data.sources!.reduce((sum, s) => sum + s.users, 0);
                                        const percent = total > 0 ? Math.round((source.users / total) * 100) : 0;
                                        const color = sourceColors[source.channel] || "#6b7280";

                                        return (
                                            <div key={idx}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                                        <span className="font-medium text-sm">{source.channel}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-sm">{source.users}</div>
                                                        <div className="text-xs text-slate-500">{percent}%</div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2">
                                                    <div className="h-2 rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    Type de Visiteurs
                                </CardTitle>
                                <CardDescription>Répartition entre nouveaux visiteurs et visiteurs fidèles</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={userTypeChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {userTypeChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                            <span className="text-sm font-medium">Nouveaux</span>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">{data.userType.newPercent}%</div>
                                        <div className="text-xs text-slate-500">{data.userType.new} visiteurs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                                            <span className="text-sm font-medium">Fidèles</span>
                                        </div>
                                        <div className="text-2xl font-bold text-purple-600">{data.userType.returningPercent}%</div>
                                        <div className="text-xs text-slate-500">{data.userType.returning} visiteurs</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Audience Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-slate-500" />
                                Appareils Utilisés
                            </CardTitle>
                            <CardDescription>Comment vos visiteurs accèdent à votre site</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.devices} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {data.devices.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-slate-500" />
                                Origine Géographique
                            </CardTitle>
                            <CardDescription>D'où viennent vos visiteurs dans le monde</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.geo.map((country) => {
                                    const max = data.geo[0]?.users || 1;
                                    const percent = Math.round((country.users / max) * 100);

                                    return (
                                        <div key={country.country}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{country.country}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-sm">{country.users}</div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pages les plus consultées */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pages les plus consultées</CardTitle>
                        <CardDescription>Les sections de votre site qui attirent le plus l'attention de vos visiteurs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b">
                                    <tr>
                                        <th className="h-10 px-4 font-medium align-middle">Page</th>
                                        <th className="h-10 px-4 font-medium align-middle text-right">Vues</th>
                                        <th className="h-10 px-4 font-medium align-middle text-right">Visiteurs Uniques</th>
                                        <th className="h-10 px-4 font-medium align-middle text-right">Temps Moyen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.pages.map((page) => (
                                        <tr key={page.path} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 align-middle">
                                                <div className="font-medium max-w-[200px] truncate">{page.title}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{page.path}</div>
                                            </td>
                                            <td className="p-4 align-middle text-right font-medium">{page.views}</td>
                                            <td className="p-4 align-middle text-right text-slate-600">{page.unique}</td>
                                            <td className="p-4 align-middle text-right text-slate-600">{page.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
