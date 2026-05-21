<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import CampSwitch from "../components/CampSwitch.vue";
import ProviderListItem from "../components/ProviderListItem.vue";
import { providers, sortProvidersByCamp } from "../features/providers/providers";
import { usePreferencesStore } from "../stores/preferences";
import { useWorkspaceStore } from "../stores/workspace";

const router = useRouter();
const preferences = usePreferencesStore();
const workspace = useWorkspaceStore();

const sortedProviders = computed(() =>
  sortProvidersByCamp(providers, preferences.camp),
);

/**
 * 切换阵营偏好。
 */
async function updateCamp(value: "domestic" | "international") {
  await preferences.setCamp(value);
}

/**
 * 进入指定 AI 页面。
 */
async function selectProvider(providerId: string) {
  await workspace.openProvider(providerId);
  await router.push("/workspace");
}
</script>

<template>
  <section class="grid h-full place-items-center px-6 py-8">
    <div class="flex w-full max-w-[760px] flex-col items-center">
      <div class="text-center">
        <p class="font-display text-[2.6rem] leading-none tracking-[0.18em] text-[var(--app-text)]">
          PICK YOUR AI
        </p>
        <p class="mt-3 text-sm text-[var(--app-text-soft)]">
          用国产派 / 国际派即时重排，把你常用的模型放到第一屏。
        </p>
      </div>

      <div class="mt-8">
        <CampSwitch
          :model-value="preferences.camp"
          @update:model-value="updateCamp"
        />
      </div>

      <div class="mt-8 flex w-full flex-col gap-3">
        <ProviderListItem
          v-for="provider in sortedProviders"
          :key="provider.id"
          :provider="provider"
          @select="selectProvider(provider.id)"
        />
      </div>
    </div>
  </section>
</template>
