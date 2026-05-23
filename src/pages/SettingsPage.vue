<script setup lang="ts">
import { computed, ref } from "vue";

import { useI18n } from "../lib/i18n";
import { eventToShortcut, formatShortcutLabel } from "../lib/shortcut";
import { useHotkeyStore } from "../stores/hotkey";
import { usePreferencesStore } from "../stores/preferences";
import type { AppLanguage, ThemeMode, WindowCloseBehavior } from "../types/provider";

const preferences = usePreferencesStore();
const hotkey = useHotkeyStore();
const { t, tCloseBehavior, tLanguage, tThemeMode } = useI18n();

const draftShortcut = ref(preferences.shortcut);
const errorMessage = ref("");
const successMessage = ref("");
const isRecording = ref(false);

const shortcutLabel = computed(() =>
  isRecording.value
    ? t("settingsPage.recordingPrompt")
    : formatShortcutLabel(draftShortcut.value),
);

const availableLanguages: AppLanguage[] = ["zh-CN", "en-US"];
const availableThemeModes: ThemeMode[] = ["system", "light", "dark"];
const availableCloseBehaviors: WindowCloseBehavior[] = ["tray", "quit"];

if (hotkey.startupConflictMessage) {
  errorMessage.value = hotkey.startupConflictMessage;
}

/**
 * 更新主题模式。
 */
async function changeTheme(mode: ThemeMode) {
  errorMessage.value = "";
  successMessage.value = "";
  await preferences.setThemeMode(mode);
  successMessage.value = t("settingsPage.themeUpdated");
}

/**
 * 更新界面语言。
 */
async function changeLanguage(language: AppLanguage) {
  errorMessage.value = "";
  successMessage.value = "";
  await preferences.setLanguage(language);
}

/**
 * 更新系统开机自启状态。
 */
async function changeAutoStartEnabled(nextEnabled: boolean) {
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await preferences.setAutoStartEnabled(nextEnabled);
    successMessage.value = t("settingsPage.autoStartUpdated");
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t("settingsPage.autoStartUpdateFailed");
  }
}

/**
 * 更新静默启动开关。
 */
async function changeSilentLaunchEnabled(nextEnabled: boolean) {
  errorMessage.value = "";
  successMessage.value = "";
  await preferences.setSilentLaunchEnabled(nextEnabled);
  successMessage.value = t("settingsPage.silentLaunchUpdated");
}

/**
 * 更新关闭主窗口时的默认行为。
 */
async function changeCloseBehavior(nextBehavior: WindowCloseBehavior) {
  errorMessage.value = "";
  successMessage.value = "";
  await preferences.setCloseBehavior(nextBehavior);
  successMessage.value = t("settingsPage.closeBehaviorUpdated");
}

/**
 * 更新关闭前是否继续弹出确认提示。
 */
async function changeClosePromptEnabled(nextEnabled: boolean) {
  errorMessage.value = "";
  successMessage.value = "";
  await preferences.setClosePromptEnabled(nextEnabled);
  successMessage.value = t("settingsPage.closePromptUpdated");
}

/**
 * 处理关闭提示开关切换。
 */
function handleClosePromptChange(event: globalThis.Event) {
  const target = event.target;
  if (!(target instanceof globalThis.HTMLInputElement)) {
    return;
  }

  void changeClosePromptEnabled(target.checked);
}

/**
 * 处理开机自启开关切换。
 */
function handleAutoStartChange(event: globalThis.Event) {
  const target = event.target;
  if (!(target instanceof globalThis.HTMLInputElement)) {
    return;
  }

  void changeAutoStartEnabled(target.checked);
}

/**
 * 处理静默启动开关切换。
 */
