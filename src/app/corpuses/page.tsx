import { Database, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Corpus {
  id: number;
  name: string;
  description: string;
  documents: number;
  size: string;
  lastSync: string;
  status: "synced" | "outdated";
}

interface CorpusCardProps {
  corpus: Corpus;
}

function CorpusCard({ corpus }: CorpusCardProps) {
  return (
    <div className="rounded-lg border p-6 space-y-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{corpus.name}</h3>
            <Badge
              variant={corpus.status === "synced" ? "default" : "destructive"}
            >
              {corpus.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{corpus.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Sync
          </Button>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          {corpus.documents} documents
        </div>
        <div>{corpus.size}</div>
        <div>Last sync: {corpus.lastSync}</div>
      </div>
    </div>
  );
}

export default function CorpusesPage() {
  // Mock data for demonstration
  const corpuses: Corpus[] = [
    {
      id: 1,
      name: "Product Documentation",
      description: "Complete product documentation and user guides",
      documents: 247,
      size: "15.2 MB",
      lastSync: "1 hour ago",
      status: "synced",
    },
    {
      id: 2,
      name: "FAQ Database",
      description: "Frequently asked questions and answers",
      documents: 89,
      size: "3.8 MB",
      lastSync: "3 hours ago",
      status: "synced",
    },
    {
      id: 3,
      name: "Technical Specifications",
      description: "Technical specifications and API documentation",
      documents: 156,
      size: "8.7 MB",
      lastSync: "2 days ago",
      status: "outdated",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Corpuses</h1>
          <p className="text-muted-foreground">
            Manage your knowledge bases and document collections
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Corpus
        </Button>
      </div>

      <div className="grid gap-4">
        {corpuses.map((corpus) => (
          <CorpusCard key={corpus.id} corpus={corpus} />
        ))}
      </div>
    </div>
  );
}
