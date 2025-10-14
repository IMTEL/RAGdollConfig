"use client"
import { AccessKey, AccessKeyCard } from "@/components/agent-configuration/access-key-card";
import { AccessKeyModal } from "@/components/agent-configuration/access-key-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL

export interface AccessKeyPageProps {
  agentId: string
}


export default function AccessKeysPage({ agentId }: AccessKeyPageProps) {

  const [showAccessKeyModal, setShowAccessKeyModal] = useState<boolean>(false)
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([])
  // Todo : to be fixed in a larger refactor by mathias, hardcoded for now

  useEffect(() => {
    const getAccessKeys = async () => {
      const params = new URLSearchParams({ agent_id: agentId });

      const response = await fetch(BACKEND_API_URL + `/get-accesskeys?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Could not fetch  access-keys : " + response.status.toString())
        return
      }

      try {
        const accessKey = await response.json() as AccessKey[]
        setAccessKeys(accessKey)
      } catch (e) {
        console.error("Failed to fetch access key:", response.statusText);
      }
    }
    getAccessKeys()

  }, []);

  const onRevoke = (accessKey: AccessKey) => {
    const newAccessKeys: AccessKey[] = accessKeys.filter((ak: AccessKey) => {
      return ak !== accessKey
    })
    setAccessKeys(newAccessKeys)
  }

  const onKeyAdded = (accessKey: AccessKey) => {
    setAccessKeys([accessKey, ...accessKeys])
  }

  return (
    <div className="space-y-6">

      < AccessKeyModal
        agentId={agentId}
        open={showAccessKeyModal}
        onKeyAdded={onKeyAdded}
        onClose={() => setShowAccessKeyModal(false)}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Manage your Access keys
          </p>
        </div>
        <Button
          onClick={() => setShowAccessKeyModal(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Generate Access Key
        </Button>


      </div>

      <div className="grid gap-4">
        {accessKeys.map((accessKey) => (
          <AccessKeyCard
            key={accessKey.id}
            accessKey={accessKey}
            onRevoke={(accessKey: AccessKey) => { onRevoke(accessKey) }}
            agentId={agentId} />
        ))}
      </div>
    </div>
  );
}
