import { DashboardHighlights, type DashboardHighlightItem } from "@/components/dashboard/dashboard-highlights";

interface DashboardStatsProps {
    highlights: DashboardHighlightItem[];
    className?: string;
}

export function DashboardStats({ highlights, className }: DashboardStatsProps) {
    return <DashboardHighlights items={highlights} className={className} />;
}
