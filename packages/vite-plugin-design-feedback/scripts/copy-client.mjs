// Copies the prebuilt feedback-client IIFE bundle into this plugin's own dist
// so the published/git-installed plugin is fully self-contained — consumers
// install only @repo/vite-plugin-design-feedback, with no workspace: dependency
// on @repo/feedback-client leaking into their project.
//
// @repo/feedback-client is a devDependency here: it resolves during the build
// (in the monorepo, or in the full repo clone pnpm makes for a git install),
// but is never a runtime dependency of consumers.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const src = require.resolve("@repo/feedback-client/bundle");

const distDir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
mkdirSync(distDir, { recursive: true });
const dest = join(distDir, "feedback-client.iife.js");

copyFileSync(src, dest);
console.log(`[design-feedback] bundled feedback client -> ${dest}`);
