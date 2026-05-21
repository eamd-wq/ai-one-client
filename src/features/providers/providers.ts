import type {
  CustomProviderRecord,
  ProviderCamp,
  ProviderDefinition,
} from "../../types/provider";

const builtinProviders: ProviderDefinition[] = [
  createBuiltinProvider({
    id: "deepseek",
    name: "DeepSeek",
    camp: "domestic",
    url: "https://chat.deepseek.com/",
    description: "深度推理优先，适合技术问答与结构化输出。",
  }),
  createBuiltinProvider({
    id: "doubao",
    name: "豆包",
    camp: "domestic",
    url: "https://www.doubao.com/chat/",
    description: "字节系通用助手，适合日常对话与写作草稿。",
  }),
  createBuiltinProvider({
    id: "tongyi",
    name: "通义千问",
    camp: "domestic",
    url: "https://tongyi.aliyun.com/qianwen/",
    description: "阿里系模型入口，适合通用办公与代码协作。",
  }),
  createBuiltinProvider({
    id: "yiyan",
    name: "文心一言",
    camp: "domestic",
    url: "https://yiyan.baidu.com/",
    description: "百度系会话入口，适合中文场景与知识问答。",
  }),
  createBuiltinProvider({
    id: "kimi",
    name: "Kimi",
    camp: "domestic",
    url: "https://kimi.moonshot.cn/",
    description: "长上下文优势明显，适合读文档与长内容整理。",
  }),
  createBuiltinProvider({
    id: "chatgpt",
    name: "ChatGPT",
    camp: "international",
    url: "https://chatgpt.com/",
    description: "国际通用首选，适合创作、推理与代码协作。",
  }),
  createBuiltinProvider({
    id: "gemini",
    name: "Gemini",
    camp: "international",
    url: "https://gemini.google.com/",
    description: "Google 生态连接强，适合搜索协作与多模态场景。",
  }),
  createBuiltinProvider({
    id: "claude",
    name: "Claude",
    camp: "international",
    url: "https://claude.ai/",
    description: "长文本与写作体验突出，适合分析与润色。",
  }),
  createBuiltinProvider({
    id: "copilot",
    name: "Copilot",
    camp: "international",
    url: "https://copilot.microsoft.com/",
    description: "微软生态协同能力强，适合办公与搜索融合。",
  }),
  createBuiltinProvider({
    id: "perplexity",
    name: "Perplexity",
    camp: "international",
    url: "https://www.perplexity.ai/",
    description: "偏检索与来源整合，适合快速查证。",
  }),
];

/**
 * 内置 AI 提供方列表。
 */
export const providers = builtinProviders;

/**
 * 获取完整 provider 目录。
 */
export function getProviderCatalog(customProviders: CustomProviderRecord[]) {
  return [...builtinProviders, ...customProviders.map(createCustomProvider)];
}

/**
 * 根据 id 获取 provider。
 */
export function getProviderById(
  providerId: string,
  customProviders: CustomProviderRecord[],
) {
  return getProviderCatalog(customProviders).find((item) => item.id === providerId) ?? null;
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
export function getCustomProviderDescription(url: string) {
  try {
    const { host } = new URL(url);
    return `自定义渠道 · ${host}`;
  } catch {
    return "自定义渠道";
  }
}

/**
 * 创建内置 provider 定义。
 */
function createBuiltinProvider(
  provider: Omit<ProviderDefinition, "iconUrl">,
): ProviderDefinition {
  return {
    ...provider,
    iconUrl: getProviderIconUrl(provider.url),
  };
}

/**
 * 将持久化的自定义渠道转换为 provider。
 */
function createCustomProvider(provider: CustomProviderRecord): ProviderDefinition {
  return {
    id: provider.id,
    name: provider.name,
    camp: "custom",
    url: provider.url,
    description: getCustomProviderDescription(provider.url),
    iconUrl: getProviderIconUrl(provider.url),
    isCustom: true,
  };
}
