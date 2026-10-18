"use client";
import { AccessKeyPublic } from "@/app/(main)/agents/agent_data";
import { AccessKeyCard } from "@/components/agent-configuration/access-key-card";
import { AccessKeyModal } from "@/components/agent-configuration/access-key-modal";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export interface AccessKeyPageProps {
  agentId: string;
}

export default function AccessKeysPage({ agentId }: AccessKeyPageProps) {
  const [showAccessKeyModal, setShowAccessKeyModal] = useState<boolean>(false);
  const [accessKeys, setAccessKeys] = useState<AccessKeyPublic[]>([]);
  // Todo : to be fixed in a larger refactor by mathias, hardcoded for now

  useEffect(() => {
    const getAccessKeys = async () => {
      try {
        const response = await axios.get("/api/fetch-access-keys", {
          params: { agentId },
        });
        setAccessKeys(response.data as AccessKeyPublic[]);
      } catch (error) {
        console.error("Could not fetch access keys:", error);
      }
    };
    getAccessKeys();
  }, [agentId]);

  const onRevoke = (accessKey: AccessKeyPublic) => {
    setAccessKeys((prev) => prev.filter((ak) => ak.id !== accessKey.id));
  };

  const onKeyAdded = (accessKey: AccessKeyPublic) => {
    setAccessKeys((prev) => [accessKey, ...prev]);
  };

  return (
    <div className="space-y-6">
      <AccessKeyModal
        agentId={agentId}
        open={showAccessKeyModal}
        onKeyAdded={onKeyAdded}
        onClose={() => setShowAccessKeyModal(false)}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Manage your Access keys</p>
        </div>
        <Button onClick={() => setShowAccessKeyModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Access Key
        </Button>
      </div>

      <div className="grid gap-4">
        {accessKeys.map((accessKey) => (
          <AccessKeyCard
            key={accessKey.id}
            accessKey={accessKey}
            onRevoke={(accessKey: AccessKeyPublic) => {
              onRevoke(accessKey);
            }}
            agentId={agentId}
          />
        ))}
      </div>
    </div>
  );
}
