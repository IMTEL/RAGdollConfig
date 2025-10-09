"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, X, Drama } from "lucide-react";
import { Role, CorpusDocument } from "@/app/agents/agent_data";

interface RoleEditorProps {
  documents?: CorpusDocument[];
}

export function RoleEditor({ documents = [] }: RoleEditorProps) {
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    prompt: "",
    documentAccess: [] as string[],
  });

  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      prompt: "",
      documentAccess: [],
    });
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      prompt: role.prompt,
      documentAccess: role.documentAccess,
    });
    setIsModalOpen(true);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(role => role.id !== roleId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRole) {
      // Update existing role
      setRoles(roles.map(role => 
        role.id === editingRole.id 
          ? { ...role, ...formData }
          : role
      ));
    } else {
      // Create new role
      const newRole: Role = {
        id: Date.now().toString(),
        ...formData,
      };
      setRoles([...roles, newRole]);
    }
    
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({
      name: "",
      prompt: "",
      documentAccess: [],
    });
  };

  const handleDocumentAccessChange = (documentId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        documentAccess: [...prev.documentAccess, documentId],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        documentAccess: prev.documentAccess.filter(id => id !== documentId),
      }));
    }
  };

  const getDocumentName = (documentId: string) => {
    return documents.find(doc => doc.id === documentId)?.name || documentId;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Roles</h3>
        <Button onClick={handleCreateRole} size="sm">
          <Plus className="size-4 mr-2" />
          Add Role
        </Button>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No roles configured yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Drama className="w-4 h-4" />
                    <CardTitle className="text-base">{role.name}</CardTitle>
                </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {role.documentAccess.length > 0 && (
                    <div className="flex flex-wrap gap-1 w-full">
                      <p className="text-sm font-medium">Documents:</p>
                      {role.documentAccess.map((docId) => (
                        <Badge key={docId} variant="secondary" className="text-xs">
                          {getDocumentName(docId)}
                        </Badge>
                      ))}
                    </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingRole ? "Edit Role" : "Create Role"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Role Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter role name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Role Prompt
                </label>
                <Textarea
                  placeholder="Enter the system prompt for this role"
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  required
                  className="min-h-24"
                />
              </div>

              {documents.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Document Access
                  </label>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {documents.map((document) => (
                      <div key={document.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={document.id}
                          checked={formData.documentAccess.includes(document.id)}
                          onCheckedChange={(checked) => 
                            handleDocumentAccessChange(document.id, checked as boolean)
                          }
                        />
                        <label 
                          htmlFor={document.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          <span className="font-medium">{document.name}</span>
                          <span className="text-muted-foreground ml-2">
                            ({document.type} • {document.size})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}