"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LogOut, Search, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CollaboratorUser {
  id: string;
  name: string | null;
  email: string | null;
  picture: string | null;
  role?: string | null;
}

interface CollaboratorsResponse {
  owner: CollaboratorUser | null;
  collaborators: CollaboratorUser[];
  current_user_id: string | null;
  is_owner: boolean;
}

interface CollaboratorsTabProps {
  agentId: string;
  onLeave: () => void;
}

function displayName(user: CollaboratorUser): string {
  return user.name || user.email || "Unnamed user";
}

function initials(user: CollaboratorUser): string {
  return displayName(user).slice(0, 2).toUpperCase();
}

export function CollaboratorsTab({ agentId, onLeave }: CollaboratorsTabProps) {
  const [collaborators, setCollaborators] =
    useState<CollaboratorsResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CollaboratorUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participantIds = useMemo(() => {
    const ids = new Set<string>();
    if (collaborators?.owner?.id) ids.add(collaborators.owner.id);
    collaborators?.collaborators.forEach((user) => ids.add(user.id));
    return ids;
  }, [collaborators]);

  const loadCollaborators = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<CollaboratorsResponse>(
        "/api/agent-collaborators",
        { params: { agentId } }
      );
      setCollaborators(response.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.detail || err.message
          : "Failed to load collaborators"
      );
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void loadCollaborators();
  }, [loadCollaborators]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await axios.get<CollaboratorUser[]>(
          "/api/search-users",
          { params: { q: query } }
        );
        setSearchResults(
          response.data.filter((user) => !participantIds.has(user.id))
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [participantIds, searchQuery]);

  const invite = async (userId: string) => {
    setError(null);
    try {
      const response = await axios.post<CollaboratorsResponse>(
        "/api/agent-collaborators",
        { user_id: userId },
        { params: { agentId } }
      );
      setCollaborators(response.data);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.detail || err.message
          : "Failed to add collaborator"
      );
    }
  };

  const remove = async (userId: string) => {
    setError(null);
    try {
      const response = await axios.delete<CollaboratorsResponse>(
        "/api/agent-collaborators",
        { params: { agentId, userId } }
      );
      setCollaborators(response.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.detail || err.message
          : "Failed to remove collaborator"
      );
    }
  };

  const leave = async () => {
    setError(null);
    try {
      await axios.post("/api/leave-agent", {}, { params: { agentId } });
      onLeave();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.detail || err.message
          : "Failed to leave agent"
      );
    }
  };

  const users = collaborators?.collaborators ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {collaborators?.owner && (
            <UserRow
              user={collaborators.owner}
              badge="Owner"
              canRemove={false}
              onRemove={() => undefined}
            />
          )}

          {loading ? (
            <div className="text-muted-foreground text-sm">Loading...</div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  badge="Collaborator"
                  canRemove={Boolean(collaborators?.is_owner)}
                  onRemove={() => remove(user.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground rounded-md border p-4 text-sm">
              No collaborators yet.
            </div>
          )}

          {collaborators && !collaborators.is_owner && (
            <Button variant="outline" onClick={leave}>
              <LogOut className="mr-2 h-4 w-4" />
              Leave Agent
            </Button>
          )}
        </CardContent>
      </Card>

      {collaborators?.is_owner && (
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, email, or username"
                className="pl-9"
              />
            </div>

            {searching && (
              <div className="text-muted-foreground text-sm">Searching...</div>
            )}

            {searchResults.length > 0 && (
              <div className="rounded-md border">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 border-b p-3 last:border-b-0"
                  >
                    <UserIdentity user={user} />
                    <Button size="sm" onClick={() => invite(user.id)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.trim().length >= 2 &&
              !searching &&
              searchResults.length === 0 && (
                <div className="text-muted-foreground rounded-md border p-4 text-sm">
                  No matching users found.
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserRow({
  user,
  badge,
  canRemove,
  onRemove,
}: {
  user: CollaboratorUser;
  badge: string;
  canRemove: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <UserIdentity user={user} />
        <Badge variant="outline">{badge}</Badge>
      </div>
      {canRemove && (
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function UserIdentity({ user }: { user: CollaboratorUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium">
        {initials(user)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{displayName(user)}</div>
        {user.email && (
          <div className="text-muted-foreground truncate text-xs">
            {user.email}
          </div>
        )}
      </div>
    </div>
  );
}
