import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { transform as esbuildTransform } from "esbuild";
import componentTagger from "vite-plugin-component-tagger";
const VIRTUAL_ID = "virtual:design-feedback-client";
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;
// How Vite encodes \0-prefixed ids in browser URLs.
const DEV_CLIENT_URL = `/@id/__x00__${VIRTUAL_ID}`;
function resolveClientBundlePath() {
    // Monorepo dev: resolve the live sibling workspace bundle, so the
    // watch-build rebuild loop in configureServer keeps invalidating + reloading.
    const require = createRequire(import.meta.url);
    try {
        return require.resolve("@repo/feedback-client/bundle");
    }
    catch {
        // Consumer install: @repo/feedback-client is NOT a runtime dependency.
        // The plugin's build step (scripts/copy-client.mjs) copies the prebuilt
        // IIFE next to this module, so the plugin ships fully self-contained.
        const bundled = fileURLToPath(new URL("./feedback-client.iife.js", import.meta.url));
        if (existsSync(bundled))
            return bundled;
        throw new Error("[design-feedback] Could not resolve the feedback client bundle. " +
            "Expected a sibling @repo/feedback-client (monorepo dev) or a bundled " +
            "feedback-client.iife.js next to the plugin (published/git build).");
    }
}
function readClientBundle() {
    return readFileSync(resolveClientBundlePath(), "utf8");
}
/**
 * The real vite-plugin-component-tagger, configured for React files and
 * wrapped with a safety guard.
 *
 * The tagger stamps each component's root element with
 * data-ref="src/components/X.tsx#L<start>-<end>" — the attribute the feedback
 * client uses to pick components and anchor comments.
 *
 * The guard exists because the tagger is line/regex based (it was written for
 * Svelte): on TypeScript it can mistake lowercase generics (useState<boolean>,
 * Record<string, T>) for elements and corrupt the file. We therefore
 * syntax-check its output with esbuild and fall back to the untagged source
 * when the transform would break the module.
 */
function createGuardedTagger() {
    // enableInProd: the designFeedback `enabled` option is the single on/off
    // switch; when the plugin is on, built demos should be commentable too.
    const tagger = componentTagger({ extensions: [".tsx", ".jsx"], enableInProd: true });
    const taggerTransform = tagger.transform;
    return {
        ...tagger,
        name: "design-feedback:component-tagger",
        // Must run before @vitejs/plugin-react so it sees raw JSX and true source line numbers.
        enforce: "pre",
        async transform(code, id) {
            // Never tag the feedback client itself (or any virtual module).
            if (id.includes("feedback-client") || id.startsWith("\0"))
                return null;
            const handler = typeof taggerTransform === "function" ? taggerTransform : taggerTransform?.handler;
            if (!handler)
                return null;
            const result = await handler.call(this, code, id);
            if (result == null)
                return null;
            const output = typeof result === "string" ? result : result.code;
            if (output == null || output === code)
                return null;
            try {
                await esbuildTransform(output, {
                    loader: id.endsWith(".jsx") ? "jsx" : "tsx",
                    jsx: "preserve",
                });
                return result;
            }
            catch {
                this.warn(`[design-feedback] vite-plugin-component-tagger produced invalid syntax for ${id}; ` +
                    "leaving the file untagged (feedback falls back to coordinates).");
                return null;
            }
        },
    };
}
/** Injects the feedback client bundle + runtime config into index.html. */
function createInjector(options) {
    let isBuild = false;
    return {
        name: "design-feedback:inject",
        configResolved(config) {
            isBuild = config.command === "build";
        },
        resolveId(id) {
            if (id === VIRTUAL_ID || id === `/${VIRTUAL_ID}`)
                return RESOLVED_VIRTUAL_ID;
            return null;
        },
        load(id) {
            if (id === RESOLVED_VIRTUAL_ID)
                return readClientBundle();
            return null;
        },
        configureServer(server) {
            // The client bundle is prebuilt; when its watch-build rewrites it,
            // invalidate the virtual module and reload the page.
            let bundlePath;
            try {
                bundlePath = resolveClientBundlePath();
            }
            catch {
                return; // surfaced later with a clear error when the page loads
            }
            server.watcher.add(bundlePath);
            server.watcher.on("change", (file) => {
                if (file !== bundlePath)
                    return;
                const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
                if (mod)
                    server.moduleGraph.invalidateModule(mod);
                server.ws.send({ type: "full-reload" });
            });
        },
        transformIndexHtml: {
            order: "pre",
            handler() {
                const config = JSON.stringify({ projectKey: options.projectKey, apiUrl: options.apiUrl });
                const tags = [
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
                }
                else {
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
export default function designFeedback(options) {
    if (!options?.projectKey || !options?.apiUrl) {
        throw new Error("[design-feedback] projectKey and apiUrl are required");
    }
    if (options.enabled === false) {
        return []; // fully disabled: no tagging, no injected UI
    }
    return [createGuardedTagger(), createInjector(options)];
}
