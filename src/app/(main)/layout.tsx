"use client";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
// Redirects to /login when an /api/* call returns 401 (session expired).
import "@/lib/session-expiry";

/**export const metadata: Metadata = {
  title: "RAGdoll Config",
  description: "Configuration interface for RAGdoll",
};*/

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
