<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import CampSwitch from "../components/CampSwitch.vue";
import CustomProviderDialog from "../components/CustomProviderDialog.vue";
import ProviderListItem from "../components/ProviderListItem.vue";
import { getProviderCatalog, sortProvidersByCamp } from "../features/providers/providers";
import { useI18n } from "../lib/i18n";
import { usePreferencesStore } from "../stores/preferences";
import { useWorkspaceStore } from "../stores/workspace";
import type { ProviderCamp } from "../types/provider";

const router = useRouter();
const preferences = usePreferencesStore();
const workspace = useWorkspaceStore();
const { t } = useI18n();

const customDialogOpen = ref(false);

const availableCamps = computed<ProviderCamp[]>(() => {
  const camps: ProviderCamp[] = ["domestic", "international"];

  if (preferences.customProviders.length > 0) {
    camps.push("custom");
  }

  return camps;
});

const providerCatalog = computed(() =>
  getProviderCatalog(preferences.language, preferences.customProviders),
);

const sortedProviders = computed(() =>
  sortProvidersByCamp(providerCatalog.value, preferences.camp),
);

/**
 * 切换阵营偏好。
 */
async function updateCamp(value: ProviderCamp) {
  await preferences.setCamp(value);
}

/**
 * 打开新增自定义渠道弹框。
 */
function openCustomDialog() {
  customDialogOpen.value = true;
}

/**
 * 保存新的自定义渠道。
 */
async function saveCustomProvider(payload: { name: string; url: string }) {
  await preferences.addCustomProvider(payload);
  await preferences.setCamp("custom");
}

/**
 * 删除自定义 AI 渠道。
 */
async function removeCustomProvider(providerId: string) {
  await workspace.removeProvider(providerId);
  await preferences.removeCustomProvider(providerId);
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
  <section class="flex h-full min-h-0 flex-col overflow-hidden px-6 py-8">
    <div class="mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col">
      <div class="flex flex-col items-center text-center">
        <div class="text-center">
          <p class="font-display text-[2.6rem] leading-none tracking-[0.18em] text-[var(--app-text)]">
            {{ t("selection.title") }}
          </p>
          <p class="mt-3 text-sm text-[var(--app-text-soft)]">
            {{ t("selection.description") }}
          </p>
        </div>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <CampSwitch
            :camps="availableCamps"
            :model-value="preferences.camp"
            @update:model-value="updateCamp"
          />

          <button
            class="rounded-full border border-[var(--app-border)] bg-[var(--app-bg-strong)] px-4 py-2 text-sm text-[var(--app-text)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]"
            @click="openCustomDialog"
          >
            {{ t("common.addCustomChannel") }}
          </button>
        </div>
      </div>

      <div class="scrollbar-hidden mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        <div class="flex w-full flex-col gap-3 pb-2 pt-3">
          <ProviderListItem
            v-for="provider in sortedProviders"
            :key="provider.id"
            :provider="provider"
            @select="selectProvider(provider.id)"
            @remove="removeCustomProvider"
          />
        </div>
      </div>
    </div>

    <CustomProviderDialog
      v-model="customDialogOpen"
      @save="saveCustomProvider"
    />
  </section>
</template>
