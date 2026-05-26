import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "**/dist/",
      "node_modules/",
      "**/node_modules/",
      ".nuxt/",
      "**/.nuxt/",
      ".vercel/",
      "**/.vercel/",
      ".output/",
      "**/.output/",
      "**/*.cjs",
      "**/*.mjs",
      "coverage/",
      "**/coverage/",
      "**/vowwch.ts",
      "**/tsup.config.ts",
      "**/vitest.config.ts",
      "examples/**",
    ],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname as string,
      },
    },
    rules: {
      "no-console": ["error", { allow: ["error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
    },
  },
  {
    files: ["examples/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["apps/docs/**"],
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
)
