<script setup lang="ts">
import type { ProviderCamp } from "../types/provider";

const props = defineProps<{
  camps: ProviderCamp[];
  modelValue: ProviderCamp;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ProviderCamp];
}>();

const labelMap: Record<ProviderCamp, string> = {
  domestic: "国产派",
  international: "国际派",
  custom: "自定义",
};

/**
 * 切换阵营偏好。
 */
function selectCamp(camp: ProviderCamp) {
  emit("update:modelValue", camp);
}
</script>

<template>
  <div class="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-bg-strong)] p-1">
    <button
      v-for="camp in props.camps"
      :key="camp"
      class="rounded-full px-5 py-2 text-sm transition"
      :class="
        props.modelValue === camp
          ? 'bg-[var(--app-accent)] text-white shadow-md'
          : 'text-[var(--app-text-soft)] hover:text-[var(--app-text)]'
      "
      @click="selectCamp(camp)"
    >
      {{ labelMap[camp] }}
    </button>
  </div>
</template>