function handleSilentLaunchChange(event: globalThis.Event) {
  const target = event.target;
  if (!(target instanceof globalThis.HTMLInputElement)) {
    return;
  }

  void changeSilentLaunchEnabled(target.checked);
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
    successMessage.value = t("settingsPage.shortcutUpdated");
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t("settingsPage.shortcutUpdateFailed");
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
    errorMessage.value = t("settingsPage.invalidShortcut");
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
  <section class="scrollbar-hidden h-full overflow-y-auto overflow-x-hidden px-6 py-8">
    <div class="mx-auto flex max-w-[900px] flex-col gap-6">
      <div>
        <div class="font-display text-[2rem] tracking-[0.14em] text-[var(--app-text)]">
          {{ t("settingsPage.title") }}
        </div>
        <div class="mt-2 text-sm text-[var(--app-text-soft)]">
          {{ t("settingsPage.description") }}
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <article class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] p-5">
          <div class="text-sm uppercase tracking-[0.22em] text-[var(--app-text-soft)]">
            {{ t("settingsPage.hotkeyEyebrow") }}
          </div>
          <div class="mt-3 text-lg font-semibold text-[var(--app-text)]">
            {{ t("settingsPage.hotkeyTitle") }}
          </div>
          <div class="mt-2 text-sm text-[var(--app-text-soft)]">
            {{ t("settingsPage.hotkeyDescription") }}
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
                {{ isRecording ? t("settingsPage.recording") : t("settingsPage.clickToRecord") }}
              </span>
            </button>

            <div class="flex gap-3">
              <button
                class="rounded-full bg-[var(--app-accent)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                @click="startRecording"
              >
                {{ isRecording ? t("settingsPage.waitingKey") : t("settingsPage.recordNewShortcut") }}
              </button>
              <button
                class="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
                @click="resetShortcut"
              >
                {{ t("common.resetDefault") }}
              </button>
            </div>
          </div>
        </article>

        <article class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] p-5">
          <div class="text-sm uppercase tracking-[0.22em] text-[var(--app-text-soft)]">
            {{ t("settingsPage.themeEyebrow") }}
          </div>
          <div class="mt-3 text-lg font-semibold text-[var(--app-text)]">
            {{ t("settingsPage.themeTitle") }}
          </div>
          <div class="mt-2 text-sm text-[var(--app-text-soft)]">
            {{ t("settingsPage.themeDescription") }}
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              v-for="mode in availableThemeModes"
              :key="mode"
              class="rounded-full px-4 py-2 text-sm transition"
              :class="
                preferences.themeMode === mode
                  ? 'bg-[var(--app-accent)] text-white shadow-lg'
                  : 'border border-[var(--app-border)] text-[var(--app-text-soft)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]'
              "
              @click="changeTheme(mode)"
            >
              {{ tThemeMode(mode) }}
            </button>
          </div>
        </article>

        <article class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] p-5 md:col-span-2">
          <div class="text-sm uppercase tracking-[0.22em] text-[var(--app-text-soft)]">
            {{ t("settingsPage.languageEyebrow") }}
          </div>
          <div class="mt-3 text-lg font-semibold text-[var(--app-text)]">
            {{ t("settingsPage.languageTitle") }}
          </div>
          <div class="mt-2 text-sm text-[var(--app-text-soft)]">
            {{ t("settingsPage.languageDescription") }}
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              v-for="language in availableLanguages"
              :key="language"
              class="rounded-full px-4 py-2 text-sm transition"
              :class="
                preferences.language === language
                  ? 'bg-[var(--app-accent)] text-white shadow-lg'
                  : 'border border-[var(--app-border)] text-[var(--app-text-soft)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]'
              "
              @click="changeLanguage(language)"
            >
              {{ tLanguage(language) }}
            </button>
          </div>
        </article>

        <article class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] p-5 md:col-span-2">
          <div class="text-sm uppercase tracking-[0.22em] text-[var(--app-text-soft)]">
            {{ t("settingsPage.launchEyebrow") }}
          </div>

          <div class="mt-5 grid gap-4">
            <label
              class="flex items-center gap-4 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-5 py-4 transition hover:border-[rgba(22,186,128,0.32)] hover:bg-[var(--app-accent-soft)]"
            >
              <span
                class="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] border border-[var(--app-border)] bg-[rgba(255,255,255,0.72)] text-[rgb(255,122,26)] shadow-[0_10px_24px_rgba(18,24,33,0.08)]"
              >
                <svg
                  aria-hidden="true"
                  class="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.9"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 3v8" />
                  <path d="M7.05 5.95a8 8 0 1 0 9.9 0" />
                </svg>
              </span>

              <span class="min-w-0 flex-1">
                <span class="block text-lg font-semibold text-[var(--app-text)]">
                  {{ t("settingsPage.autoStartTitle") }}
                </span>
                <span class="mt-1 block text-sm leading-6 text-[var(--app-text-soft)]">
                  {{ t("settingsPage.autoStartDescription") }}
                </span>
              </span>

              <span class="relative inline-flex h-8 w-14 shrink-0 items-center">
                <input
                  class="peer sr-only"
                  type="checkbox"
                  :checked="preferences.autoStartEnabled"
                  @change="handleAutoStartChange"
                >
                <span
                  class="absolute inset-0 rounded-full transition"
                  :class="
                    preferences.autoStartEnabled
                      ? 'bg-[rgb(22,186,128)] shadow-[0_10px_24px_rgba(22,186,128,0.25)]'
                      : 'bg-[rgba(126,141,156,0.32)]'
                  "
                />
                <span
                  class="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-[0_6px_18px_rgba(18,24,33,0.18)] transition"
                  :class="preferences.autoStartEnabled ? 'translate-x-6' : 'translate-x-0'"
                />
              </span>
            </label>

            <label
              class="flex items-center gap-4 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-5 py-4 transition hover:border-[rgba(22,186,128,0.32)] hover:bg-[var(--app-accent-soft)]"
            >
              <span
                class="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] border border-[var(--app-border)] bg-[rgba(255,255,255,0.72)] text-[rgb(22,186,128)] shadow-[0_10px_24px_rgba(18,24,33,0.08)]"
              >
                <svg
                  aria-hidden="true"
                  class="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.9"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M2 12s3.6-6 10-6c2.15 0 4.02.67 5.58 1.65" />
                  <path d="M22 12s-3.6 6-10 6c-2.15 0-4.02-.67-5.58-1.65" />
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M3 3l18 18" />
                </svg>
              </span>

              <span class="min-w-0 flex-1">
                <span class="block text-lg font-semibold text-[var(--app-text)]">
                  {{ t("settingsPage.silentLaunchTitle") }}
                </span>
                <span class="mt-1 block text-sm leading-6 text-[var(--app-text-soft)]">
                  {{ t("settingsPage.silentLaunchDescription") }}
                </span>
              </span>

              <span class="relative inline-flex h-8 w-14 shrink-0 items-center">
                <input
                  class="peer sr-only"
                  type="checkbox"
                  :checked="preferences.silentLaunchEnabled"
                  @change="handleSilentLaunchChange"
                >
                <span
                  class="absolute inset-0 rounded-full transition"
                  :class="
                    preferences.silentLaunchEnabled
                      ? 'bg-[rgb(22,186,128)] shadow-[0_10px_24px_rgba(22,186,128,0.25)]'
                      : 'bg-[rgba(126,141,156,0.32)]'
                  "
                />
                <span
                  class="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-[0_6px_18px_rgba(18,24,33,0.18)] transition"
                  :class="preferences.silentLaunchEnabled ? 'translate-x-6' : 'translate-x-0'"
                />
              </span>
            </label>
          </div>
        </article>

        <article class="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] p-5 md:col-span-2">
          <div class="text-sm uppercase tracking-[0.22em] text-[var(--app-text-soft)]">
            {{ t("settingsPage.closeEyebrow") }}
          </div>
          <div class="mt-3 text-lg font-semibold text-[var(--app-text)]">
            {{ t("settingsPage.closeTitle") }}
          </div>
          <div class="mt-2 text-sm text-[var(--app-text-soft)]">
            {{ t("settingsPage.closeDescription") }}
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              v-for="behavior in availableCloseBehaviors"
              :key="behavior"
              class="rounded-full px-4 py-2 text-sm transition"
              :class="
                preferences.closeBehavior === behavior
                  ? 'bg-[var(--app-accent)] text-white shadow-lg'
                  : 'border border-[var(--app-border)] text-[var(--app-text-soft)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]'
              "
              @click="changeCloseBehavior(behavior)"
            >
              {{ tCloseBehavior(behavior) }}
            </button>
          </div>

          <label
            class="mt-5 flex items-start gap-3 rounded-[16px] border border-[var(--app-border)] px-4 py-3 transition hover:bg-[var(--app-accent-soft)]"
          >
            <input
              class="mt-1 h-4 w-4 accent-[var(--app-accent)]"
              type="checkbox"
              :checked="preferences.closePromptEnabled"
              @change="handleClosePromptChange"
            >
            <span>
              <span class="block text-sm font-semibold text-[var(--app-text)]">
                {{ t("settingsPage.closePromptLabel") }}
              </span>
              <span class="mt-1 block text-sm text-[var(--app-text-soft)]">
                {{ t("settingsPage.closePromptDescription") }}
              </span>
            </span>
          </label>
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
