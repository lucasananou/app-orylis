"use client";

import { useMemo, useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    useDroppable,
    pointerWithin,
    rectIntersection,
    getFirstCollision,
    CollisionDetection
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ProspectCard, ProspectCardView } from "./prospect-card";
import { Badge } from "@/components/ui/badge";
import { updateProspectStatus } from "@/actions/sales";
import { toast } from "sonner";
import { createPortal } from "react-dom";

type ProspectStatus = "new" | "contacted" | "demo_sent" | "offer_sent" | "negotiation" | "meeting" | "proposal" | "won" | "lost";

const COLUMNS: { id: ProspectStatus; title: string, color: string }[] = [
    { id: "new", title: "Nouveau", color: "bg-blue-500/10 text-blue-700" },
    { id: "contacted", title: "Contacté", color: "bg-yellow-500/10 text-yellow-700" },
    { id: "demo_sent", title: "Démo envoyée", color: "bg-indigo-500/10 text-indigo-700" },
    { id: "meeting", title: "RDV", color: "bg-purple-500/10 text-purple-700" },
    { id: "proposal", title: "Proposition", color: "bg-pink-500/10 text-pink-700" },
    { id: "offer_sent", title: "Offre envoyée", color: "bg-orange-500/10 text-orange-700" },
    { id: "negotiation", title: "Négociation", color: "bg-amber-500/10 text-amber-700" },
    { id: "won", title: "Gagné", color: "bg-green-500/10 text-green-700" },
    { id: "lost", title: "Perdu", color: "bg-gray-500/10 text-gray-700" }
];

interface Prospect {
    id: string;
    fullName: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    meetingBookedAt: Date | null;
    createdAt: Date;
    prospectStatus: ProspectStatus;
}

interface KanbanBoardProps {
    initialProspects: Prospect[];
}

function KanbanColumn({ col, prospects, children }: { col: typeof COLUMNS[0], prospects: Prospect[], children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({
        id: col.id,
        data: {
            type: "Column",
            column: col
        }
    });

    return (
        <div
            ref={setNodeRef}
            className="w-[320px] shrink-0 flex flex-col rounded-xl bg-muted/40 border p-3 h-full max-h-[calc(100vh-220px)]"
        >
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                    {col.title}
                    <Badge variant="secondary" className={`ml-1 text-[10px] rounded-sm px-1.5 h-5 ${col.color}`}>
                        {prospects.length}
                    </Badge>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                {children}
            </div>
        </div>
    );
}

export function KanbanBoard({ initialProspects }: KanbanBoardProps) {
    const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sync state when server data changes
    useEffect(() => {
        setProspects(initialProspects);
    }, [initialProspects]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columns = useMemo(() => {
        const cols = new Map<ProspectStatus, Prospect[]>();
        COLUMNS.forEach(col => cols.set(col.id, []));
        prospects.forEach(p => {
            const list = cols.get(p.prospectStatus);
            if (list) list.push(p);
        });
        return cols;
    }, [prospects]);

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the containers
        const activeProspect = prospects.find(p => p.id === activeId);
        const overProspect = prospects.find(p => p.id === overId);

        if (!activeProspect) return;

        const activeStatus = activeProspect.prospectStatus;
        const overColumn = COLUMNS.find(c => c.id === overId);

        // Determine the new status
        let newStatus: ProspectStatus | null = null;

        if (overColumn) {
            // We are over a column container
            newStatus = overColumn.id;
        } else if (overProspect) {
            // We are over another item
            newStatus = overProspect.prospectStatus;
        }

        // If status is different, move the item in the local state for visual feedback
        if (newStatus && newStatus !== activeStatus) {
            setProspects((items) => {
                return items.map(item =>
                    item.id === activeId
                        ? { ...item, prospectStatus: newStatus! }
                        : item
                );
            });
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeProspect = prospects.find(p => p.id === activeId);
        if (!activeProspect) return;

        // Determine final destination
        const overColumn = COLUMNS.find(c => c.id === overId);
        const overProspect = prospects.find(p => p.id === overId);

        let newStatus: ProspectStatus | undefined;

        if (overColumn) {
            newStatus = overColumn.id;
        } else if (overProspect) {
            newStatus = overProspect.prospectStatus;
        }

        if (newStatus) {
            // Optimistic update was already done in DragOver for column change
            // Just ensure we commit the final order if we were implementing reordering within column
            // For now, we just sync with DB if status changed

            // We need to verify if the status ACTUALLY changed compared to what the DB knows (initialProspects)
            // But since local state was updated in onDragOver, activeProspect.prospectStatus is ALREADY the new status!
            // Wait, we need to compare with the previous state or just trust the newStatus.
            // Actually, updateProspectStatus serves as the "commit".

            // Re-finding the original to check if we really need an API call
            const originalProspect = initialProspects.find(p => p.id === activeId);

            if (originalProspect && originalProspect.prospectStatus !== newStatus) {
                try {
                    await updateProspectStatus(activeId, newStatus);
                    toast.success(`Prospect déplacé vers ${COLUMNS.find(c => c.id === newStatus)?.title}`);
                } catch (error) {
                    toast.error("Erreur lors de la mise à jour");
                    setProspects(initialProspects); // Revert
                }
            }
        }
    };

    const dropAnimation: DropAnimation | null = null;

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex h-full gap-6 overflow-x-auto pb-4 px-2">
                {COLUMNS.map((col) => (
                    <div key={col.id} className="w-[320px] shrink-0 flex flex-col rounded-xl bg-muted/40 border p-3 h-full max-h-[calc(100vh-220px)]">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                                {col.title}
                                <Badge variant="secondary" className={`ml-1 text-[10px] rounded-sm px-1.5 h-5 ${col.color}`}>
                                    {(columns.get(col.id) || []).length}
                                </Badge>
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                            <div className="min-h-[100px]" >
                                {(columns.get(col.id) || []).map((prospect) => (
                                    <ProspectCard key={prospect.id} prospect={prospect} />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const customCollisionDetection: CollisionDetection = (args) => {
        // First, check for exact pointer overlap with a Droppable (column)
        const pointerCollisions = pointerWithin(args);

        // If we found collisions with pointer
        if (pointerCollisions.length > 0) {
            // Prefer columns (containers) over items when moving between lists
            // This prevents "flickering" when hovering over gaps
            return pointerCollisions;
        }

        // Fallback to closest corners for smoother item sorting
        return closestCorners(args);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex h-full gap-6 overflow-x-auto pb-4 px-2">
                {COLUMNS.map((col) => {
                    const columnProspects = columns.get(col.id) || [];
                    return (
                        <KanbanColumn key={col.id} col={col} prospects={columnProspects}>
                            <SortableContext
                                id={col.id}
                                items={columnProspects.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-3 min-h-[150px] p-0.5">
                                    {columnProspects.map((prospect) => (
                                        <ProspectCard key={prospect.id} prospect={prospect} />
                                    ))}
                                </div>
                            </SortableContext>
                        </KanbanColumn>
                    );
                })}
            </div>

            {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        <ProspectCardView
                            prospect={prospects.find(p => p.id === activeId)!}
                            active
                        />
                    ) : null}
                </DragOverlay>,
                document.body
            )}

        </DndContext>
    );
}
