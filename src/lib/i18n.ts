import { computed } from "vue";

import { usePreferencesStore } from "../stores/preferences";
import type { AppLanguage, ProviderCamp, ThemeMode } from "../types/provider";

type TranslationNode = {
  [key: string]: string | TranslationNode;
};

const messages = {
  "zh-CN": {
    common: {
      appName: "AIClientCore",
      selectAi: "选择 AI",
      currentAi: "当前 AI",
      settings: "设置",
      close: "关闭",
      cancel: "取消",
      save: "保存",
      resetDefault: "恢复默认",
      quickSwitchAi: "快速切换 AI",
      collapseHeader: "收起头部",
      addCustomChannel: "自定义 AI 渠道",
      language: "语言",
    },
    camp: {
      domestic: "国产派",
      international: "国际派",
      custom: "自定义",
    },
    campBadge: {
      domestic: "国产",
      international: "国际",
      custom: "自定义",
    },
    languageOptions: {
      "zh-CN": "简体中文",
      "en-US": "English",
    },
    themeMode: {
      system: "跟随系统",
      light: "浅色",
      dark: "深色",
    },
    appShell: {
      currentAiFallback: "选择 AI",
    },
    workspace: {
      title: "一个桌面，多种模型",
      description:
        "第一次进入时先从模型选择页挑一个入口，后续会直接回到你上次打开的对话页。",
    },
    selection: {
      title: "选择你的 AI",
      description: "用国产派 / 国际派 / 自定义即时重排，把你常用的模型放到第一屏。",
    },
    settingsPage: {
      title: "设置",
      description: "当前只管理全局快捷键、主题模式和界面语言。",
      hotkeyEyebrow: "全局快捷键",
      hotkeyTitle: "切换显示 / 隐藏",
      hotkeyDescription: "点击下方录制区后直接按下新组合键，更新会自动生效。",
      recordingPrompt: "请按下新的快捷键组合",
      recording: "录制中",
      clickToRecord: "点击录制",
      waitingKey: "等待按键...",
      recordNewShortcut: "录制新快捷键",
      themeEyebrow: "主题模式",
      themeTitle: "壳层与 AI 页面同步",
      themeDescription: "默认跟随系统，也支持手动固定浅色或深色。",
      languageEyebrow: "界面语言",
      languageTitle: "中文 / English",
      languageDescription: "切换后会立即更新当前界面的所有文案。",
      themeUpdated: "主题已更新。",
      shortcutUpdated: "快捷键已更新。",
      shortcutUpdateFailed: "快捷键更新失败。",
      invalidShortcut: "请至少包含一个修饰键和一个主按键。",
    },
    customDialog: {
      title: "添加自定义 AI",
      description: "输入名称和链接地址，保存后会自动加入列表并尝试使用网页图标。",
      nameLabel: "名称",
      urlLabel: "链接地址",
      namePlaceholder: "例如：Groq Chat",
      urlPlaceholder: "https://example.com/chat",
      validationNameRequired: "请输入渠道名称。",
      validationNameTooLong: "名称请控制在 40 字以内。",
      validationUrlInvalid: "请输入有效的链接地址。",
      validationUrlProtocol: "链接必须以 http:// 或 https:// 开头。",
      validationGeneric: "表单校验失败。",
    },
    hotkey: {
      alreadyRegistered: "该快捷键已被当前应用或其他软件占用。",
    },
    providers: {
      deepseekDescription: "深度推理优先，适合技术问答与结构化输出。",
      doubaoDescription: "字节系通用助手，适合日常对话与写作草稿。",
      tongyiDescription: "阿里系模型入口，适合通用办公与代码协作。",
      yiyanDescription: "百度系会话入口，适合中文场景与知识问答。",
      kimiDescription: "长上下文优势明显，适合读文档与长内容整理。",
      chatgptDescription: "国际通用首选，适合创作、推理与代码协作。",
      geminiDescription: "Google 生态连接强，适合搜索协作与多模态场景。",
      claudeDescription: "长文本与写作体验突出，适合分析与润色。",
      copilotDescription: "微软生态协同能力强，适合办公与搜索融合。",
      perplexityDescription: "偏检索与来源整合，适合快速查证。",
      customDescriptionWithHost: "自定义渠道 · {host}",
      customDescriptionFallback: "自定义渠道",
    },
  },
  "en-US": {
    common: {
      appName: "AIClientCore",
      selectAi: "Select AI",
      currentAi: "Current AI",
      settings: "Settings",
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      resetDefault: "Reset Default",
      quickSwitchAi: "Switch AI",
      collapseHeader: "Collapse Header",
      addCustomChannel: "Custom AI Channel",
      language: "Language",
    },
    camp: {
      domestic: "Domestic",
      international: "International",
      custom: "Custom",
    },
    campBadge: {
      domestic: "CN",
      international: "INTL",
      custom: "CUSTOM",
    },
    languageOptions: {
      "zh-CN": "简体中文",
      "en-US": "English",
    },
    themeMode: {
      system: "Follow System",
      light: "Light",
      dark: "Dark",
    },
    appShell: {
      currentAiFallback: "Select AI",
    },
    workspace: {
      title: "One Desktop, Many Models",
      description:
        "Choose one entry from the model list the first time, and the app will return to your last opened AI page afterward.",
    },
    selection: {
      title: "Pick Your AI",
      description:
        "Reorder the list instantly with Domestic / International / Custom so your most used models stay on the first screen.",
    },
    settingsPage: {
      title: "Settings",
      description: "Manage global hotkeys, theme mode, and interface language here.",
      hotkeyEyebrow: "Global Hotkey",
      hotkeyTitle: "Toggle Show / Hide",
      hotkeyDescription:
        "Click the recorder below and press a new shortcut combination. The update takes effect immediately.",
      recordingPrompt: "Press a new shortcut combination",
      recording: "Recording",
      clickToRecord: "Click to Record",
      waitingKey: "Waiting for keys...",
      recordNewShortcut: "Record New Shortcut",
      themeEyebrow: "Theme Mode",
      themeTitle: "Sync Shell and AI Pages",
      themeDescription: "Follow the system by default, or force light / dark mode manually.",
      languageEyebrow: "Interface Language",
      languageTitle: "Chinese / English",
      languageDescription: "Switching updates all visible UI copy immediately.",
      themeUpdated: "Theme updated.",
      shortcutUpdated: "Shortcut updated.",
      shortcutUpdateFailed: "Failed to update shortcut.",
      invalidShortcut: "Use at least one modifier key and one main key.",
    },
    customDialog: {
      title: "Add Custom AI",
      description:
        "Enter a name and URL. After saving, it will be added to the list and try to use the website icon.",
      nameLabel: "Name",
      urlLabel: "URL",
      namePlaceholder: "Example: Groq Chat",
      urlPlaceholder: "https://example.com/chat",
      validationNameRequired: "Please enter a channel name.",
      validationNameTooLong: "Keep the name within 40 characters.",
      validationUrlInvalid: "Please enter a valid URL.",
      validationUrlProtocol: "The URL must start with http:// or https://.",
      validationGeneric: "Form validation failed.",
    },
    hotkey: {
      alreadyRegistered: "This shortcut is already in use by this app or another app.",
    },
    providers: {
      deepseekDescription: "Reasoning-first experience for technical Q&A and structured output.",
      doubaoDescription: "A ByteDance assistant that works well for daily chat and writing drafts.",
      tongyiDescription: "Alibaba's model portal for general work and coding collaboration.",
      yiyanDescription: "Baidu's conversation entry, especially useful for Chinese knowledge tasks.",
      kimiDescription: "Strong long-context experience for reading docs and organizing long content.",
      chatgptDescription: "A strong general international choice for creation, reasoning, and coding.",
      geminiDescription: "Well connected to the Google ecosystem for search and multimodal workflows.",
      claudeDescription: "Excellent for long-form writing, analysis, and editing.",
      copilotDescription: "Strong Microsoft ecosystem synergy for office and search workflows.",
      perplexityDescription: "Great for retrieval-focused tasks and fast source-backed verification.",
      customDescriptionWithHost: "Custom channel · {host}",
      customDescriptionFallback: "Custom channel",
    },
  },
} as const satisfies Record<AppLanguage, TranslationNode>;

