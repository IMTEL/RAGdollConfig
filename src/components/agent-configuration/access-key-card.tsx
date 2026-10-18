import { AccessKeyPublic } from "@/app/(main)/agents/agent_data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Key } from "lucide-react";

export interface AccessKeyCardProps {
  accessKey: AccessKeyPublic;
  onRevoke(accessKey: AccessKeyPublic): void;
  agentId: string;
}

/**
 * One access key in the list. Only metadata is shown: the key itself is
 * stored hashed and is visible once, when it is created.
 */
export function AccessKeyCard({
  accessKey,
  onRevoke,
  agentId,
}: AccessKeyCardProps) {
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
