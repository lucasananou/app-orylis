'use client';

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProjectSelection } from "@/lib/project-selection";
import { cn, isStaff } from "@/lib/utils";

type ProjectOption = {
  id: string;
  name: string;
};

interface ProjectSwitcherProps {
  projects: ProjectOption[];
  role: "prospect" | "client" | "staff";
}

export function ProjectSwitcher({ projects, role }: ProjectSwitcherProps) {
  const { projectId, setProjectId, ready } = useProjectSelection();
  const [open, setOpen] = React.useState(false);
  const staff = isStaff(role);
  const hasProjects = projects.length > 0;

  React.useEffect(() => {
    if (!ready) {
      return;
    }

    if (!staff && hasProjects && !projectId) {
      setProjectId(projects[0].id);
    }

    if (projectId && !projects.some((project) => project.id === projectId)) {
      setProjectId(staff ? null : hasProjects ? projects[0].id : null);
    }
  }, [ready, staff, hasProjects, projectId, projects, setProjectId]);

  const currentProject = projectId ? projects.find((project) => project.id === projectId) : null;

  const label = (() => {
    if (!ready) {
      return "Chargement...";
    }
    if (projectId && currentProject) {
      return currentProject.name;
    }
    if (staff) {
      return "Tous les projets";
    }
    return hasProjects ? projects[0].name : "Aucun projet";
  })();

  const handleSelect = (value: string) => {
    if (value === "__all__") {
      setProjectId(null);
    } else {
      setProjectId(value);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-expanded={open}
          className="min-w-0 max-w-full w-auto sm:w-64 justify-between gap-2 rounded-full"
        >
          <span className="truncate text-left text-sm font-medium text-foreground">{label}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un projet..." />
          <CommandList>
            <CommandEmpty>Aucun projet trouvé.</CommandEmpty>
            <CommandGroup>
              {staff && (
                <CommandItem
                  key="__all__"
                  value="__all__"
                  onSelect={() => handleSelect("__all__")}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      projectId === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Tous les projets
                </CommandItem>
              )}
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={() => handleSelect(project.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      projectId === project.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{project.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

