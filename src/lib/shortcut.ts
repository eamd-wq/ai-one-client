/**
 * 快捷键展示时的名称映射。
 */
const MODIFIER_LABELS = [
  ["Control", "Ctrl"],
  ["Alt", "Alt"],
  ["Shift", "Shift"],
  ["Meta", "Win"],
] as const;

/**
 * 将快捷键字符串格式化为更易读的展示文本。
 */
export function formatShortcutLabel(shortcut: string) {
  return shortcut
    .split("+")
    .filter(Boolean)
    .map((part) => {
      const match = MODIFIER_LABELS.find(([value]) => value === part);
      return match?.[1] ?? part;
    })
    .join(" + ");
}

/**
 * 将键盘事件转换为 Tauri 可识别的快捷键字符串。
 */
export function eventToShortcut(event: KeyboardEvent) {
  const modifiers = [
    event.ctrlKey ? "Control" : null,
    event.altKey ? "Alt" : null,
    event.shiftKey ? "Shift" : null,
    event.metaKey ? "Meta" : null,
  ].filter(Boolean) as string[];

  const mainKey = resolveMainKey(event);
  if (!mainKey || modifiers.length === 0) {
    return null;
  }

  return [...modifiers, mainKey].join("+");
}

/**
 * 提取组合键里的主按键。
 */
function resolveMainKey(event: KeyboardEvent) {
  const { code, key } = event;

  if (/^Key[A-Z]$/.test(code)) {
    return code.slice(3);
  }

  if (/^Digit[0-9]$/.test(code)) {
    return code.slice(5);
  }

  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) {
    return code;
  }

  const codeMap: Record<string, string> = {
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Backquote: "`",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Space: "Space",
    Tab: "Tab",
    Enter: "Enter",
    Escape: "Escape",
    Backspace: "Backspace",
    Delete: "Delete",
    Insert: "Insert",
    Home: "Home",
    End: "End",
    PageUp: "PageUp",
    PageDown: "PageDown",
  };

  if (codeMap[code]) {
    return codeMap[code];
  }

  if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
    return null;
  }

  return null;
}
