<script setup lang="ts">
import { computed, ref } from "vue";
import { z } from "zod";

import { useI18n } from "../lib/i18n";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [payload: { name: string; url: string }];
}>();

const form = ref({
  name: "",
  url: "",
});
const errorMessage = ref("");

const { t } = useI18n();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

/**
 * 获取当前语言下的表单校验规则。
 */
function createSchema() {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("customDialog.validationNameRequired"))
      .max(40, t("customDialog.validationNameTooLong")),
    url: z
      .string()
      .trim()
      .url(t("customDialog.validationUrlInvalid"))
      .refine(
        (value) => /^https?:\/\//.test(value),
        t("customDialog.validationUrlProtocol"),
      ),
  });
}

/**
 * 关闭弹框并清理输入。
 */
function closeDialog() {
  visible.value = false;
  errorMessage.value = "";
  form.value = {
    name: "",
    url: "",
  };
}

/**
 * 保存自定义渠道。
 */
function saveProvider() {
  const parsed = createSchema().safeParse(form.value);
  if (!parsed.success) {
    errorMessage.value =
      parsed.error.issues[0]?.message ?? t("customDialog.validationGeneric");
    return;
  }

  emit("save", {
    name: parsed.data.name,
    url: parsed.data.url,
  });
  closeDialog();
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.36)] px-4"
      @click.self="closeDialog"
    >
      <div class="w-full max-w-[460px] rounded-[22px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-6 shadow-[var(--app-shadow)] backdrop-blur-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-display text-[1.4rem] tracking-[0.08em] text-[var(--app-text)]">
              {{ t("customDialog.title") }}
            </div>
            <div class="mt-2 text-sm text-[var(--app-text-soft)]">
              {{ t("customDialog.description") }}
            </div>
          </div>

          <button
            class="rounded-full px-3 py-1.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
            @click="closeDialog"
          >
            {{ t("common.close") }}
          </button>
        </div>

        <div class="mt-6 flex flex-col gap-4">
          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium text-[var(--app-text)]">{{ t("customDialog.nameLabel") }}</span>
            <input
              v-model="form.name"
              class="rounded-[16px] border border-[var(--app-border)] bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--app-accent)]"
              :placeholder="t('customDialog.namePlaceholder')"
            >
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium text-[var(--app-text)]">{{ t("customDialog.urlLabel") }}</span>
            <input
              v-model="form.url"
              class="rounded-[16px] border border-[var(--app-border)] bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--app-accent)]"
              :placeholder="t('customDialog.urlPlaceholder')"
            >
          </label>
        </div>

        <div
          v-if="errorMessage"
          class="mt-4 rounded-[16px] border border-[rgba(193,68,55,0.22)] bg-[rgba(193,68,55,0.08)] px-4 py-3 text-sm text-[rgb(193,68,55)]"
        >
          {{ errorMessage }}
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            class="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
            @click="closeDialog"
          >
            {{ t("common.cancel") }}
          </button>
          <button
            class="rounded-full bg-[var(--app-accent)] px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
            @click="saveProvider"
          >
            {{ t("common.save") }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
