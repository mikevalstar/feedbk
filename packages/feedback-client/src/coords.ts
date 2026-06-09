import type { CoordinateData } from "./types";

/** Capture the full coordinate context of a click, per the phase-1 spec. */
export function captureCoords(event: MouseEvent): CoordinateData {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  return {
    viewportWidth,
    viewportHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    clientX: event.clientX,
    clientY: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY,
    normalizedX: viewportWidth > 0 ? event.clientX / viewportWidth : 0,
    normalizedY: viewportHeight > 0 ? event.clientY / viewportHeight : 0,
  };
}
