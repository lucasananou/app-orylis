"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { QuickActions } from "./quick-actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Prospect {
    id: string;
    fullName: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    meetingBookedAt: Date | null;
    createdAt: Date;
}

interface ProspectCardProps {
    prospect: Prospect;
    active?: boolean;
}

export function ProspectCardView({ prospect, active, onClick, style, className }: ProspectCardProps & { onClick?: () => void, style?: React.CSSProperties, className?: string }) {
    return (
        <Card
            style={style}
            className={`cursor-grab hover:shadow-md hover:border-primary/20 transition-all group bg-background ${active ? "ring-2 ring-primary shadow-lg" : "shadow-sm"} ${className || "mb-2"}`}
            onClick={onClick}
        >
            <CardContent className="p-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-medium text-sm truncate leading-none pt-0.5">
                        {prospect.fullName || "Sans nom"}
                    </h4>
                    {prospect.meetingBookedAt && (
                        <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" title={`RDV: ${formatDate(prospect.meetingBookedAt)}`} />
                    )}
                </div>

                <p className="text-xs text-muted-foreground truncate mb-3">
                    {prospect.company || "Sans société"}
                </p>

                <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground font-medium">
                        {formatDate(prospect.createdAt, { day: 'numeric', month: 'short' })}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProspectCard({ prospect, active }: ProspectCardProps) {
    const router = useRouter();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: prospect.id,
        data: {
            type: "Prospect",
            prospect
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none'
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50"
            >
                <Card className="mb-2 cursor-grab shadow-sm border-dashed border-2 bg-muted/50 h-[100px]">
                    <CardContent className="p-3" />
                </Card>
            </div>
        );
    }

    const handleCardClick = () => {
        router.push(`/prospects/${prospect.id}`);
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ProspectCardView
                prospect={prospect}
                active={active}
                onClick={handleCardClick}
            />
        </div>
    );
}
