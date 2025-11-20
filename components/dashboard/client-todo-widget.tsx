"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Route } from "next";

interface TodoItem {
  id: string;
  type: "file" | "ticket" | "notification";
  title: string;
  count: number;
  href: Route;
}

interface ClientTodoWidgetProps {
  todos: TodoItem[];
}

export function ClientTodoWidget({ todos }: ClientTodoWidgetProps) {
  if (todos.length === 0) {
    return (
      <Card className="border border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/30 w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Rien à faire pour le moment</CardTitle>
          </div>
          <CardDescription>
            Vous êtes à jour ! Consultez les dernières activités ci-dessous.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const iconMap = {
    file: FileText,
    ticket: MessageSquare,
    notification: AlertCircle
  };

  const labelMap = {
    file: "nouveaux fichiers",
    ticket: "tickets à consulter",
    notification: "notifications"
  };

  return (
    <Card className="border border-blue-200 bg-gradient-to-br from-blue-50/50 to-accent/10 w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">À faire</CardTitle>
        </div>
        <CardDescription>
          {todos.length} {todos.length === 1 ? "action" : "actions"} en attente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {todos.map((todo) => {
          const Icon = iconMap[todo.type];
          return (
            <Button
              key={todo.id}
              variant="outline"
              className="w-full justify-start h-auto py-3"
              asChild
            >
              <Link href={todo.href}>
                <Icon className="mr-2 h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{todo.title}</span>
                <Badge variant="secondary" className="ml-2">
                  {todo.count}
                </Badge>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

