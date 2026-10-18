import type { Metadata } from "next";
import { LoginPage } from "@/frontend/features/login/LoginPage";

export const metadata: Metadata = { title: "Teacher sign-in" };

export default function TeacherLoginPage() {
  return <LoginPage initial="teacher" />;
}
