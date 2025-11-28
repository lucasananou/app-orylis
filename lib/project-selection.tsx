'use client';

import * as React from "react";

const STORAGE_KEY = "orylis:selectedProjectId";

type ProjectSelectionContextValue = {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  ready: boolean;
};

const ProjectSelectionContext = React.createContext<ProjectSelectionContextValue | null>(null);

export function ProjectSelectionProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectIdState] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProjectIdState(stored);
      }
    } catch {
      // ignore storage failures
    } finally {
      setReady(true);
    }
  }, []);

  const setProjectId = React.useCallback((id: string | null) => {
    setProjectIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, []);

  const value = React.useMemo<ProjectSelectionContextValue>(
    () => ({
      projectId,
      setProjectId,
      ready
    }),
    [projectId, ready, setProjectId]
  );

  return (
    <ProjectSelectionContext.Provider value={value}>
      {children}
    </ProjectSelectionContext.Provider>
  );
}

export function useProjectSelection() {
  const context = React.useContext(ProjectSelectionContext);
  if (!context) {
    throw new Error("useProjectSelection must be used within a ProjectSelectionProvider.");
  }
  return context;
}


