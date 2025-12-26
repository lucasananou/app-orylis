import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Users, Eye, MousePointerClick, Clock, Globe, Smartphone, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
    kpis: {
        visitors: number;
        views: number;
        bounceRate: string;
        avgTime: string;
    };
    traffic: Array<{ name: string; visitors: number; views: number }>;
    devices: Array<{ name: string; value: number; color: string }>;
    pages: Array<{ path: string; title: string; views: number; unique: number; time: string }>;
    geo: Array<{ country: string; users: number }>;
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
                    <AreaChart className="h-6 w-6 text-slate-500 opacity-50" />
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h2>
                    <p className="text-slate-500">Performances du site sur les 7 derniers jours.</p>
                </div>
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
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pages Vues (7j)</CardTitle>
                        <Eye className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpis.views.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taux de Rebond</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpis.bounceRate}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
                        <Clock className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.kpis.avgTime}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="traffic" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="traffic">Trafic</TabsTrigger>
                    <TabsTrigger value="content">Contenu</TabsTrigger>
                    <TabsTrigger value="audience">Audience</TabsTrigger>
                </TabsList>

                {/* Tab: Traffic */}
                <TabsContent value="traffic" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Évolution du Trafic</CardTitle>
                            <CardDescription>Comparaison Visiteurs vs Pages Vues</CardDescription>
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
                </TabsContent>

                {/* Tab: Content */}
                <TabsContent value="content" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pages les plus consultées</CardTitle>
                            <CardDescription>Quelles sections intéressent le plus vos visiteurs ?</CardDescription>
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
                </TabsContent>

                {/* Tab: Audience */}
                <TabsContent value="audience" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-slate-500" />
                                    Appareils
                                </CardTitle>
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
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.geo.map((country, idx) => {
                                        // Calculate global percentage based on total visitors (approx from first country for now or just max)
                                        // A simple visual percentage
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
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
