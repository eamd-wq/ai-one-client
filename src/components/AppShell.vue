<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

import { useWorkspaceStore } from "../stores/workspace";

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();

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
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="pointer-events-none absolute inset-0 bg-[var(--app-surface-gradient)]" />
    <div
      class="pointer-events-none absolute inset-x-0 top-[-6rem] h-72 bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_65%)]"
    />

    <div class="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-3 py-3">
      <header
        class="flex h-[60px] items-center justify-between gap-4 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 shadow-[var(--app-shadow)] backdrop-blur-2xl"
      >
        <button
          class="group flex min-w-0 items-center gap-3 rounded-full border border-[var(--app-border)] bg-[var(--app-bg-strong)] px-3 py-2 text-left transition hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]"
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
        </nav>
      </header>

      <main
        class="relative mt-3 flex-1 overflow-hidden rounded-[22px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-[var(--app-shadow)] backdrop-blur-2xl"
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>
