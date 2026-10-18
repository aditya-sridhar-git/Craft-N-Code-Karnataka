import type { Metadata } from "next";
import { LoginPage } from "@/frontend/features/login/LoginPage";

export const metadata: Metadata = { title: "Log in" };

export default function LoginRoute() {
  return <LoginPage initial="student" />;
}
