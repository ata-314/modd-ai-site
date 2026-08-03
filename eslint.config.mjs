import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Animation-heavy files: R3F mutates three.js objects per-frame and
    // device/SSR detection sets state once on mount — both idiomatic here.
    files: [
      "components/three/**",
      "components/sections/Hero.tsx",
      "components/sections/Process.tsx",
      "components/sections/Showreel.tsx",
    ],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
