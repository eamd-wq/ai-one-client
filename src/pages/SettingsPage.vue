<script setup lang="ts">
import { computed, ref } from "vue";

import { eventToShortcut, formatShortcutLabel } from "../lib/shortcut";
import { useHotkeyStore } from "../stores/hotkey";
import { usePreferencesStore } from "../stores/preferences";
import type { ThemeMode } from "../types/provider";

const preferences = usePreferencesStore();
const hotkey = useHotkeyStore();

const draftShortcut = ref(preferences.shortcut);
const errorMessage = ref("");
const successMessage = ref("");
const isRecording = ref(false);

const shortcutLabel = computed(() =>
  isRecording.value ? "请按下新的快捷键组合" : formatShortcutLabel(draftShortcut.value),
);

/**
 * 更新主题模式。
 */
async function changeTheme(mode: ThemeMode) {
  errorMessage.value = "";
  successMessage.value = "";
  await preferences.setThemeMode(mode);
  successMessage.value = "主题已更新。";
}

/**
 * 应用新的快捷键设置。
 */
async function applyShortcut(nextShortcut: string) {
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await hotkey.updateShortcut(nextShortcut);
    draftShortcut.value = nextShortcut;
    successMessage.value = "快捷键已更新。";
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "快捷键更新失败。";
  }
}

/**
 * 开始录制快捷键。
 */
function startRecording() {
  errorMessage.value = "";
  successMessage.value = "";
  isRecording.value = true;
}

/**
 * 停止录制快捷键。
 */
function stopRecording() {
  isRecording.value = false;
}

/**
 * 处理快捷键录制事件。
 */
async function handleShortcutKeydown(event: globalThis.KeyboardEvent) {
  if (!isRecording.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape") {
    stopRecording();
    return;
  }

  const nextShortcut = eventToShortcut(event);
  if (!nextShortcut) {
    errorMessage.value = "请至少包含一个修饰键和一个主按键。";
    return;
  }

  stopRecording();
  await applyShortcut(nextShortcut);
}

/**
 * 恢复默认快捷键。
 */
async function resetShortcut() {
  stopRecording();
  await applyShortcut("Shift+Alt+W");
}
</script>

<template>
  <section class="h-full overflow-auto px-6 py-8">
    <div class="mx-auto flex max-w-[900px] flex-col gap-6">
      <div>
        <div class="font-display text-[2rem] tracking-[0.14em] text-[var(--app-text)]">
          SETTINGS
        </div>
        <div class="mt-2 text-sm text-[var(--app-text-soft)]">
          当前只管理全局快捷键与主题模式。
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <article class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] p-5">
          <div class="text-sm uppercase tracking-[0.22em] text-[var(--app-text-soft)]">
            全局快捷键
          </div>
          <div class="mt-3 text-lg font-semibold text-[var(--app-text)]">
            切换显示 / 隐藏
          </div>
          <div class="mt-2 text-sm text-[var(--app-text-soft)]">
            点击下方录制区后直接按下新组合键，更新会自动生效。
          </div>

          <div class="mt-5 flex flex-col gap-3">
            <button
              class="flex min-h-[52px] w-full items-center justify-between rounded-[16px] border border-[var(--app-border)] bg-transparent px-4 py-3 text-left transition focus:outline-none"
              :class="
                isRecording
                  ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)]'
                  : 'hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]'
              "
              @click="startRecording"
              @blur="stopRecording"
              @keydown="handleShortcutKeydown"
            >
              <span class="text-sm font-semibold text-[var(--app-text)]">
                {{ shortcutLabel }}
              </span>
              <span class="text-xs text-[var(--app-text-soft)]">
                {{ isRecording ? "录制中" : "点击录制" }}
              </span>
            </button>

            <div class="flex gap-3">
              <button
                class="rounded-full bg-[var(--app-accent)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                @click="startRecording"
              >
                {{ isRecording ? "等待按键..." : "录制新快捷键" }}
              </button>
              <button
                class="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
                @click="resetShortcut"
              >
                恢复默认
              </button>
            </div>
          </div>
        </article>

        <article class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] p-5">
          <div class="text-sm uppercase tracking-[0.22em] text-[var(--app-text-soft)]">
            主题模式
          </div>
          <div class="mt-3 text-lg font-semibold text-[var(--app-text)]">
            壳层与 AI 页面同步
          </div>
          <div class="mt-2 text-sm text-[var(--app-text-soft)]">
            默认跟随系统，也支持手动固定浅色或深色。
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              v-for="mode in ['system', 'light', 'dark']"
              :key="mode"
              class="rounded-full px-4 py-2 text-sm transition"
              :class="
                preferences.themeMode === mode
                  ? 'bg-[var(--app-accent)] text-white shadow-lg'
                  : 'border border-[var(--app-border)] text-[var(--app-text-soft)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]'
              "
              @click="changeTheme(mode as ThemeMode)"
            >
              {{ mode === "system" ? "跟随系统" : mode === "light" ? "浅色" : "深色" }}
            </button>
          </div>
        </article>
      </div>

      <div
        v-if="errorMessage || successMessage"
        class="rounded-[16px] border px-4 py-3 text-sm"
        :class="
          errorMessage
            ? 'border-[rgba(193,68,55,0.22)] bg-[rgba(193,68,55,0.08)] text-[rgb(193,68,55)]'
            : 'border-[rgba(64,145,103,0.22)] bg-[rgba(64,145,103,0.08)] text-[rgb(64,145,103)]'
        "
      >
        {{ errorMessage || successMessage }}
      </div>
    </div>
  </section>
</template>
