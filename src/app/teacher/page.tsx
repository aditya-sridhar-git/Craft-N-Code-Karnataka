import type { Metadata } from "next";
import { TeacherHome } from "@/frontend/features/teacher/TeacherHome";

export const metadata: Metadata = { title: "Your classes", robots: { index: false } };

export default function TeacherPage() {
  return <TeacherHome />;
}
