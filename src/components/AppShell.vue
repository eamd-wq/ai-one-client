<script setup lang="ts">
import { listen } from "@tauri-apps/api/event";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

import { useWorkspaceStore } from "../stores/workspace";

const HEADER_HEIGHT = 60;
const HEADER_ANIMATION_DURATION = 180;

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();

const isHeaderCollapsed = ref(false);
const topOffsetAnimationFrame = ref<number | null>(null);
const unlistenExpandRequest = ref<(() => void) | null>(null);
const unlistenDragRequest = ref<(() => void) | null>(null);

const activeProviderName = computed(() => workspace.activeProvider?.name ?? "选择 AI");
const canCollapseHeader = computed(
  () => route.path === "/workspace" && workspace.currentPane === "provider",
);

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
 * 收起头部，并让子 Webview 全屏填充。
 */
async function collapseHeader() {
  if (!canCollapseHeader.value || isHeaderCollapsed.value) {
    return;
  }

  isHeaderCollapsed.value = true;
  await animateShellTopOffset(0);
  await workspace.showCollapsedControl();
}

/**
 * 展开头部，并隐藏悬浮展开控件。
 */
async function expandHeader() {
  if (!isHeaderCollapsed.value) {
    return;
  }

  await workspace.hideCollapsedControl();
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

onMounted(async () => {
  await workspace.setShellTopOffset(HEADER_HEIGHT);

  unlistenExpandRequest.value = await listen(
    "collapsed-control:expand-request",
    async () => {
      await expandHeader();
    },
  );

  unlistenDragRequest.value = await listen<{ deltaX: number }>(
    "collapsed-control:drag",
    async (event) => {
      if (!isHeaderCollapsed.value) {
        return;
      }

      await workspace.moveCollapsedControlBy(event.payload.deltaX);
    },
  );
});

onBeforeUnmount(() => {
  stopTopOffsetAnimation();
  void workspace.hideCollapsedControl();

  if (unlistenExpandRequest.value) {
    void unlistenExpandRequest.value();
  }

  if (unlistenDragRequest.value) {
    void unlistenDragRequest.value();
  }
});

watch(
  () => [route.path, workspace.currentPane, workspace.activeProviderId] as const,
  async ([nextPath, nextPane, nextProviderId]) => {
    if (
      isHeaderCollapsed.value &&
      (nextPath !== "/workspace" || nextPane !== "provider" || !nextProviderId)
    ) {
      await expandHeader();
    }
  },
);
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="pointer-events-none absolute inset-0 bg-[var(--app-surface-gradient)]" />
    <div
      class="pointer-events-none absolute inset-x-0 top-[-6rem] h-72 bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_65%)]"
    />

    <div class="relative mx-auto flex min-h-screen max-w-[1600px] flex-col">
      <header
        class="overflow-hidden border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-[var(--app-shadow)] backdrop-blur-2xl transition-[height,border-color,box-shadow] duration-200"
        :class="isHeaderCollapsed ? 'h-0 border-b border-transparent' : 'h-[60px] border-b'"
      >
        <div
          class="relative flex h-[60px] items-center gap-4 pr-4 transition duration-200"
          :class="isHeaderCollapsed ? 'pointer-events-none -translate-y-3 opacity-0' : 'translate-y-0 opacity-100'"
        >
          <button
            class="group flex h-full max-w-[320px] shrink-0 items-center gap-2 px-4 py-2 text-left transition hover:bg-[var(--app-accent-soft)]"
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

          <button
            v-if="canCollapseHeader"
            class="absolute left-1/2 top-1/2 flex h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--app-border)] bg-[rgba(255,250,242,0.44)] text-[var(--app-text-soft)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
            aria-label="收起头部"
            @click="collapseHeader"
          >
            <span class="relative block h-[10px] w-[12px]">
              <span class="absolute left-0 top-[2px] h-[1.5px] w-full rounded-full bg-current" />
              <span class="absolute left-[2px] top-[6px] h-[1.5px] w-[8px] rounded-full bg-current opacity-65" />
            </span>
          </button>

          <nav class="ml-auto flex items-center gap-2">
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
          </nav>
        </div>
      </header>

      <main class="relative flex-1 overflow-hidden bg-[var(--app-bg-elevated)]">
        <RouterView />
      </main>
    </div>
  </div>
</template>
