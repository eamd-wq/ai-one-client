<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import { useI18n } from "../lib/i18n";
import { useWorkspaceStore } from "../stores/workspace";

const workspace = useWorkspaceStore();
const { t } = useI18n();

const emptyState = computed(() => !workspace.activeProviderId);
const activeProviderName = computed(
  () => workspace.activeProvider?.name ?? t("common.currentAiFallback"),
);
</script>

<template>
  <section class="h-full">
    <div
      v-if="emptyState"
      class="grid h-full place-items-center px-6 py-8"
    >
      <div class="max-w-[620px] text-center">
        <div class="font-display text-[3rem] tracking-[0.16em] text-[var(--app-text)]">
          {{ t("workspace.title") }}
        </div>
        <p class="mx-auto mt-4 max-w-[520px] text-sm leading-7 text-[var(--app-text-soft)]">
          {{ t("workspace.description") }}
        </p>
        <RouterLink
          to="/select"
          class="mt-8 inline-flex rounded-full bg-[var(--app-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
        >
          {{ t("common.selectAi") }}
        </RouterLink>
      </div>
    </div>

    <div
      v-else
      class="grid h-full place-items-center px-6 py-8"
    >
      <div class="max-w-[620px] text-center">
        <div class="font-display text-[2.4rem] tracking-[0.16em] text-[var(--app-text)]">
          {{ activeProviderName }}
        </div>
        <p class="mx-auto mt-4 max-w-[520px] text-sm leading-7 text-[var(--app-text-soft)]">
          当前 AI 页面已打开。如果内容暂时没有显示，可以返回选择页重新进入。
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <RouterLink
            to="/select"
            class="rounded-full border border-[var(--app-border)] bg-[var(--app-bg-strong)] px-6 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]"
          >
            {{ t("common.quickSwitchAi") }}
          </RouterLink>
          <RouterLink
            to="/settings"
            class="rounded-full bg-[var(--app-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
          >
            {{ t("common.settings") }}
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
