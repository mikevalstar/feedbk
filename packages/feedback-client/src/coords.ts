import type { CoordinateData } from "./types";

/** Full coordinate context for an arbitrary viewport point (e.g. a selection rect). */
export function coordsFromPoint(clientX: number, clientY: number): CoordinateData {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  return {
    viewportWidth,
    viewportHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    clientX,
    clientY,
    pageX: clientX + window.scrollX,
    pageY: clientY + window.scrollY,
    normalizedX: viewportWidth > 0 ? clientX / viewportWidth : 0,
    normalizedY: viewportHeight > 0 ? clientY / viewportHeight : 0,
  };
}

/** Capture the full coordinate context of a click, per the phase-1 spec. */
export function captureCoords(event: MouseEvent): CoordinateData {
  return coordsFromPoint(event.clientX, event.clientY);
}
