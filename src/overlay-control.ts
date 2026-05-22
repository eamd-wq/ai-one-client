import { LogicalPosition } from "@tauri-apps/api/dpi";
import { emitTo } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LazyStore } from "@tauri-apps/plugin-store";

const MOVE_THRESHOLD = 3;
const CONTROL_SIZE = 28;
const CONTROL_MARGIN = 8;
const appStore = new LazyStore("app-preferences.json");

let startX = 0;
let dragged = false;
let currentLeft = 0;
let availableWidth = 320;
let isDragging = false;
let rafId: number | null = null;
let pendingOverlayLeft = 0;

const buttonElement = getButtonElement();
const colorSchemeMedia = globalThis.window.matchMedia("(prefers-color-scheme: dark)");
const currentOverlayWebview = getCurrentWebview();

function disableOverlayContextMenu() {
  document.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
    },
    { capture: true },
  );
}

function getButtonElement() {
  const element = document.querySelector<HTMLButtonElement>("#collapsed-control");
  if (!element) {
    throw new Error("Collapsed control button not found.");
  }

  return element;
}

async function requestExpand() {
  await emitTo({ kind: "Webview", label: "main" }, "collapsed-control:expand-request");
}

async function persistControlLeft() {
  await appStore.set("collapsedControlLeft", currentLeft);
  await emitTo(
    { kind: "Webview", label: "main" },
    "collapsed-control:position-commit",
    currentLeft,
  );
}

function handlePointerDown(event: PointerEvent) {
  startX = event.clientX;
  dragged = false;
  isDragging = true;
  buttonElement.style.transition =
    "border-color 120ms ease, color 120ms ease, background 120ms ease";
  buttonElement.setPointerCapture(event.pointerId);
}

function handlePointerMove(event: PointerEvent) {
  if (!buttonElement.hasPointerCapture(event.pointerId)) {
    return;
  }

  const deltaX = event.clientX - startX;
  if (Math.abs(deltaX) > MOVE_THRESHOLD) {
    dragged = true;
  }

  if (deltaX === 0) {
    return;
  }

  startX = event.clientX;
  applyOverlayLeft(currentLeft + deltaX);
}

function handlePointerUp(event: PointerEvent) {
  if (buttonElement.hasPointerCapture(event.pointerId)) {
    buttonElement.releasePointerCapture(event.pointerId);
  }

  isDragging = false;
  buttonElement.style.transition =
    "transform 120ms ease, border-color 120ms ease, color 120ms ease, background 120ms ease";
  commitOverlayPosition();
  void persistControlLeft();
}

function handleClick() {
  if (dragged) {
    dragged = false;
    return;
  }

  void requestExpand();
}

function clampLeft(nextLeft: number) {
  const maxLeft = Math.max(availableWidth - CONTROL_SIZE - CONTROL_MARGIN, CONTROL_MARGIN);

  return Math.min(Math.max(nextLeft, CONTROL_MARGIN), maxLeft);
}

function applyOverlayLeft(nextLeft: number) {
  currentLeft = clampLeft(nextLeft);
  pendingOverlayLeft = currentLeft;

  if (rafId !== null) {
    return;
  }

  rafId = globalThis.requestAnimationFrame(() => {
    rafId = null;
    void currentOverlayWebview.setPosition(
      new LogicalPosition(Math.max(pendingOverlayLeft - CONTROL_MARGIN, 0), 0),
    );
  });
}

function commitOverlayPosition() {
  if (rafId !== null) {
    globalThis.cancelAnimationFrame(rafId);
    rafId = null;
  }

  void currentOverlayWebview.setPosition(
    new LogicalPosition(Math.max(currentLeft - CONTROL_MARGIN, 0), 0),
  );
}

function setupOverlayLayout() {
  const centeredLeft = Math.round((availableWidth - CONTROL_SIZE) / 2);
  currentLeft = clampLeft(currentLeft || centeredLeft);

  if (isDragging) {
    applyOverlayLeft(currentLeft);
    return;
  }

  commitOverlayPosition();
}

async function syncAvailableWidth() {
  const currentWindow = getCurrentWindow();
  const [size, scaleFactor] = await Promise.all([
    currentWindow.innerSize(),
    currentWindow.scaleFactor(),
  ]);

  availableWidth = Math.max(Math.round(size.toLogical(scaleFactor).width), 320);
  setupOverlayLayout();
}

async function restoreControlLeft() {
  await appStore.init();
  const savedLeft = await appStore.get<number | null>("collapsedControlLeft");
  currentLeft = savedLeft ?? 0;
  await syncAvailableWidth();
}

