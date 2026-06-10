import type { PluginOption } from "vite";
export type DesignFeedbackPluginOptions = {
    projectKey: string;
    apiUrl: string;
    enabled?: boolean;
};
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
export default function designFeedback(options: DesignFeedbackPluginOptions): PluginOption;
