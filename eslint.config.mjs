import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Layer boundaries: shared <- frontend, shared <- backend; the two sides never import each other.
  {
    files: ["src/frontend/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["@/backend/*", "server-only"], message: "Frontend code must not import backend code." }] }] },
  },
  {
    files: ["src/backend/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["@/frontend/*"], message: "Backend code must not import frontend code." }] }] },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["@/frontend/*", "@/backend/*", "server-only"], message: "Shared code must not depend on the frontend or backend." }] }] },
  },
]);

export default eslintConfig;
