import { TEMPLATE_STORAGE_KEY } from "../constant";
import type { PromptTemplate } from "../interface";

/**
 * A library of saved prompts, kept in this browser.
 *
 * Deliberately local: a template is often most of a working prompt, and this
 * app has no accounts to keep one under. Sharing is a file — export writes the
 * library out as JSON, import merges someone else's back in — which is enough
 * to hand a set of prompts to a colleague without either of you signing in
 * anywhere.
 */

const LIBRARY_LIMIT = 200;

const read = (): PromptTemplate[] => {
  try {
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isTemplate) : [];
  } catch {
    return [];
  }
};

const write = (templates: PromptTemplate[]) => {
  try {
    localStorage.setItem(
      TEMPLATE_STORAGE_KEY,
      JSON.stringify(templates.slice(0, LIBRARY_LIMIT))
    );
  } catch {
    // Storage can be blocked or full; the caller still has its own state.
  }
};

const isTemplate = (value: unknown): value is PromptTemplate => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PromptTemplate>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.prompt === "string" &&
    candidate.prompt.trim().length > 0
  );
};

const newId = () =>
  `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Every saved template, newest first. */
export const listTemplates = (): PromptTemplate[] => read();

/** The templates saved for one tool, plus the ones saved for no tool at all. */
export const templatesForTool = (tool: string): PromptTemplate[] =>
  read().filter((template) => !template.tool || template.tool === tool);

export const saveTemplate = (
  name: string,
  prompt: string,
  tool: string
): PromptTemplate[] => {
  const template: PromptTemplate = {
    id: newId(),
    name: name.trim().slice(0, 80) || "Untitled",
    prompt,
    tool,
    created_at: new Date().toISOString(),
  };

  const templates = [template, ...read()];
  write(templates);
  return templates;
};

export const deleteTemplate = (id: string): PromptTemplate[] => {
  const templates = read().filter((template) => template.id !== id);
  write(templates);
  return templates;
};

/** The library as a file the browser will save. */
export const exportTemplates = () => {
  const blob = new Blob([JSON.stringify(read(), null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "nevatal-prompt-templates.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Merge a library exported from somewhere else.
 *
 * Templates are added rather than replacing what is here, and anything that
 * is not a usable template is skipped, so importing a wrong file costs
 * nothing. Ids are reissued, so importing the same file twice does not
 * collide with itself.
 */
export const importTemplates = async (file: File): Promise<PromptTemplate[]> => {
  const parsed = JSON.parse(await file.text());
  if (!Array.isArray(parsed)) {
    throw new Error("That file does not contain a template library.");
  }

  const incoming = parsed.filter(isTemplate).map((template) => ({
    id: newId(),
    name: String(template.name).slice(0, 80),
    prompt: String(template.prompt),
    tool: typeof template.tool === "string" ? template.tool : "",
    created_at: new Date().toISOString(),
  }));

  if (incoming.length === 0) {
    throw new Error("That file contained no usable templates.");
  }

  const templates = [...incoming, ...read()];
  write(templates);
  return templates;
};
