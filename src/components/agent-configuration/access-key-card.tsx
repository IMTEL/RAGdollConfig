import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Copy, Eye, Key } from "lucide-react";
import { useState } from "react";
const RAGDOLL_BASE_URL =
  process.env.NEXT_PUBLIC_RAGDOLL_BASE_URL || "http://localhost:8000";

export interface AccessKey {
  id: string | null;
  key: string | null;
  name: string | null;
  expiry_date: Date | null;
  created: Date | null;
  last_use: Date | null;
}

export interface AccessKeyCardProps {
  accessKey: AccessKey;
  onRevoke(accessKey: AccessKey): void;
  agentId: string;
}

export function AccessKeyCard({
  accessKey,
  onRevoke,
  agentId,
}: AccessKeyCardProps) {
  const [displayAccessKey, setDisplayAccessKey] = useState<boolean>(false);

  const getStatus = () => {
    if (!accessKey.expiry_date) return true;
    return new Date(accessKey.expiry_date).getTime() > Date.now();
  };

  const tryRevokeKey = async () => {
    if (!accessKey.id) {
      console.error("Id of access key is null");
      return;
    }

    const response = await axios.get("/api/revoke-access-key", {
      params: { agentId: agentId, accessKeyId: accessKey.id },
    });

    if (response.status !== 200) {
      console.log(
        "An error occured when trying to revoke acces key: " +
          response.status.toString()
      );
      alert("An error occured while trying to revoke an access key");
    }
    onRevoke(accessKey);
  };

  const copyKey = () => {
    if (accessKey.key == null) {
      console.error("access key does not contain a key!");
      return;
    }
    navigator.clipboard.writeText(accessKey.key);
    alert("Accesskey copied");
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
          <div className="flex items-center gap-2 font-mono text-sm">
            {accessKey.key !== null ? (
              <div>
                <span className="text-muted-foreground">
                  {displayAccessKey ? accessKey.key : "*************"}
                </span>
                <Button
                  onClick={copyKey}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => setDisplayAccessKey(!displayAccessKey)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              "Keys can only be viewed once"
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {/*<Button variant="outline" size="sm">
                        Edit
                    </Button>*/}
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
          {accessKey?.expiry_date
            ? new Date(accessKey.expiry_date).toDateString()
            : "None"}
        </div>
        <div>
          Created:{" "}
          {accessKey?.created ? new Date(accessKey.created).toDateString() : ""}
        </div>
        <div>
          Last used:{" "}
          {accessKey?.last_use
            ? new Date(accessKey.last_use).toDateString()
            : "Never used"}
        </div>
        <div className="flex gap-1"></div>
      </div>
    </div>
  );
}
