"use client";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";

/**export const metadata: Metadata = {
  title: "RAGdoll Config",
  description: "Configuration interface for RAGdoll",
};*/

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
