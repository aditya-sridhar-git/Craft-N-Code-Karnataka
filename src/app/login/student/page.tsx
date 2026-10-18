import type { Metadata } from "next";
import { LoginPage } from "@/frontend/features/login/LoginPage";

export const metadata: Metadata = { title: "Student log in" };

export default function StudentLoginPage() {
  return <LoginPage initial="student" />;
}
