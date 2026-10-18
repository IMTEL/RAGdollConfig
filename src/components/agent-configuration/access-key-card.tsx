import { AccessKeyPublic } from "@/app/(main)/agents/agent_data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Copy, Key } from "lucide-react";
import { useState } from "react";

export interface AccessKeyCardProps {
  accessKey: AccessKeyPublic;
  onRevoke(accessKey: AccessKeyPublic): void;
  agentId: string;
}

/**
 * One access key in the list. Only metadata is shown: view-once keys are
 * stored hashed and were visible once, when created. Revealable keys (created
 * with "allow showing again") get a Show button that fetches the key.
 */
export function AccessKeyCard({
  accessKey,
  onRevoke,
  agentId,
}: AccessKeyCardProps) {
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);

  const getStatus = () => {
    if (!accessKey.expiry_date) return true;
    return new Date(accessKey.expiry_date).getTime() > Date.now();
  };

  const tryRevokeKey = async () => {
    try {
      await axios.get("/api/revoke-access-key", {
        params: { agentId, accessKeyId: accessKey.id },
      });
      onRevoke(accessKey);
    } catch (error) {
      console.error("Failed to revoke access key:", error);
      alert("An error occured while trying to revoke an access key");
    }
  };

  const toggleReveal = async () => {
    if (revealedKey) {
      setRevealedKey(null);
      setCopied(false);
      return;
    }
    setRevealing(true);
    try {
      const response = await axios.get("/api/reveal-access-key", {
        params: { agentId, accessKeyId: accessKey.id },
      });
      setRevealedKey((response.data as { key: string }).key);
    } catch (error) {
      const detail = axios.isAxiosError(error) && error.response?.data?.detail;
      console.error("Failed to reveal access key:", error);
      alert(
        typeof detail === "string"
          ? detail
          : "An error occured while trying to show the access key"
      );
    } finally {
      setRevealing(false);
    }
  };

  const copyRevealedKey = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy access key:", error);
      alert("Could not copy the key. Select it and copy it manually.");
    }
  };

  return (
    <div className="hover:bg-accent/50 space-y-4 rounded-lg border p-6 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Key className="text-muted-foreground h-5 w-5" />
            <h3 className="text-lg font-semibold">{accessKey.name}</h3>
            <Badge variant={getStatus() ? "default" : "secondary"}>
              {getStatus() ? "Active" : "Expired"}
            </Badge>
          </div>
          <div className="text-muted-foreground font-mono text-sm">
            {accessKey.prefix ? `${accessKey.prefix}…` : "Prefix unavailable"}
          </div>
        </div>
        <div className="flex gap-2">
          {accessKey.revealable && (
            <Button
              variant="outline"
              size="sm"
              disabled={revealing}
              onClick={() => {
                toggleReveal();
              }}
            >
              {revealedKey ? "Hide" : revealing ? "Loading…" : "Show"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => {
              tryRevokeKey();
            }}
          >
            Revoke
          </Button>
        </div>
      </div>

      {revealedKey && (
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={revealedKey}
            className="font-mono"
            onFocus={(e) => e.currentTarget.select()}
            aria-label={`Access key ${accessKey.name}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyRevealedKey}
            aria-label="Copy access key"
          >
            <Copy className="mr-1 h-4 w-4" />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}

      <div className="text-muted-foreground flex items-center gap-6 text-sm">
        <div>
          Expiry date:{" "}
          {accessKey.expiry_date
            ? new Date(accessKey.expiry_date).toDateString()
            : "None"}
        </div>
        <div>
          Created:{" "}
          {accessKey.created ? new Date(accessKey.created).toDateString() : ""}
        </div>
        <div>
          Last used:{" "}
          {accessKey.last_use
            ? new Date(accessKey.last_use).toDateString()
            : "Never used"}
        </div>
      </div>
    </div>
  );
}
