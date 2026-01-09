"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, AlertCircle } from "lucide-react";
import { toggleTask, deleteTask } from "@/actions/tasks";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { AddTaskDialog } from "./add-task-dialog";

interface Task {
    id: string;
    title: string;
    completed: boolean;
    dueDate: Date | null;
    priority: "low" | "medium" | "high";
}

interface TaskListProps {
    prospectId: string;
    initialTasks: Task[];
}

export function TaskList({ prospectId, initialTasks }: TaskListProps) {
    // Optimistic UI could be added here, but for now we rely on server revalidation 
    // passed down via props from the parent page

    // Sorting: Incomplete first, then by date needed
    const sortedTasks = [...initialTasks].sort((a, b) => {
        if (a.completed === b.completed) {
            return new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime();
        }
        return a.completed ? 1 : -1;
    });

    const handleToggle = async (id: string, checked: boolean) => {
        try {
            await toggleTask(id, checked);
            toast.success(checked ? "Tâche terminée" : "Tâche rouverte");
        } catch (error) {
            toast.error("Erreur");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTask(id);
            toast.success("Tâche supprimée");
        } catch (error) {
            toast.error("Erreur");
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case "high": return "text-red-500 bg-red-50 border-red-100";
            case "medium": return "text-amber-500 bg-amber-50 border-amber-100";
            default: return "text-blue-500 bg-blue-50 border-blue-100";
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    Tâches & Rappels
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        {initialTasks.filter(t => !t.completed).length}
                    </Badge>
                </h3>
                <AddTaskDialog prospectId={prospectId} />
            </div>

            <div className="space-y-2">
                {sortedTasks.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                        Aucune tâche pour le moment
                    </div>
                )}

                {sortedTasks.map(task => (
                    <div
                        key={task.id}
                        className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border bg-card transition-all group",
                            task.completed && "opacity-60 bg-muted/50"
                        )}
                    >
                        <Checkbox
                            checked={task.completed}
                            onCheckedChange={(c) => handleToggle(task.id, c as boolean)}
                            className="mt-1"
                        />

                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-sm font-medium",
                                    task.completed && "line-through text-muted-foreground"
                                )}>
                                    {task.title}
                                </span>
                                <Badge variant="outline" className={cn("text-[10px] h-5 px-1 border-0", getPriorityColor(task.priority))}>
                                    {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Normal' : 'Bas'}
                                </Badge>
                            </div>

                            {task.dueDate && (
                                <div className={cn(
                                    "flex items-center gap-1 text-xs",
                                    new Date(task.dueDate) < new Date() && !task.completed ? "text-red-500 font-medium" : "text-muted-foreground"
                                )}>
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(task.dueDate)}
                                </div>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(task.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
