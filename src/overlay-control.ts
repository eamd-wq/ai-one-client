import { emitTo } from "@tauri-apps/api/event";
import { cursorPosition, getCurrentWindow } from "@tauri-apps/api/window";
import { LazyStore } from "@tauri-apps/plugin-store";

const MOVE_THRESHOLD = 3;
const CONTROL_SIZE = 28;
const CONTROL_MARGIN = 8;
const CONTROL_TOP = 8;
const HOVER_HIT_SLOP = 6;
const HOVER_POLL_MS = 50;
const MIN_SAVED_POSITION_RATIO = 0;
const MAX_SAVED_POSITION_RATIO = 1;
const appStore = new LazyStore("app-preferences.json");

let pointerStartX = 0;
let dragStartLeft = 0;
let currentLeft = 0;
let currentPositionRatio = 0.5;
let availableWidth = 320;
let dragged = false;
let isPointerDown = false;
let isHoveringButton = false;
let rafId: number | null = null;
let pendingLeft = 0;
let isInteractive = false;
let isHoverPolling = false;

const buttonElement = getButtonElement();
const overlayWindow = getCurrentWindow();
const colorSchemeMedia = globalThis.window.matchMedia("(prefers-color-scheme: dark)");

function getButtonElement() {
  const element = document.querySelector<HTMLButtonElement>("#collapsed-control");
  if (!element) {
    throw new Error("Collapsed control button not found.");
  }

  return element;
}

function clampLeft(nextLeft: number) {
  const maxLeft = Math.max(availableWidth - CONTROL_SIZE - CONTROL_MARGIN, CONTROL_MARGIN);
  return Math.min(Math.max(nextLeft, CONTROL_MARGIN), maxLeft);
}

function getMovableWidth() {
  return Math.max(availableWidth - CONTROL_SIZE - CONTROL_MARGIN * 2, 1);
}

function clampPositionRatio(nextRatio: number) {
  return Math.min(
    Math.max(nextRatio, MIN_SAVED_POSITION_RATIO),
    MAX_SAVED_POSITION_RATIO,
  );
}

function leftToRatio(left: number) {
  const normalizedLeft = clampLeft(left) - CONTROL_MARGIN;
  return clampPositionRatio(normalizedLeft / getMovableWidth());
}

function ratioToLeft(ratio: number) {
  return clampLeft(CONTROL_MARGIN + clampPositionRatio(ratio) * getMovableWidth());
}

async function requestExpand() {
  await emitTo({ kind: "Webview", label: "main" }, "collapsed-control:expand-request");
}

async function persistControlLeft() {
  currentPositionRatio = leftToRatio(currentLeft);
  await appStore.set("collapsedControlLeft", currentPositionRatio);
  await emitTo(
    { kind: "Webview", label: "main" },
    "collapsed-control:position-commit",
    currentPositionRatio,
  );
}

async function syncAvailableWidth() {
  const [size, scaleFactor] = await Promise.all([
    overlayWindow.innerSize(),
    overlayWindow.scaleFactor(),
  ]);

  availableWidth = Math.max(Math.round(size.toLogical(scaleFactor).width), 320);
}

async function restoreControlLeft() {
  await appStore.init();
  const savedValue =
    (await appStore.get<number | null>("collapsedControlLeft")) ?? null;
  await syncAvailableWidth();
  const centeredLeft = Math.round((availableWidth - CONTROL_SIZE) / 2);
  const restoredLeft =
    savedValue === null
      ? centeredLeft
      : savedValue >= MIN_SAVED_POSITION_RATIO &&
          savedValue <= MAX_SAVED_POSITION_RATIO
        ? ratioToLeft(savedValue)
        : clampLeft(savedValue);
  currentPositionRatio =
    savedValue === null
      ? leftToRatio(centeredLeft)
      : savedValue >= MIN_SAVED_POSITION_RATIO &&
          savedValue <= MAX_SAVED_POSITION_RATIO
        ? clampPositionRatio(savedValue)
        : leftToRatio(savedValue);
  currentLeft = restoredLeft;
  commitButtonPosition(currentLeft);
  await setInteractive(false);
}

function renderButtonLeft(nextLeft: number) {
  buttonElement.style.left = `${nextLeft}px`;
}

function commitButtonPosition(nextLeft: number) {
  currentLeft = clampLeft(nextLeft);
  currentPositionRatio = leftToRatio(currentLeft);
  pendingLeft = currentLeft;
  renderButtonLeft(currentLeft);
}

function scheduleMove(nextLeft: number) {
  pendingLeft = clampLeft(nextLeft);
  currentPositionRatio = leftToRatio(pendingLeft);
  renderButtonLeft(pendingLeft);

  if (rafId !== null) {
    return;
  }

  rafId = globalThis.requestAnimationFrame(async () => {
    rafId = null;
    currentLeft = pendingLeft;
  });
}

