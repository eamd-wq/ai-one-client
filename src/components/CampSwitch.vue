<script setup lang="ts">
import type { ProviderCamp } from "../types/provider";

const props = defineProps<{
  modelValue: ProviderCamp;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ProviderCamp];
}>();

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
      class="rounded-full px-5 py-2 text-sm transition"
      :class="
        props.modelValue === 'domestic'
          ? 'bg-[var(--app-accent)] text-white shadow-md'
          : 'text-[var(--app-text-soft)] hover:text-[var(--app-text)]'
      "
      @click="selectCamp('domestic')"
    >
      国产派
    </button>
    <button
      class="rounded-full px-5 py-2 text-sm transition"
      :class="
        props.modelValue === 'international'
          ? 'bg-[var(--app-accent)] text-white shadow-md'
          : 'text-[var(--app-text-soft)] hover:text-[var(--app-text)]'
      "
      @click="selectCamp('international')"
    >
      国际派
    </button>
  </div>
</template>
