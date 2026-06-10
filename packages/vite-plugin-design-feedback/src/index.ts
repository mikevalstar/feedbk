import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import MagicString from "magic-string";
import type { HtmlTagDescriptor, Plugin, PluginOption } from "vite";

export type DesignFeedbackPluginOptions = {
  projectKey: string;
  apiUrl: string;
  enabled?: boolean;
};

const VIRTUAL_ID = "virtual:design-feedback-client";
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;
// How Vite encodes \0-prefixed ids in browser URLs.
const DEV_CLIENT_URL = `/@id/__x00__${VIRTUAL_ID}`;

function resolveClientBundlePath(): string {
  // Monorepo dev: resolve the live sibling workspace bundle, so the
  // watch-build rebuild loop in configureServer keeps invalidating + reloading.
  const require = createRequire(import.meta.url);
  try {
    return require.resolve("@repo/feedback-client/bundle");
  } catch {
    // Consumer install: @repo/feedback-client is NOT a runtime dependency.
    // The plugin's build step (scripts/copy-client.mjs) copies the prebuilt
    // IIFE next to this module, so the plugin ships fully self-contained.
    const bundled = fileURLToPath(new URL("./feedback-client.iife.js", import.meta.url));
    if (existsSync(bundled)) return bundled;
    throw new Error(
      "[design-feedback] Could not resolve the feedback client bundle. " +
        "Expected a sibling @repo/feedback-client (monorepo dev) or a bundled " +
        "feedback-client.iife.js next to the plugin (published/git build).",
    );
  }
}

function readClientBundle(): string {
  return readFileSync(resolveClientBundlePath(), "utf8");
}

/** Strip Vite's query suffix (?v=, ?import, etc.) and return the on-disk path. */
function cleanId(id: string): string {
  return id.split("?")[0] ?? id;
}

/** Walk a Babel AST, calling `visit` on every node. Intentionally tiny — no
 * @babel/traverse, which has awkward ESM/CJS interop. */
function walk(node: unknown, visit: (n: Record<string, unknown>) => void): void {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  if (typeof n.type !== "string") return;
  visit(n);
  for (const key in n) {
    if (key === "loc" || key === "start" || key === "end" || key === "range") continue;
    const child = n[key];
    if (Array.isArray(child)) {
      for (const c of child) walk(c, visit);
    } else if (child && typeof child === "object") {
      walk(child, visit);
    }
  }
}

/**
 * AST-based component tagger.
 *
 * Stamps every JSX opening element with
 *   data-ref="src/components/X.tsx#L<start>-<end>"
 * — the attribute the feedback client uses to pick components and anchor
 * comments (capitalized basename of the path = component name).
 *
 * This replaces the old regex/line-based `vite-plugin-component-tagger`, which
 * was written for Svelte and mistook lowercase TypeScript generics
 * (useState<boolean>, Record<string, T>) for JSX elements, corrupting files and
 * forcing a coordinate-only fallback. A real parser never confuses generics
 * with JSX, so tagging is reliable and nothing falls back. We inject by source
 * position with magic-string (and emit a sourcemap) rather than regenerating
 * the file, so formatting and line numbers are preserved for downstream plugins.
 */
function createTagger(): Plugin {
  let root = process.cwd();
  return {
    name: "design-feedback:component-tagger",
    // Must run before @vitejs/plugin-react so it sees raw JSX and true source line numbers.
    enforce: "pre",
    configResolved(config) {
      root = config.root;
    },
    transform(code, rawId) {
      const id = cleanId(rawId);
      // Only React source files; never the feedback client or virtual modules.
      if (!/\.[jt]sx$/.test(id)) return null;
      if (rawId.startsWith("\0") || id.includes("feedback-client") || id.includes("node_modules")) {
        return null;
      }

      let ast: ReturnType<typeof parse>;
      try {
        ast = parse(code, {
          sourceType: "module",
          // Cover the common React + TS surface; unknown syntax just throws and
          // we skip the file (rare, and it still works via coordinate fallback).
          plugins: ["jsx", "typescript", "decorators-legacy", "importAttributes", "explicitResourceManagement"],
        });
      } catch {
        return null;
      }

      const rel = relative(root, id).split("\\").join("/");
      const s = new MagicString(code);
      let tagged = 0;

      walk(ast.program, (n) => {
        if (n.type !== "JSXOpeningElement") return;
        const name = n.name as Record<string, unknown> | undefined;
        const loc = n.loc as { start: { line: number }; end: { line: number } } | undefined;
        const nameEnd = name?.end as number | undefined;
        if (typeof nameEnd !== "number" || !loc) return;
        // Insert right after the tag name: <div| className> -> <div data-ref="…" className>
        s.appendLeft(nameEnd, ` data-ref="${rel}#L${loc.start.line}-${loc.end.line}"`);
        tagged++;
      });

      if (tagged === 0) return null;
      return { code: s.toString(), map: s.generateMap({ hires: true }) };
    },
  };
}

/** Injects the feedback client bundle + runtime config into index.html. */
function createInjector(options: DesignFeedbackPluginOptions): Plugin {
  let isBuild = false;

  return {
    name: "design-feedback:inject",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    resolveId(id) {
      if (id === VIRTUAL_ID || id === `/${VIRTUAL_ID}`) return RESOLVED_VIRTUAL_ID;
      return null;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) return readClientBundle();
      return null;
    },
    configureServer(server) {
      // The client bundle is prebuilt; when its watch-build rewrites it,
      // invalidate the virtual module and reload the page.
      let bundlePath: string;
      try {
        bundlePath = resolveClientBundlePath();
      } catch {
        return; // surfaced later with a clear error when the page loads
      }
      server.watcher.add(bundlePath);
      server.watcher.on("change", (file) => {
        if (file !== bundlePath) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      });
    },
    transformIndexHtml: {
      order: "pre",
      handler(): HtmlTagDescriptor[] {
        const config = JSON.stringify({ projectKey: options.projectKey, apiUrl: options.apiUrl });
        const tags: HtmlTagDescriptor[] = [
          {
            tag: "script",
            children: `window.__DESIGN_FEEDBACK_CONFIG__ = ${config};`,
            injectTo: "head",
          },
        ];
        if (isBuild) {
          // Inline the prebuilt IIFE; escape so embedded "</script>" strings can't close the tag.
          tags.push({
            tag: "script",
            children: readClientBundle().replace(/<\/script/gi, "<\\/script"),
            injectTo: "body",
          });
        } else {
          tags.push({
            tag: "script",
            attrs: { type: "module", src: DEV_CLIENT_URL },
            injectTo: "body",
          });
        }
        return tags;
      },
    },
  };
}

/**
 * Design-feedback Vite plugin.
 *
 * Composes the real `vite-plugin-component-tagger` (which tags component root
 * elements with data-ref attributes) with an injector that mounts the feedback
 * UI and points it at the feedback backend.
 *
 * Place before react() in the plugins array:
 *   plugins: [designFeedback({ ... }), react()]
 */
export default function designFeedback(options: DesignFeedbackPluginOptions): PluginOption {
  if (!options?.projectKey || !options?.apiUrl) {
    throw new Error("[design-feedback] projectKey and apiUrl are required");
  }
  if (options.enabled === false) {
    return []; // fully disabled: no tagging, no injected UI
  }
  return [createTagger(), createInjector(options)];
}
