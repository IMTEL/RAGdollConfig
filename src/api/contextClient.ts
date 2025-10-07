export interface Context {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: "processing" | "ready" | "error";
}