function getThemePalette() {
  if (colorSchemeMedia.matches) {
    return {
      colorScheme: "dark",
      text: "#f7ecdd",
      textHover: "#fff6ec",
      border: "rgba(245, 219, 190, 0.12)",
      borderHover: "rgba(240, 157, 88, 0.28)",
      background: "rgba(31, 25, 21, 0.82)",
      backgroundHover: "rgba(33, 27, 22, 0.92)",
    } as const;
  }

  return {
    colorScheme: "light",
    text: "#24180f",
    textHover: "#24180f",
    border: "rgba(96, 74, 40, 0.14)",
    borderHover: "rgba(187, 90, 49, 0.28)",
    background: "rgba(255, 250, 242, 0.9)",
    backgroundHover: "rgba(255, 249, 240, 0.98)",
  } as const;
}

function applyThemePalette() {
  const palette = getThemePalette();

  document.documentElement.style.colorScheme = palette.colorScheme;
  buttonElement.dataset.textColor = palette.text;
  buttonElement.dataset.textHoverColor = palette.textHover;
  buttonElement.dataset.borderColor = palette.border;
  buttonElement.dataset.borderHoverColor = palette.borderHover;
  buttonElement.dataset.backgroundColor = palette.background;
  buttonElement.dataset.backgroundHoverColor = palette.backgroundHover;

  buttonElement.style.color = palette.text;
  buttonElement.style.borderColor = palette.border;
  buttonElement.style.background = palette.background;
}

buttonElement.addEventListener("pointerdown", handlePointerDown);
buttonElement.addEventListener("pointermove", handlePointerMove);
buttonElement.addEventListener("pointerup", handlePointerUp);
buttonElement.addEventListener("pointercancel", handlePointerUp);
buttonElement.addEventListener("click", handleClick);
colorSchemeMedia.addEventListener("change", applyThemePalette);

document.documentElement.style.background = "transparent";
document.documentElement.style.width = "100%";
document.documentElement.style.height = "100%";
document.body.style.margin = "0";
document.body.style.background = "transparent";
document.body.style.overflow = "hidden";
document.body.style.userSelect = "none";
document.body.style.webkitUserSelect = "none";
document.body.style.width = "100vw";
document.body.style.height = "44px";
document.body.style.position = "relative";
document.body.style.pointerEvents = "none";

buttonElement.style.width = "28px";
buttonElement.style.height = "28px";
buttonElement.style.padding = "0";
buttonElement.style.border = "1px solid transparent";
buttonElement.style.borderRadius = "999px";
buttonElement.style.background = "transparent";
buttonElement.style.setProperty("-webkit-backdrop-filter", "blur(14px)");
buttonElement.style.color = "#fff6ec";
buttonElement.style.display = "grid";
buttonElement.style.placeItems = "center";
buttonElement.style.position = "absolute";
buttonElement.style.left = `${CONTROL_MARGIN}px`;
buttonElement.style.top = "8px";
buttonElement.style.cursor = "pointer";
buttonElement.style.pointerEvents = "auto";
buttonElement.style.outline = "none";
buttonElement.style.transition =
  "transform 120ms ease, border-color 120ms ease, color 120ms ease, background 120ms ease";

buttonElement.addEventListener("mouseenter", () => {
  buttonElement.style.transform = "scale(1.04)";
  buttonElement.style.borderColor = buttonElement.dataset.borderHoverColor ?? "";
  buttonElement.style.background = buttonElement.dataset.backgroundHoverColor ?? "";
  buttonElement.style.color = buttonElement.dataset.textHoverColor ?? "";
});

buttonElement.addEventListener("mouseleave", () => {
  buttonElement.style.borderColor = "rgba(255, 255, 255, 0.16)";
  buttonElement.style.background = buttonElement.dataset.backgroundColor ?? "";
  buttonElement.style.color = buttonElement.dataset.textColor ?? "";
  buttonElement.style.borderColor = buttonElement.dataset.borderColor ?? "";
});

buttonElement.querySelectorAll<HTMLElement>(".line").forEach((lineElement) => {
  lineElement.style.position = "absolute";
  lineElement.style.left = "50%";
  lineElement.style.transform = "translateX(-50%)";
  lineElement.style.borderRadius = "999px";
  lineElement.style.background = "currentColor";
});

const primaryLine = buttonElement.querySelector<HTMLElement>(".line-primary");
const secondaryLine = buttonElement.querySelector<HTMLElement>(".line-secondary");

if (primaryLine) {
  primaryLine.style.top = "12px";
  primaryLine.style.width = "12px";
  primaryLine.style.height = "1.5px";
}

if (secondaryLine) {
  secondaryLine.style.top = "17px";
  secondaryLine.style.width = "8px";
  secondaryLine.style.height = "1.5px";
  secondaryLine.style.opacity = "0.68";
}

disableOverlayContextMenu();
applyThemePalette();
void restoreControlLeft();
void getCurrentWindow().onResized(() => {
  void syncAvailableWidth();
});
