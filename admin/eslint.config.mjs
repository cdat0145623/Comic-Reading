import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: currentDirectory });

const eslintConfig = [
    ...compat.extends("next/core-web-vitals"),
    {
        ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
    },
];

export default eslintConfig;