async function setInteractive(nextInteractive: boolean) {
  if (isInteractive === nextInteractive) {
    return;
  }

  isInteractive = nextInteractive;
  await overlayWindow.setIgnoreCursorEvents(!nextInteractive);
}

async function syncHoverState() {
  if (isHoverPolling) {
    return;
  }

  isHoverPolling = true;

  try {
    if (isPointerDown) {
      await setInteractive(true);
      return;
    }

    const [cursor, outerPosition, scaleFactor] = await Promise.all([
      cursorPosition(),
      overlayWindow.outerPosition(),
      overlayWindow.scaleFactor(),
    ]);

    const left = outerPosition.x + Math.round(currentLeft * scaleFactor);
    const top = outerPosition.y + Math.round(CONTROL_TOP * scaleFactor);
    const size = Math.round(CONTROL_SIZE * scaleFactor);
    const hitSlop = Math.round(HOVER_HIT_SLOP * scaleFactor);
    const isCursorNearButton =
      cursor.x >= left - hitSlop &&
      cursor.x <= left + size + hitSlop &&
      cursor.y >= top - hitSlop &&
      cursor.y <= top + size + hitSlop;

    isHoveringButton = isCursorNearButton;
    await setInteractive(isCursorNearButton);
  } finally {
    isHoverPolling = false;
  }
}

function handlePointerDown(event: PointerEvent) {
  pointerStartX = event.clientX;
  dragStartLeft = currentLeft;
  dragged = false;
  isPointerDown = true;
  isHoveringButton = true;
  buttonElement.style.transition =
    "border-color 120ms ease, color 120ms ease, background 120ms ease";
  buttonElement.setPointerCapture(event.pointerId);
  void setInteractive(true);
}

function handlePointerMove(event: PointerEvent) {
  if (!buttonElement.hasPointerCapture(event.pointerId)) {
    return;
  }

  const deltaX = event.clientX - pointerStartX;
  if (Math.abs(deltaX) > MOVE_THRESHOLD) {
    dragged = true;
  }

  scheduleMove(dragStartLeft + deltaX);
}

function handlePointerEnter() {
  isHoveringButton = true;
  buttonElement.style.transform = "scale(1.04)";
  buttonElement.style.borderColor = buttonElement.dataset.borderHoverColor ?? "";
  buttonElement.style.background = buttonElement.dataset.backgroundHoverColor ?? "";
  buttonElement.style.color = buttonElement.dataset.textHoverColor ?? "";
  void setInteractive(true);
}

function handlePointerLeave() {
  isHoveringButton = false;
  if (!isPointerDown) {
    buttonElement.style.transform = "";
    buttonElement.style.background = buttonElement.dataset.backgroundColor ?? "";
    buttonElement.style.color = buttonElement.dataset.textColor ?? "";
    buttonElement.style.borderColor = buttonElement.dataset.borderColor ?? "";
  }
  void syncHoverState();
}

function handlePointerUp(event: PointerEvent) {
  if (buttonElement.hasPointerCapture(event.pointerId)) {
    buttonElement.releasePointerCapture(event.pointerId);
  }

  isPointerDown = false;
  buttonElement.style.transition =
    "transform 120ms ease, border-color 120ms ease, color 120ms ease, background 120ms ease";

  if (!isHoveringButton) {
    buttonElement.style.transform = "";
    buttonElement.style.background = buttonElement.dataset.backgroundColor ?? "";
    buttonElement.style.color = buttonElement.dataset.textColor ?? "";
    buttonElement.style.borderColor = buttonElement.dataset.borderColor ?? "";
  }

  commitButtonPosition(currentLeft);
  void persistControlLeft();
  void syncHoverState();
}

function handleClick() {
  if (dragged) {
    dragged = false;
    return;
  }

  void requestExpand();
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
buttonElement.addEventListener("pointerenter", handlePointerEnter);
buttonElement.addEventListener("pointerleave", handlePointerLeave);
buttonElement.addEventListener("click", handleClick);
colorSchemeMedia.addEventListener("change", applyThemePalette);

document.documentElement.style.background = "transparent";
document.documentElement.style.width = "100%";
document.documentElement.style.height = "100%";
document.documentElement.style.pointerEvents = "none";
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
buttonElement.style.top = `${CONTROL_TOP}px`;
buttonElement.style.cursor = "pointer";
buttonElement.style.outline = "none";
buttonElement.style.pointerEvents = "auto";
buttonElement.style.transition =
  "transform 120ms ease, border-color 120ms ease, color 120ms ease, background 120ms ease";

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

applyThemePalette();
void restoreControlLeft();
globalThis.window.setInterval(() => {
  void syncHoverState();
}, HOVER_POLL_MS);
void syncHoverState();
void overlayWindow.onResized(() => {
  void (async () => {
    const nextPositionRatio = currentPositionRatio;
    await syncAvailableWidth();
    commitButtonPosition(ratioToLeft(nextPositionRatio));
  })();
});
