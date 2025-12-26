
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AnalyticsData {
    name: string;
    value: number;
}

interface AnalyticsChartProps {
    data?: AnalyticsData[];
    title?: string;
    description?: string;
    isLoading?: boolean;
}

const MOCK_DATA = [
    { name: "Lun", value: 12 },
    { name: "Mar", value: 18 },
    { name: "Mer", value: 15 },
    { name: "Jeu", value: 25 },
    { name: "Ven", value: 20 },
    { name: "Sam", value: 28 },
    { name: "Dim", value: 35 },
];

export function AnalyticsChart({
    data = MOCK_DATA,
    title = "Visiteurs uniques",
    description = "7 derniers jours",
    isLoading = false
}: AnalyticsChartProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center">
                    <div className="animate-pulse h-full w-full bg-slate-100 rounded-md" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 10,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                }}
                                itemStyle={{ color: "#1e293b" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#2563eb"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
