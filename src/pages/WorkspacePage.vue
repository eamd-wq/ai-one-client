<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import { useI18n } from "../lib/i18n";
import { useWorkspaceStore } from "../stores/workspace";

const workspace = useWorkspaceStore();
const { t } = useI18n();

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
  </section>
</template>
