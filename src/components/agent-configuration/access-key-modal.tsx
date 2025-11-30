import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { AccessKey } from "./access-key-card";
import { useRef, useState } from "react";
import { Label } from "../ui/label";
import axios from "axios";

const RAGDOLL_BASE_URL =
  process.env.NEXT_PUBLIC_RAGDOLL_BASE_URL || "http://localhost:8000";
const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/app";
const appApi = (path: string) => `${APP_BASE_PATH}${path}`;

export function AccessKeyModal({
  open,
  onClose,
  onKeyAdded,
  agentId,
}: {
  open: boolean;
  onClose: () => void;
  onKeyAdded: (accessKey: AccessKey) => void;
  agentId: string;
}) {
  const [name, setName] = useState<string>("");
  const [dateOpen, setDateOpen] = useState(false);
  const [date, setDate] = useState<Date | null>(null);

  const getTommorow = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  };

  const tommorrow = useRef<Date>(getTommorow());

  const tryCreateAccessKey = async (
    name: string,
    expiry_date: Date | null
  ): Promise<AccessKey | null> => {
    const params = new URLSearchParams({
      name: name,
      agent_id: agentId,
    });
    if (expiry_date) params.set("expiry_date", expiry_date.toISOString());

    console.log(params);

    const response = await axios.get(appApi("/api/new-access-key"), {
      params: {
        accessKeyName: name,
        expiryDate: expiry_date,
        agentId: agentId,
      },
    });

    if (response.status !== 200) {
      // TODO : Feedback to user
      console.error("Failed to create access key:", response.statusText);
      alert("Failed to create access key:: " + response.statusText);
      return null;
    }

    try {
      const accessKey = (await response.data) as AccessKey;
      return accessKey;
    } catch (e) {
      console.error("Failed to create access key:", response.statusText);
      alert("An error occured while trying to create an access key");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accesskey: AccessKey | null = await tryCreateAccessKey(name, date);
    setName("");
    setDate(null);
    if (accesskey) onKeyAdded(accesskey);
    onClose();
  };

  if (!open) return null;

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
