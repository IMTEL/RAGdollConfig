import { agentsClient, AgentUIState, LLM } from "@/app/(main)/agents/agent_data"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import * as React from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { SelectEmbedding } from "./select-embedding"
import { SelectModel } from "./select-model"

// Simple modal styles, adjust as needed for shadcn theme
export function AgentModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (agent: AgentUIState) => void
}) {
  const [icon, setIcon] = React.useState("")
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [model, setModel] = React.useState<LLM | null>(null)
  const [embeddingModel, setEmbeddingModel] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [showValidationAlert, setShowValidationAlert] = React.useState(false)
  const [validationMessage, setValidationMessage] = React.useState("")

  const tryCreateAgent = async (
    name: string,
    description: string,
    embeddingModel: string,
    model: LLM | null
  ): Promise<AgentUIState | null> => {
    try {
      return await agentsClient.createNewAgent(name, description, embeddingModel, model)
    } catch (e) {
      alert("Failed to create a new agent: " + e)
      console.error(e)
      return null
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (loading) return

    // Validate model is selected
    if (!model) {
      setValidationMessage("Please select a language model before creating the agent.")
      setShowValidationAlert(true)
      return
    }

    // Validate embedding model is selected
    if (!embeddingModel) {
      setValidationMessage("Please select an embedding model before creating the agent.")
      setShowValidationAlert(true)
      return
    }

    setLoading(true)

    const agent = await tryCreateAgent(name, description, embeddingModel, model)
    if (agent) {
      // Agent is created with the model already included
      onCreate(agent)
    }
    setIcon("")
    setName("")
    setDescription("")
    setModel(null)
    setEmbeddingModel(null)
    onClose()
    setLoading(false)
  }

  if (!open) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center bg-black/40"
      )}
    >
      <div className={cn("bg-background rounded-lg shadow-lg p-6 w-full max-w-md")}>
        <h2 className={cn("text-lg font-semibold mb-4")}>Create Agent</h2>
        <form onSubmit={handleSubmit} className={cn("space-y-4")}>
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="space-y-2">
            <Label htmlFor="model">Language Model</Label>
            <SelectModel selectedModel={model} onChange={(model) => setModel(model)} />
            <p className="text-sm text-muted-foreground">
              The language model that will generate responses for this agent.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="embedding-model">Embedding Model</Label>
            <SelectEmbedding
              selectedEmbedding={embeddingModel}
              onChange={(embedding) => setEmbeddingModel(embedding)}
              required
            />
            <p className="text-sm text-muted-foreground">
              The embedding model is used to determine which documents from the knowledge base are
              relevant to the conversation.
            </p>
          </div>
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
              className={cn(
                "px-4 py-2 rounded-md bg-primary text-primary-foreground cursor-pointer"
              )}
            >
              Create
            </button>
          </div>
        </form>
      </div>

      <AlertDialog open={showValidationAlert} onOpenChange={setShowValidationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Required Field Missing</AlertDialogTitle>
            <AlertDialogDescription>{validationMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowValidationAlert(false)}
              className="cursor-pointer"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
