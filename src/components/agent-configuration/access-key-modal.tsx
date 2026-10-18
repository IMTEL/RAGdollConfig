import {
  AccessKeyCreated,
  AccessKeyPublic,
} from "@/app/(main)/agents/agent_data";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, Copy } from "lucide-react";

import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useRef, useState } from "react";
import { Label } from "../ui/label";
import axios from "axios";

export function AccessKeyModal({
  open,
  onClose,
  onKeyAdded,
  agentId,
}: {
  open: boolean;
  onClose: () => void;
  onKeyAdded: (accessKey: AccessKeyPublic) => void;
  agentId: string;
}) {
  const [name, setName] = useState<string>("");
  const [dateOpen, setDateOpen] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  // Off by default: the key is then shown once, here, and the backend only
  // stores its hash. On: the key can be shown again from the key list.
  const [allowReveal, setAllowReveal] = useState(false);
  // The key just created, with its plaintext.
  const [createdKey, setCreatedKey] = useState<AccessKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  const getTommorow = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  };

  const tommorrow = useRef<Date>(getTommorow());

  const tryCreateAccessKey = async (
    name: string,
    expiry_date: Date | null,
    viewOnce: boolean
  ): Promise<AccessKeyCreated | null> => {
    try {
      const response = await axios.get("/api/new-access-key", {
        params: {
          accessKeyName: name,
          agentId,
          expiryDate: expiry_date ? expiry_date.toISOString() : undefined,
          viewOnce,
        },
      });
      return response.data as AccessKeyCreated;
    } catch (error) {
      console.error("Failed to create access key:", error);
      alert("An error occured while trying to create an access key");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await tryCreateAccessKey(name, date, !allowReveal);
    setName("");
    setDate(null);
    setAllowReveal(false);
    if (!created) {
      onClose();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key, ...publicFields } = created;
    onKeyAdded(publicFields);
    setCopied(false);
    setCreatedKey(created);
  };

  const copyCreatedKey = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy access key:", error);
      alert("Could not copy the key. Select it and copy it manually.");
    }
  };

  const closeCreatedKey = () => {
    setCreatedKey(null);
    setCopied(false);
    onClose();
  };

  if (!open) return null;

  if (createdKey) {
    return (
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 left-0 z-50 flex min-h-screen items-center justify-center bg-black/40"
        )}
      >
        <div
          className={cn(
            "bg-background w-full max-w-md space-y-4 rounded-lg p-6 shadow-lg"
          )}
        >
          <h2 className={cn("text-lg font-semibold")}>Access key created</h2>
          <p className="text-sm">
            {createdKey.revealable
              ? "Copy this key now. You can also show it again later from the key list."
              : "Copy this key now. You won't be able to see it again."}
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={createdKey.key}
              className="font-mono"
              onFocus={(e) => e.currentTarget.select()}
              aria-label="New access key"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyCreatedKey}
              aria-label="Copy access key"
            >
              <Copy className="mr-1 h-4 w-4" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className={cn("flex justify-end")}>
            <Button type="button" onClick={closeCreatedKey}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed top-0 right-0 bottom-0 left-0 z-50 flex min-h-screen items-center justify-center bg-black/40"
      )}
    >
      <div
        className={cn("bg-background w-full max-w-md rounded-lg p-6 shadow-lg")}
      >
        <h2 className={cn("mb-4 text-lg font-semibold")}>Create Access key</h2>
        <form onSubmit={handleSubmit} className={cn("space-y-4")}>
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Label htmlFor="date" className="px-1">
            Expiry date (optional)
          </Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date"
                className="w-48 justify-between font-normal"
              >
                {date ? date.toLocaleDateString() : "Select date"}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date ?? undefined}
                captionLayout="dropdown"
                hidden={{ before: tommorrow.current }}
                endMonth={new Date(tommorrow.current.getFullYear() + 100, 0)}
                onSelect={(date) => {
                  if (!date) {
                    setDate(null);
                    return;
                  }
                  const newDate = new Date(
                    Date.UTC(
                      date?.getFullYear(),
                      date?.getMonth(),
                      date?.getDate()
                    )
                  );
                  setDate(newDate);
                  setDateOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-start gap-2 px-1">
            <Checkbox
              id="allow-reveal"
              checked={allowReveal}
              onCheckedChange={(checked) => setAllowReveal(checked === true)}
            />
            <div className="grid gap-1">
              <Label htmlFor="allow-reveal">
                Allow showing this key again later
              </Label>
              <p className="text-muted-foreground text-xs">
                Off: the key is shown only once, now. On: owners and
                collaborators can show it again from the key list.
              </p>
            </div>
          </div>

          <div className={cn("flex justify-end gap-2")}>
            <button
              type="button"
              className={cn(
                "bg-muted text-foreground hover:bg-muted/80 cursor-pointer rounded-md px-4 py-2 transition-colors"
              )}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-md px-4 py-2 transition-colors"
              )}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