function getMessage(language: AppLanguage, key: string) {
  const result = key
    .split(".")
    .reduce<string | TranslationNode | undefined>((currentValue, currentKey) => {
      if (
        currentValue &&
        typeof currentValue === "object" &&
        currentKey in currentValue
      ) {
        return currentValue[currentKey];
      }

      return undefined;
    }, messages[language]);

  return typeof result === "string" ? result : key;
}

export function translate(
  language: AppLanguage,
  key: string,
  params?: Record<string, string | number>,
) {
  let template = getMessage(language, key);

  if (!params) {
    return template;
  }

  for (const [paramKey, paramValue] of Object.entries(params)) {
    template = template.split(`{${paramKey}}`).join(String(paramValue));
  }

  return template;
}

export function useI18n() {
  const preferences = usePreferencesStore();
  const language = computed(() => preferences.language);

  function t(key: string, params?: Record<string, string | number>) {
    return translate(language.value, key, params);
  }

  function tCamp(camp: ProviderCamp) {
    return t(`camp.${camp}`);
  }

  function tCampBadge(camp: ProviderCamp) {
    return t(`campBadge.${camp}`);
  }

  function tThemeMode(mode: ThemeMode) {
    return t(`themeMode.${mode}`);
  }

  function tLanguage(nextLanguage: AppLanguage) {
    return t(`languageOptions.${nextLanguage}`);
  }

  return {
    language,
    t,
    tCamp,
    tCampBadge,
    tThemeMode,
    tLanguage,
  };
}
