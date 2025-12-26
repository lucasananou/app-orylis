import { NextRequest, NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStaff } from "@/lib/utils";
import { projects } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const project = await db.query.projects.findFirst({
            where: eq(projects.id, id),
            columns: {
                id: true,
                ownerId: true,
                googlePropertyId: true
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Auth check: Staff or Project Owner
        if (!isStaff(session.user.role) && project.ownerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!project.googlePropertyId) {
            return NextResponse.json({ notConfigured: true });
        }

        const propertyId = project.googlePropertyId;

        // Prepare credentials
        // We expect GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY
        const credentials = {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fix newlines if passed as single string
        };

        if (!credentials.client_email || !credentials.private_key) {
            console.error("Missing Google Analytics credentials");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const analyticsDataClient = new BetaAnalyticsDataClient({
            credentials
        });

        // 1. Overview & Traffic (Last 7 days)
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: '7daysAgo',
                    endDate: 'yesterday',
                },
            ],
            dimensions: [
                { name: 'date' },
                { name: 'dayOfWeek' },
            ],
            metrics: [
                { name: 'activeUsers' },
                { name: 'screenPageViews' },
                { name: 'bounceRate' },
                { name: 'averageSessionDuration' },
            ],
            orderBys: [
                { dimension: { dimensionName: 'date' } }
            ]
        });

        // 2. Top Pages
        const [pagesResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: '7daysAgo',
                    endDate: 'yesterday',
                },
            ],
            dimensions: [
                { name: 'pagePath' },
                { name: 'pageTitle' },
            ],
            metrics: [
                { name: 'screenPageViews' },
                { name: 'activeUsers' },
                { name: 'userEngagementDuration' },
            ],
            limit: 10
        });

        // 3. Devices
        const [devicesResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: '7daysAgo',
                    endDate: 'yesterday',
                },
            ],
            dimensions: [
                { name: 'deviceCategory' },
            ],
            metrics: [
                { name: 'activeUsers' }
            ]
        });

        // 4. Countries
        const [geoResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: '7daysAgo',
                    endDate: 'yesterday',
                },
            ],
            dimensions: [
                { name: 'country' },
            ],
            metrics: [
                { name: 'activeUsers' }
            ],
            limit: 5
        });

        // Format Data

        // Traffic Data
        const trafficData = response.rows?.map(row => {
            const dayMap: Record<string, string> = { "0": "Dim", "1": "Lun", "2": "Mar", "3": "Mer", "4": "Jeu", "5": "Ven", "6": "Sam" };
            const dayIndex = row.dimensionValues?.[1]?.value || "0";
            return {
                name: dayMap[dayIndex],
                visitors: parseInt(row.metricValues?.[0]?.value || '0'),
                views: parseInt(row.metricValues?.[1]?.value || '0'),
            };
        }) || [];

        // KPI Totals
        let totalVisitors = 0;
        let totalViews = 0;
        let totalBounceRate = 0;
        let totalDuration = 0;
        let rowCount = response.rowCount || 0;

        response.rows?.forEach(row => {
            totalVisitors += parseInt(row.metricValues?.[0]?.value || '0');
            totalViews += parseInt(row.metricValues?.[1]?.value || '0');
            // Bounce rate and duration are averages, so we can't sum them simply, but for MVP let's take the report total if available
            // simpler: The API response 'totals' or 'maximums' etc might specific, but response.rows are daily.
            // Actually, runReport returns totals in `totals`.
        });

        // Use totals from response if available (it is in `totals` property of response but the node library types might differ slightly, let's look at `totals`)
        // @ts-ignore
        const totals = response.totals?.[0];
        if (totals) {
            totalVisitors = parseInt(totals.metricValues?.[0]?.value || '0');
            totalViews = parseInt(totals.metricValues?.[1]?.value || '0');
            totalBounceRate = parseFloat(totals.metricValues?.[2]?.value || '0');
            totalDuration = parseFloat(totals.metricValues?.[3]?.value || '0');
        }

        // Device Data
        const deviceColors: Record<string, string> = {
            "mobile": "#2563eb",
            "desktop": "#60a5fa",
            "tablet": "#93c5fd"
        };

        const deviceData = devicesResponse.rows?.map(row => {
            const name = row.dimensionValues?.[0]?.value || "Unknown";
            return {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value: parseInt(row.metricValues?.[0]?.value || '0'),
                color: deviceColors[name] || "#cbd5e1"
            }
        }) || [];

        // Pages Data
        const pagesData = pagesResponse.rows?.map(row => {
            const durationSec = parseInt(row.metricValues?.[2]?.value || '0');
            const users = parseInt(row.metricValues?.[1]?.value || '0');
            const avgTime = users > 0 ? durationSec / users : 0;
            const minutes = Math.floor(avgTime / 60);
            const seconds = Math.floor(avgTime % 60);

            return {
                path: row.dimensionValues?.[0]?.value || '/',
                title: row.dimensionValues?.[1]?.value || 'Page',
                views: parseInt(row.metricValues?.[0]?.value || '0'),
                unique: parseInt(row.metricValues?.[1]?.value || '0'),
                time: `${minutes}m ${seconds}s`
            }
        }) || [];

        // Geo Data
        const geoData = geoResponse.rows?.map(row => ({
            country: row.dimensionValues?.[0]?.value || 'Unknown',
            users: parseInt(row.metricValues?.[0]?.value || '0')
        })) || [];


        return NextResponse.json({
            kpis: {
                visitors: totalVisitors,
                views: totalViews,
                bounceRate: (totalBounceRate * 100).toFixed(1) + '%', // GA4 returns decimal 0.42
                avgTime: `${Math.floor(totalDuration / 60)}m ${Math.floor(totalDuration % 60)}s`
            },
            traffic: trafficData,
            devices: deviceData,
            pages: pagesData,
            geo: geoData
        });

    } catch (error) {
        console.error("[Analytics API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
