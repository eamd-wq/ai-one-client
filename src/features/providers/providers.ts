import type { ProviderCamp, ProviderDefinition } from "../../types/provider";

/**
 * AI 提供方清单。
 */
export const providers: ProviderDefinition[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    camp: "domestic",
    url: "https://chat.deepseek.com/",
    description: "深度推理优先，适合技术问答与结构化输出。",
    accent: "#5f7cff",
    badge: "DS",
  },
  {
    id: "doubao",
    name: "豆包",
    camp: "domestic",
    url: "https://www.doubao.com/chat/",
    description: "字节系通用助手，适合日常对话与写作草稿。",
    accent: "#ff6d42",
    badge: "DB",
  },
  {
    id: "tongyi",
    name: "通义千问",
    camp: "domestic",
    url: "https://tongyi.aliyun.com/qianwen/",
    description: "阿里系模型入口，适合通用办公与代码协作。",
    accent: "#1d9c88",
    badge: "TY",
  },
  {
    id: "yiyan",
    name: "文心一言",
    camp: "domestic",
    url: "https://yiyan.baidu.com/",
    description: "百度系会话入口，适合中文场景与知识问答。",
    accent: "#5f58d7",
    badge: "WY",
  },
  {
    id: "kimi",
    name: "Kimi",
    camp: "domestic",
    url: "https://kimi.moonshot.cn/",
    description: "长上下文优势明显，适合读文档与长内容整理。",
    accent: "#121212",
    badge: "KM",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    camp: "international",
    url: "https://chatgpt.com/",
    description: "国际通用首选，适合创作、推理与代码协作。",
    accent: "#1e7f64",
    badge: "CG",
  },
  {
    id: "gemini",
    name: "Gemini",
    camp: "international",
    url: "https://gemini.google.com/",
    description: "Google 生态连接强，适合搜索协作与多模态场景。",
    accent: "#4679ff",
    badge: "GM",
  },
  {
    id: "claude",
    name: "Claude",
    camp: "international",
    url: "https://claude.ai/",
    description: "长文本与写作体验突出，适合分析与润色。",
    accent: "#c26f40",
    badge: "CL",
  },
  {
    id: "copilot",
    name: "Copilot",
    camp: "international",
    url: "https://copilot.microsoft.com/",
    description: "微软生态协同能力强，适合办公与搜索融合。",
    accent: "#2f6fdd",
    badge: "CP",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    camp: "international",
    url: "https://www.perplexity.ai/",
    description: "偏检索与来源整合，适合快速查证。",
    accent: "#0b8b79",
    badge: "PX",
  },
];

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

    return left.name.localeCompare(right.name);
  });
}
