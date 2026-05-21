import { emitTo } from "@tauri-apps/api/event";

const MOVE_THRESHOLD = 3;

let startX = 0;
let dragged = false;

const buttonElement = getButtonElement();

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
 * 向主壳层发送横向拖动增量。
 */
async function emitDrag(deltaX: number) {
  await emitTo(
    { kind: "Webview", label: "main" },
    "collapsed-control:drag",
    { deltaX },
  );
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
  void emitDrag(deltaX);
}

/**
 * 释放拖动捕获。
 */
function handlePointerUp(event: PointerEvent) {
  if (buttonElement.hasPointerCapture(event.pointerId)) {
    buttonElement.releasePointerCapture(event.pointerId);
  }
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

buttonElement.addEventListener("pointerdown", handlePointerDown);
buttonElement.addEventListener("pointermove", handlePointerMove);
buttonElement.addEventListener("pointerup", handlePointerUp);
buttonElement.addEventListener("pointercancel", handlePointerUp);
buttonElement.addEventListener("click", handleClick);

document.documentElement.style.background = "transparent";
document.body.style.margin = "0";
document.body.style.background = "transparent";
document.body.style.overflow = "hidden";
document.body.style.userSelect = "none";
document.body.style.webkitUserSelect = "none";

buttonElement.style.width = "34px";
buttonElement.style.height = "34px";
buttonElement.style.padding = "0";
buttonElement.style.border = "1px solid rgba(255, 255, 255, 0.18)";
buttonElement.style.borderRadius = "999px";
buttonElement.style.background = "rgba(22, 18, 15, 0.68)";
buttonElement.style.backdropFilter = "blur(18px)";
buttonElement.style.setProperty("-webkit-backdrop-filter", "blur(18px)");
buttonElement.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.22)";
buttonElement.style.color = "#fff6ec";
buttonElement.style.display = "grid";
buttonElement.style.placeItems = "center";
buttonElement.style.position = "relative";
buttonElement.style.cursor = "pointer";
buttonElement.style.outline = "none";
buttonElement.style.transition =
  "transform 160ms ease, border-color 160ms ease, background 160ms ease";

buttonElement.addEventListener("mouseenter", () => {
  buttonElement.style.transform = "translateY(1px)";
  buttonElement.style.background = "rgba(35, 29, 24, 0.76)";
  buttonElement.style.borderColor = "rgba(255, 214, 178, 0.3)";
});

buttonElement.addEventListener("mouseleave", () => {
  buttonElement.style.transform = "translateY(0)";
  buttonElement.style.background = "rgba(22, 18, 15, 0.68)";
  buttonElement.style.borderColor = "rgba(255, 255, 255, 0.18)";
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
