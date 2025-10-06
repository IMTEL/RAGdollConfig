import { Key, Plus, Eye, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ApiKey {
  id: number;
  name: string;
  key: string;
  lastUsed: string;
  created: string;
  status: "active" | "inactive";
  permissions: string[];
}

interface ApiKeyCardProps {
  apiKey: ApiKey;
}

function ApiKeyCard({ apiKey }: ApiKeyCardProps) {
  return (
    <div className="rounded-lg border p-6 space-y-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{apiKey.name}</h3>
            <Badge
              variant={apiKey.status === "active" ? "default" : "secondary"}
            >
              {apiKey.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-muted-foreground">{apiKey.key}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive">
            Revoke
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div>Created: {apiKey.created}</div>
        <div>Last used: {apiKey.lastUsed}</div>
        <div className="flex gap-1">
          Permissions:
          {apiKey.permissions.map((permission) => (
            <Badge key={permission} variant="outline" className="text-xs">
              {permission}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  // Mock data for demonstration
  const apiKeys: ApiKey[] = [
    {
      id: 1,
      name: "Production API Key",
      key: "sk-proj-abc123...xyz789",
      lastUsed: "2 minutes ago",
      created: "2024-01-15",
      status: "active",
      permissions: ["read", "write"],
    },
    {
      id: 2,
      name: "Development API Key",
      key: "sk-dev-def456...uvw012",
      lastUsed: "1 hour ago",
      created: "2024-01-10",
      status: "active",
      permissions: ["read"],
    },
    {
      id: 3,
      name: "Legacy API Key",
      key: "sk-old-ghi789...rst345",
      lastUsed: "30 days ago",
      created: "2023-12-01",
      status: "inactive",
      permissions: ["read", "write"],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys and access permissions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Generate API Key
        </Button>
      </div>

      <div className="grid gap-4">
        {apiKeys.map((apiKey) => (
          <ApiKeyCard key={apiKey.id} apiKey={apiKey} />
        ))}
      </div>
    </div>
  );
}
