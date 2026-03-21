import type { FilledIdea } from "../hooks/useFilledIdeas";

export type SavedDateIdea = FilledIdea & {
  id: string;
  savedAt: string;
};

let savedIdeas: SavedDateIdea[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function getSavedIdeas(): SavedDateIdea[] {
  return [...savedIdeas];
}

export function saveDateIdea(idea: FilledIdea): SavedDateIdea {
  const signature = `${idea.filledTemplate}__${idea.template}`;
  const existing = savedIdeas.find(
    (saved) => `${saved.filledTemplate}__${saved.template}` === signature,
  );

  if (existing) {
    return existing;
  }

  const savedIdea: SavedDateIdea = {
    ...idea,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    savedAt: new Date().toISOString(),
  };

  savedIdeas = [savedIdea, ...savedIdeas];
  notifyListeners();
  return savedIdea;
}

export function removeSavedIdea(id: string): void {
  const nextSavedIdeas = savedIdeas.filter((idea) => idea.id !== id);
  if (nextSavedIdeas.length === savedIdeas.length) {
    return;
  }

  savedIdeas = nextSavedIdeas;
  notifyListeners();
}

export function subscribeSavedIdeas(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
