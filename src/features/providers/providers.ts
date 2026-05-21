import { translate } from "../../lib/i18n";
import type {
  AppLanguage,
  CustomProviderRecord,
  ProviderCamp,
  ProviderDefinition,
} from "../../types/provider";

type BuiltinProviderSeed = {
  id: string;
  camp: ProviderCamp;
  url: string;
  name: Record<AppLanguage, string>;
  descriptionKey: string;
};

const builtinProviders: BuiltinProviderSeed[] = [
  {
    id: "deepseek",
    camp: "domestic",
    url: "https://chat.deepseek.com/",
    name: {
      "zh-CN": "DeepSeek",
      "en-US": "DeepSeek",
    },
    descriptionKey: "providers.deepseekDescription",
  },
  {
    id: "doubao",
    camp: "domestic",
    url: "https://www.doubao.com/chat/",
    name: {
      "zh-CN": "豆包",
      "en-US": "Doubao",
    },
    descriptionKey: "providers.doubaoDescription",
  },
  {
    id: "tongyi",
    camp: "domestic",
    url: "https://tongyi.aliyun.com/qianwen/",
    name: {
      "zh-CN": "通义千问",
      "en-US": "Tongyi Qianwen",
    },
    descriptionKey: "providers.tongyiDescription",
  },
  {
    id: "yiyan",
    camp: "domestic",
    url: "https://yiyan.baidu.com/",
    name: {
      "zh-CN": "文心一言",
      "en-US": "ERNIE Bot",
    },
    descriptionKey: "providers.yiyanDescription",
  },
  {
    id: "kimi",
    camp: "domestic",
    url: "https://kimi.moonshot.cn/",
    name: {
      "zh-CN": "Kimi",
      "en-US": "Kimi",
    },
    descriptionKey: "providers.kimiDescription",
  },
  {
    id: "chatgpt",
    camp: "international",
    url: "https://chatgpt.com/",
    name: {
      "zh-CN": "ChatGPT",
      "en-US": "ChatGPT",
    },
    descriptionKey: "providers.chatgptDescription",
  },
  {
    id: "gemini",
    camp: "international",
    url: "https://gemini.google.com/",
    name: {
      "zh-CN": "Gemini",
      "en-US": "Gemini",
    },
    descriptionKey: "providers.geminiDescription",
  },
  {
    id: "claude",
    camp: "international",
    url: "https://claude.ai/",
    name: {
      "zh-CN": "Claude",
      "en-US": "Claude",
    },
    descriptionKey: "providers.claudeDescription",
  },
  {
    id: "copilot",
    camp: "international",
    url: "https://copilot.microsoft.com/",
    name: {
      "zh-CN": "Copilot",
      "en-US": "Copilot",
    },
    descriptionKey: "providers.copilotDescription",
  },
  {
    id: "perplexity",
    camp: "international",
    url: "https://www.perplexity.ai/",
    name: {
      "zh-CN": "Perplexity",
      "en-US": "Perplexity",
    },
    descriptionKey: "providers.perplexityDescription",
  },
];

/**
 * 获取完整 provider 目录。
 */
export function getProviderCatalog(
  language: AppLanguage,
  customProviders: CustomProviderRecord[],
) {
  return [
    ...builtinProviders.map((provider) => createBuiltinProvider(language, provider)),
    ...customProviders.map((provider) => createCustomProvider(language, provider)),
  ];
}

/**
 * 根据 id 获取 provider。
 */
export function getProviderById(
  providerId: string,
  language: AppLanguage,
  customProviders: CustomProviderRecord[],
) {
  return (
    getProviderCatalog(language, customProviders).find((item) => item.id === providerId) ??
    null
  );
}

/**
 * 根据阵营偏好排序提供方列表。
 */
export function sortProvidersByCamp(
  list: ProviderDefinition[],
  preferredCamp: ProviderCamp,
) {
  return [...list].sort((left, right) => {
    const leftScore = left.camp === preferredCamp ? 0 : 1;
    const rightScore = right.camp === preferredCamp ? 0 : 1;

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    if (left.isCustom !== right.isCustom) {
      return left.isCustom ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

/**
 * 根据链接推导站点 favicon 地址。
 */
export function getProviderIconUrl(url: string) {
  try {
    const { origin } = new URL(url);
    return `${origin}/favicon.ico`;
  } catch {
    return null;
  }
}

/**
 * 生成自定义渠道描述。
 */
export function getCustomProviderDescription(language: AppLanguage, url: string) {
  try {
    const { host } = new URL(url);
    return translate(language, "providers.customDescriptionWithHost", { host });
  } catch {
    return translate(language, "providers.customDescriptionFallback");
  }
}

/**
 * 创建内置 provider 定义。
 */
function createBuiltinProvider(
  language: AppLanguage,
  provider: BuiltinProviderSeed,
): ProviderDefinition {
  return {
    id: provider.id,
    name: provider.name[language],
    camp: provider.camp,
    url: provider.url,
    description: translate(language, provider.descriptionKey),
    iconUrl: getProviderIconUrl(provider.url),
  };
}

/**
 * 将持久化的自定义渠道转换为 provider。
 */
function createCustomProvider(
  language: AppLanguage,
  provider: CustomProviderRecord,
): ProviderDefinition {
  return {
    id: provider.id,
    name: provider.name,
    camp: "custom",
    url: provider.url,
    description: getCustomProviderDescription(language, provider.url),
    iconUrl: getProviderIconUrl(provider.url),
    isCustom: true,
  };
}
