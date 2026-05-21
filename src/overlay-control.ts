import { emitTo } from "@tauri-apps/api/event";
import { LazyStore } from "@tauri-apps/plugin-store";

const MOVE_THRESHOLD = 3;
const CONTROL_SIZE = 34;
const CONTROL_MARGIN = 8;
const appStore = new LazyStore("app-preferences.json");

let startX = 0;
let dragged = false;
let currentLeft = 0;

const buttonElement = getButtonElement();
const colorSchemeMedia = globalThis.window.matchMedia("(prefers-color-scheme: dark)");

/**
 * 在悬浮展开控件 Webview 中禁用右键菜单。
 */
function disableOverlayContextMenu() {
  document.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
    },
    { capture: true },
  );
}

/**
 * 获取悬浮控件按钮实例。
 */
function getButtonElement() {
  const element = document.querySelector<HTMLButtonElement>("#collapsed-control");
  if (!element) {
    throw new Error("Collapsed control button not found.");
  }

  return element;
}

/**
 * 向主壳层发送展开请求。
 */
async function requestExpand() {
  await emitTo({ kind: "Webview", label: "main" }, "collapsed-control:expand-request");
}

/**
 * 持久化当前悬浮控件的水平位置。
 */
async function persistControlLeft() {
  await appStore.set("collapsedControlLeft", currentLeft);
}

/**
 * 开始记录拖动状态。
 */
function handlePointerDown(event: PointerEvent) {
  startX = event.clientX;
  dragged = false;
  buttonElement.setPointerCapture(event.pointerId);
}

/**
 * 只发送 X 轴拖动增量，不处理 Y 轴移动。
 */
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
  applyControlLeft(currentLeft + deltaX);
}

/**
 * 释放拖动捕获。
 */
function handlePointerUp(event: PointerEvent) {
  if (buttonElement.hasPointerCapture(event.pointerId)) {
    buttonElement.releasePointerCapture(event.pointerId);
  }

  void persistControlLeft();
}

/**
 * 未发生拖动时点击即展开头部。
 */
function handleClick() {
  if (dragged) {
    dragged = false;
    return;
  }

  void requestExpand();
}

/**
 * 约束圆形按钮只能在顶部透明条内横向移动。
 */
function clampLeft(nextLeft: number) {
  const maxLeft = Math.max(
    globalThis.window.innerWidth - CONTROL_SIZE - CONTROL_MARGIN,
    CONTROL_MARGIN,
  );

  return Math.min(Math.max(nextLeft, CONTROL_MARGIN), maxLeft);
}

/**
 * 立即更新按钮水平位置，保证拖拽跟手。
 */
function applyControlLeft(nextLeft: number) {
  currentLeft = clampLeft(nextLeft);
  buttonElement.style.left = `${currentLeft}px`;
}

/**
 * 初始化顶部透明条与圆形按钮位置。
 */
function setupOverlayLayout() {
  const centeredLeft = Math.round((globalThis.window.innerWidth - CONTROL_SIZE) / 2);
  applyControlLeft(currentLeft || centeredLeft);
}

/**
 * 从持久化存储恢复悬浮控件位置。
 */
async function restoreControlLeft() {
  await appStore.init();
  const savedLeft = await appStore.get<number | null>("collapsedControlLeft");
  currentLeft = savedLeft ?? 0;
  setupOverlayLayout();
}

/**
 * 获取与主应用一致的浅色/深色主题色板。
 */
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

/**
 * 同步悬浮按钮的主题配色。
 */
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
globalThis.window.addEventListener("resize", setupOverlayLayout);
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
