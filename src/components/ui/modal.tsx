import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

// Simple modal styles, adjust as needed for shadcn theme
export function AgentModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (agent: { icon: string; name: string; description: string; prompt: string }) => void;
}) {
  const [icon, setIcon] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [prompt, setPrompt] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({ icon, name, description, prompt });
    setIcon(""); setName(""); setDescription(""); setPrompt("");
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center bg-black/40"
      )}
    >
      <div
        className={cn(
          "bg-background rounded-lg shadow-lg p-6 w-full max-w-md"
        )}
      >
        <h2 className={cn("text-lg font-semibold mb-4")}>Create Agent</h2>
        <form onSubmit={handleSubmit} className={cn("space-y-4")}>
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            required
          />
          <div className={cn("flex justify-end gap-2")}>
            <button
              type="button"
              className={cn("px-4 py-2 rounded-md bg-muted text-foreground cursor-pointer")}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn("px-4 py-2 rounded-md bg-primary text-primary-foreground cursor-pointer")}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}