import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Eye, Key } from "lucide-react";
import { useState } from "react";
import { fa } from "zod/v4/locales";
const RAGDOLL_BASE_URL = process.env.NEXT_PUBLIC_RAGDOLL_BASE_URL;

export interface AccessKey {
    id: string | null
    key: string | null
    name: string | null
    expiery_date: Date | null
    created: Date | null
    last_use: Date | null
}

export interface AccessKeyCardProps {
    accessKey: AccessKey,
    onRevoke(accessKey: AccessKey): void,
    agentId: string
}

export function AccessKeyCard({ accessKey, onRevoke, agentId }: AccessKeyCardProps) {

    const [displayAccessKey, setDisplayAccessKey] = useState<Boolean>(false)


    const getStatus = () => {
        if (!accessKey.expiery_date) return true
        return accessKey.expiery_date.getTime() < Date.now()
    }

    const tryRevokeKey = async () => {
        if (!accessKey.id) {
            console.error("Id of access key is null")
            return
        }

        const params = new URLSearchParams({
            access_key_id: accessKey.id ?? "",
            agent_id: agentId
        });

        const response = await fetch(RAGDOLL_BASE_URL + `/revoke-accesskey?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 200) {
            console.log("An error occured when trying to revoke acces key: " + response.status.toString())
            alert("An error occured while trying to revoke an access key");
        }
        onRevoke(accessKey)
    }

    const copyKey = () => {
        if (accessKey.key == null) {
            console.error("access key does not contain a key!")
            return
        }
        navigator.clipboard.writeText(accessKey.key)
         alert("Accesskey copied");
    }


    return (
        <div className="rounded-lg border p-6 space-y-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">{accessKey.name}</h3>
                        <Badge
                            variant={getStatus() ? "default" : "secondary"}
                        >
                            {getStatus() ? "Active" : "Expired"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-muted-foreground">{displayAccessKey ? accessKey.key : "*************"}</span>
                        <Button onClick={copyKey} variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Copy className="h-3 w-3" />
                        </Button>
                        <Button onClick={() => setDisplayAccessKey(!displayAccessKey)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/*<Button variant="outline" size="sm">
                        Edit
                    </Button>*/}
                    <Button variant="outline" size="sm" className="text-destructive"
                        onClick={() => { tryRevokeKey() }}
                    >
                        Revoke
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div>Created: {accessKey?.created ? new Date(accessKey.created).toDateString() : ""}</div>
                <div>Last used: {accessKey?.last_use ? new Date(accessKey.last_use).toDateString() : ""}</div>
                <div className="flex gap-1">
                </div>
            </div>
        </div>
    );
}