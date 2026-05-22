<script setup lang="ts">
import { computed, ref } from "vue";

import { useI18n } from "../lib/i18n";
import type { ProviderDefinition } from "../types/provider";

const props = defineProps<{
  provider: ProviderDefinition;
}>();

const emit = defineEmits<{
  select: [];
  remove: [providerId: string];
}>();

const iconLoadFailed = ref(false);
const { language, tCampBadge } = useI18n();
const deleteLabel = computed(() =>
  language.value === "zh-CN" ? "删除" : "Delete",
);

/**
 * 记录图标加载失败，失败后留空展示。
 */
function markIconFailed() {
  iconLoadFailed.value = true;
}

/**
 * 选择当前 provider。
 */
function selectProvider() {
  emit("select");
}

/**
 * 删除自定义 provider。
 */
function deleteProvider() {
  emit("remove", props.provider.id);
}
</script>

<template>
  <div class="group relative isolate w-full">
    <button
      class="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] px-5 py-4 text-left transition duration-300 hover:-translate-y-[1px] hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]"
      @click="selectProvider"
    >
      <div class="flex h-12 w-12 overflow-hidden rounded-[16px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm">
        <img
          v-if="props.provider.iconUrl && !iconLoadFailed"
          :src="props.provider.iconUrl"
          :alt="props.provider.name"
          class="m-auto h-7 w-7 object-contain"
          referrerpolicy="no-referrer"
          @error="markIconFailed"
        >
      </div>

      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <div class="text-base font-semibold text-[var(--app-text)]">
            {{ props.provider.name }}
          </div>
          <span
            class="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
            :class="
              props.provider.camp === 'domestic'
                ? 'bg-[rgba(209,116,62,0.12)] text-[var(--app-accent)]'
                : props.provider.camp === 'international'
                  ? 'bg-[rgba(50,109,180,0.12)] text-[rgba(50,109,180,1)]'
                  : 'bg-[rgba(95,125,88,0.12)] text-[rgb(95,125,88)]'
            "
          >
            {{ tCampBadge(props.provider.camp) }}
          </span>
        </div>
        <div class="mt-1 truncate text-sm text-[var(--app-text-soft)]">
          {{ props.provider.description }}
        </div>
      </div>

      <div class="text-2xl text-[var(--app-text-soft)] transition group-hover:translate-x-1 group-hover:text-[var(--app-accent)]">
        →
      </div>
    </button>

    <button
      v-if="props.provider.isCustom"
      class="pointer-events-none absolute -right-1 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[rgb(193,68,55)] bg-[rgb(255,244,242)] text-[rgb(193,68,55)] opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-[rgb(255,236,233)]"
      :aria-label="deleteLabel"
      :title="deleteLabel"
      @click.stop.prevent="deleteProvider"
    >
      <svg
        class="h-3.5 w-3.5"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 5L11 11M11 5L5 11"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="1.5"
        />
      </svg>
    </button>
  </div>
</template>
