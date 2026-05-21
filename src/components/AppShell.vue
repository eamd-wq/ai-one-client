<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

import { useWorkspaceStore } from "../stores/workspace";

const HEADER_HEIGHT = 60;
const HEADER_ANIMATION_DURATION = 180;
const COLLAPSED_INDICATOR_SIZE = 34;
const COLLAPSED_INDICATOR_MARGIN = 8;

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();

const shellRootRef = ref<globalThis.HTMLElement | null>(null);
const isHeaderCollapsed = ref(false);
const indicatorLeft = ref(COLLAPSED_INDICATOR_MARGIN);
const dragStartX = ref(0);
const indicatorStartLeft = ref(0);
const isDraggingIndicator = ref(false);
const didDragIndicator = ref(false);
const topOffsetAnimationFrame = ref<number | null>(null);

const activeProviderName = computed(() => workspace.activeProvider?.name ?? "选择 AI");

/**
 * 回到 AI 选择页。
 */
async function goToSelection() {
  await workspace.showSelection();
  await router.push("/select");
}

/**
 * 前往设置页。
 */
async function goToSettings() {
  await workspace.showSettings();
  await router.push("/settings");
}

/**
 * 返回工作区主视图。
 */
async function goToWorkspace() {
  if (workspace.activeProviderId) {
    await workspace.openProvider(workspace.activeProviderId);
  }
  await router.push("/workspace");
}

/**
 * 收起头部，并同步内容区顶部偏移。
 */
async function collapseHeader() {
  isHeaderCollapsed.value = true;
  clampIndicatorLeft(indicatorLeft.value);
  await animateShellTopOffset(0);
}

/**
 * 展开头部，并同步内容区顶部偏移。
 */
async function expandHeader() {
  isHeaderCollapsed.value = false;
  await nextTick();
  await animateShellTopOffset(HEADER_HEIGHT);
}

/**
 * 平滑同步原生子 Webview 的顶部偏移。
 */
