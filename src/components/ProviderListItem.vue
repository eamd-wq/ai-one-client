<script setup lang="ts">
import type { ProviderDefinition } from "../types/provider";

defineProps<{
  provider: ProviderDefinition;
}>();

const emit = defineEmits<{
  select: [];
}>();
</script>

<template>
  <button
    class="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] px-5 py-4 text-left transition duration-300 hover:-translate-y-[1px] hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]"
    @click="emit('select')"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-[16px] text-sm font-bold text-white shadow-lg"
      :style="{ background: `linear-gradient(135deg, ${provider.accent}, rgba(255,255,255,0.35))` }"
    >
      {{ provider.badge }}
    </div>

    <div class="min-w-0">
      <div class="flex items-center gap-3">
        <div class="text-base font-semibold text-[var(--app-text)]">
          {{ provider.name }}
        </div>
        <span
          class="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
          :class="
            provider.camp === 'domestic'
              ? 'bg-[rgba(209,116,62,0.12)] text-[var(--app-accent)]'
              : 'bg-[rgba(50,109,180,0.12)] text-[rgba(50,109,180,1)]'
          "
        >
          {{ provider.camp === "domestic" ? "国产" : "国际" }}
        </span>
      </div>
      <div class="mt-1 truncate text-sm text-[var(--app-text-soft)]">
        {{ provider.description }}
      </div>
    </div>

    <div class="text-2xl text-[var(--app-text-soft)] transition group-hover:translate-x-1 group-hover:text-[var(--app-accent)]">
      →
    </div>
  </button>
</template>
