"use client";
import { AgentUIState } from "@/app/agents/agent_data";
import axios from 'axios';
import { Bot } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { AccessKey } from "./access-key-card";

const CHAT_WEBSITE_URL = process.env.NEXT_PUBLIC_CHAT_WEBSITE_URL || "http://localhost:3001";
const RAGDOLL_BASE_URL = process.env.NEXT_PUBLIC_RAGDOLL_BASE_URL || "http://localhost:8000";

interface TestAgentProps {
    agent: AgentUIState
}

export function TestAgent({ agent }: TestAgentProps) {

    const getExpiryTime = () => {
        const today = new Date()
        return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
    }

    const getToday = () => {
        const today = new Date()
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }


    const getAccessKeys = async () => {
        const params = new URLSearchParams({ agent_id: agent.id });

        const response = await axios.get(RAGDOLL_BASE_URL + `/get-accesskeys?${params.toString()}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 200) {
            console.error("Could not fetch  access-keys : " + response.status.toString())
            throw Error("Failed to fectch access-keys")
        }
        return response.data as AccessKey[];
    }

    const createNewAccessKey = async (): Promise<AccessKey> => {
        var params = new URLSearchParams({
            name: "Test-Agent-Access-Key",
            agent_id: agent.id,
            expiry_date: getExpiryTime().toISOString()

        });
        const response = await axios.get(
            RAGDOLL_BASE_URL + `/new-accesskey?${params.toString()}`,
            {
                headers: {
                    "Content-Type": "application/json",
                }
            }
        );

        if (response.status !== 200) {
            console.error("Failed to create access key:", response.statusText);
            throw new Error("Failed to create access token")
        }

        const accessKey = response.data as AccessKey;
        localStorage.setItem("test_accesskey", JSON.stringify(accessKey))
        return accessKey;
    }

    const revokeTestKey = async (accessKeyId: string | null) => {
        if (accessKeyId == null) {
            console.warn("Stored accesskey did not have an id")
            return
        }
        var params = new URLSearchParams({
            access_key_id: accessKeyId,
            agent_id: agent.id,
        });
        const response = await axios.get(
            RAGDOLL_BASE_URL + `/revoke-accesskey${params.toString()}`,
            {
                headers: {
                    "Content-Type": "application/json",
                }
            }
        );
        if (response.status !== 200) {
            console.warn("Did not manage to delete old test access-key, is it deleted already?")
        }
    }

    const getValidAccessKey = async (): Promise<AccessKey> => {
        const accessKeyString: string | null = localStorage.getItem('test_accesskey')

        if (!accessKeyString)
            return await createNewAccessKey()
        const accessKey: AccessKey = JSON.parse(accessKeyString);

        if (!accessKey.expiry_date || (accessKey.expiry_date && new Date(accessKey.expiry_date).getTime() <= getToday().getTime())) {
            revokeTestKey(accessKey.id)
            return await createNewAccessKey()
        }

        const accessKeys = await getAccessKeys()
        if (accessKeys.filter(key => { key.id == accessKey.id }).length == 0)
            return await createNewAccessKey()

        return accessKey
    }

    const handleTestAgent = async () => {
        const accessKey = await getValidAccessKey()
        console.log('Testing agent:', agent.name, 'with ID:', agent.databaseId);
        try {
            const chatUrl = `${CHAT_WEBSITE_URL}/agent=${agent.databaseId},key=${accessKey.key}`;
            window.open(chatUrl, '_blank');
        } catch (error) {
            console.error('Error launching chat:', error);
            alert('Failed to launch chat interface. Please try again.');
        }
    };

    useEffect(() => {
    }, []);

    return (
        <Button variant="outline" onClick={handleTestAgent}>
            <Bot className="mr-2 h-4 w-4" />
            Test Agent
        </Button>
    );
}
