"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import {
    Ticket,
    UserPlus,
    FileSignature,
    ReceiptEuro,
    Clock
} from "lucide-react";

export interface ActivityItem {
    id: string;
    type: "ticket_created" | "prospect_registered" | "quote_signed" | "invoice_paid";
    title: string;
    description: string;
    timestamp: string;
    userInitials?: string;
}

interface RecentActivityProps {
    activities: ActivityItem[];
}

const ICONS = {
    ticket_created: { icon: Ticket, color: "text-blue-500", bg: "bg-blue-50" },
    prospect_registered: { icon: UserPlus, color: "text-purple-500", bg: "bg-purple-50" },
    quote_signed: { icon: FileSignature, color: "text-green-500", bg: "bg-green-50" },
    invoice_paid: { icon: ReceiptEuro, color: "text-emerald-500", bg: "bg-emerald-50" },
};

export function RecentActivity({ activities }: RecentActivityProps) {
    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-20" />
                <p>Aucune activité récente</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((activity) => {
                const config = ICONS[activity.type] || { icon: Clock, color: "text-gray-500", bg: "bg-gray-50" };
                const Icon = config.icon;

                return (
                    <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`p-2 rounded-full ${config.bg} shrink-0`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(activity.timestamp)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
