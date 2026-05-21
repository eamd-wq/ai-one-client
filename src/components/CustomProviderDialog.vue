<script setup lang="ts">
import { computed, ref } from "vue";
import { z } from "zod";

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

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const schema = z.object({
  name: z.string().trim().min(1, "请输入渠道名称。").max(40, "名称请控制在 40 字以内。"),
  url: z
    .string()
    .trim()
    .url("请输入有效的链接地址。")
    .refine((value) => /^https?:\/\//.test(value), "链接必须以 http:// 或 https:// 开头。"),
});

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
  const parsed = schema.safeParse(form.value);
  if (!parsed.success) {
    errorMessage.value = parsed.error.issues[0]?.message ?? "表单校验失败。";
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
              添加自定义 AI
            </div>
            <div class="mt-2 text-sm text-[var(--app-text-soft)]">
              输入名称和链接地址，保存后会自动加入列表并尝试使用网页图标。
            </div>
          </div>

          <button
            class="rounded-full px-3 py-1.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
            @click="closeDialog"
          >
            关闭
          </button>
        </div>

        <div class="mt-6 flex flex-col gap-4">
          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium text-[var(--app-text)]">名称</span>
            <input
              v-model="form.name"
              class="rounded-[16px] border border-[var(--app-border)] bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--app-accent)]"
              placeholder="例如：Groq Chat"
            >
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium text-[var(--app-text)]">链接地址</span>
            <input
              v-model="form.url"
              class="rounded-[16px] border border-[var(--app-border)] bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--app-accent)]"
              placeholder="https://example.com/chat"
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
            取消
          </button>
          <button
            class="rounded-full bg-[var(--app-accent)] px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
            @click="saveProvider"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