async function animateShellTopOffset(targetOffset: number) {
  stopTopOffsetAnimation();

  const startOffset = workspace.shellTopOffset;
  const startTime = globalThis.performance.now();

  await new Promise<void>((resolve) => {
    const step = () => {
      const elapsed = globalThis.performance.now() - startTime;
      const progress = Math.min(elapsed / HEADER_ANIMATION_DURATION, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      const nextOffset = Math.round(
        startOffset + (targetOffset - startOffset) * easedProgress,
      );

      void workspace.setShellTopOffset(nextOffset);

      if (progress >= 1) {
        topOffsetAnimationFrame.value = null;
        void workspace.setShellTopOffset(targetOffset);
        resolve();
        return;
      }

      topOffsetAnimationFrame.value = globalThis.requestAnimationFrame(step);
    };

    topOffsetAnimationFrame.value = globalThis.requestAnimationFrame(step);
  });
}

/**
 * 停止顶部偏移动画。
 */
function stopTopOffsetAnimation() {
  if (topOffsetAnimationFrame.value === null) {
    return;
  }

  globalThis.cancelAnimationFrame(topOffsetAnimationFrame.value);
  topOffsetAnimationFrame.value = null;
}

/**
 * 限制收起图标仅在容器顶部水平移动。
 */
function clampIndicatorLeft(nextLeft: number) {
  const root = shellRootRef.value;
  if (!root) {
    indicatorLeft.value = Math.max(nextLeft, COLLAPSED_INDICATOR_MARGIN);
    return;
  }

  const maxLeft = Math.max(
    root.clientWidth - COLLAPSED_INDICATOR_SIZE - COLLAPSED_INDICATOR_MARGIN,
    COLLAPSED_INDICATOR_MARGIN,
  );

  indicatorLeft.value = Math.min(
    Math.max(nextLeft, COLLAPSED_INDICATOR_MARGIN),
    maxLeft,
  );
}

/**
 * 开始拖动收起图标。
 */
function startIndicatorDrag(event: globalThis.PointerEvent) {
  dragStartX.value = event.clientX;
  indicatorStartLeft.value = indicatorLeft.value;
  isDraggingIndicator.value = true;
  didDragIndicator.value = false;

  globalThis.window.addEventListener("pointermove", handleIndicatorDrag);
  globalThis.window.addEventListener("pointerup", stopIndicatorDrag);
}

/**
 * 处理收起图标拖动过程。
 */
function handleIndicatorDrag(event: globalThis.PointerEvent) {
  if (!isDraggingIndicator.value) {
    return;
  }

  const deltaX = event.clientX - dragStartX.value;
  if (Math.abs(deltaX) > 3) {
    didDragIndicator.value = true;
  }

  clampIndicatorLeft(indicatorStartLeft.value + deltaX);
}

/**
 * 结束收起图标拖动。
 */
function stopIndicatorDrag() {
  isDraggingIndicator.value = false;
  globalThis.window.removeEventListener("pointermove", handleIndicatorDrag);
  globalThis.window.removeEventListener("pointerup", stopIndicatorDrag);

  globalThis.window.setTimeout(() => {
    didDragIndicator.value = false;
  }, 0);
}

/**
 * 点击收起图标时恢复展开状态。
 */
async function handleCollapsedIndicatorClick() {
  if (didDragIndicator.value) {
    return;
  }

  await expandHeader();
}

/**
 * 根据当前容器宽度修正图标位置。
 */
function syncIndicatorBounds() {
  clampIndicatorLeft(indicatorLeft.value);
}

onMounted(async () => {
  await workspace.setShellTopOffset(HEADER_HEIGHT);
  globalThis.window.addEventListener("resize", syncIndicatorBounds);
});

onBeforeUnmount(() => {
  stopTopOffsetAnimation();
  globalThis.window.removeEventListener("resize", syncIndicatorBounds);
  globalThis.window.removeEventListener("pointermove", handleIndicatorDrag);
  globalThis.window.removeEventListener("pointerup", stopIndicatorDrag);
});
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="pointer-events-none absolute inset-0 bg-[var(--app-surface-gradient)]" />
    <div
      class="pointer-events-none absolute inset-x-0 top-[-6rem] h-72 bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_65%)]"
    />

    <div
      ref="shellRootRef"
      class="relative mx-auto flex min-h-screen max-w-[1600px] flex-col"
    >
      <button
        class="absolute top-[8px] z-20 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[var(--app-border)] bg-[rgba(255,250,242,0.52)] text-[11px] font-semibold tracking-[0.08em] text-[var(--app-text-soft)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-200 hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
        :class="
          isHeaderCollapsed
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-2 scale-90 opacity-0'
        "
        :style="{ left: `${indicatorLeft}px` }"
        @pointerdown.prevent="startIndicatorDrag"
        @click="handleCollapsedIndicatorClick"
      >
        AI
      </button>

      <header
        class="overflow-hidden border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-[var(--app-shadow)] backdrop-blur-2xl transition-[height,border-color,box-shadow] duration-200"
        :class="isHeaderCollapsed ? 'h-0 border-b border-transparent' : 'h-[60px] border-b'"
      >
        <div
          class="flex h-[60px] items-center justify-between gap-4 pr-4 transition duration-200"
          :class="isHeaderCollapsed ? 'pointer-events-none -translate-y-3 opacity-0' : 'translate-y-0 opacity-100'"
        >
          <button
            class="group flex h-full min-w-0 items-center gap-2 px-4 py-2 text-left transition hover:bg-[var(--app-accent-soft)]"
            @click="goToWorkspace"
          >
            <div
              class="h-9 w-9 rounded-full bg-[var(--app-accent)]/15 text-center text-sm leading-9 text-[var(--app-accent)]"
            >
              AI
            </div>
            <div class="min-w-0">
              <div class="font-display text-[1.05rem] leading-none tracking-[0.14em] text-[var(--app-text)]">
                AIClientCore
              </div>
              <div class="mt-1 flex min-w-0 items-center gap-2 text-xs text-[var(--app-text-soft)]">
                <span>当前 AI</span>
                <span class="h-1 w-1 rounded-full bg-[var(--app-text-soft)]/60" />
                <span class="truncate font-medium text-[var(--app-text)]">
                  {{ activeProviderName }}
                </span>
              </div>
            </div>
          </button>

          <nav class="flex items-center gap-2">
            <button
              class="rounded-full px-3.5 py-2 text-sm transition"
              :class="
                route.path === '/select'
                  ? 'bg-[var(--app-accent)] text-white shadow-lg'
                  : 'text-[var(--app-text-soft)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]'
              "
              @click="goToSelection"
            >
              快速切换 AI
            </button>
            <button
              class="rounded-full px-3.5 py-2 text-sm transition"
              :class="
                route.path === '/settings'
                  ? 'bg-[var(--app-accent)] text-white shadow-lg'
                  : 'text-[var(--app-text-soft)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]'
              "
              @click="goToSettings"
            >
              设置
            </button>
            <button
              class="rounded-full border border-[var(--app-border)] px-3.5 py-2 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
              @click="collapseHeader"
            >
              收起
            </button>
          </nav>
        </div>
      </header>

      <main class="relative flex-1 overflow-hidden bg-[var(--app-bg-elevated)]">
        <RouterView />
      </main>
    </div>
  </div>
</template>
