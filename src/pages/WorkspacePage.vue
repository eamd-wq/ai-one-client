<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import { useWorkspaceStore } from "../stores/workspace";

const workspace = useWorkspaceStore();

const emptyState = computed(() => !workspace.activeProviderId);
</script>

<template>
  <section class="h-full">
    <div
      v-if="emptyState"
      class="grid h-full place-items-center px-6 py-8"
    >
      <div class="max-w-[620px] text-center">
        <div class="font-display text-[3rem] tracking-[0.16em] text-[var(--app-text)]">
          ONE DESKTOP, MANY MODELS
        </div>
        <p class="mx-auto mt-4 max-w-[520px] text-sm leading-7 text-[var(--app-text-soft)]">
          这是你的 AI 聚合工作台。第一次进入时先从模型选择页挑一个入口，后续会直接回到你上次打开的对话页。
        </p>
        <RouterLink
          to="/select"
          class="mt-8 inline-flex rounded-full bg-[var(--app-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
        >
          选择 AI
        </RouterLink>
      </div>
    </div>
  </section>
</template>
