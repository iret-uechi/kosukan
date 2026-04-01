/**
 * 簡易Markdownレンダラー
 * 対応構文: リンク、太字、斜体、インラインコード、リスト（箇条書き）、改行
 */
export function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 箇条書きリスト（- または * で始まる行）
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        result.push('<ul style="margin:2px 0;padding-left:20px">');
        inList = true;
      }
      const content = renderInline(trimmed.replace(/^[-*]\s+/, ""));
      result.push(`<li>${content}</li>`);
      continue;
    }

    // リスト終了
    if (inList) {
      result.push("</ul>");
      inList = false;
    }

    if (trimmed === "") {
      result.push("<br>");
    } else {
      result.push(renderInline(trimmed));
      result.push("<br>");
    }
  }

  if (inList) {
    result.push("</ul>");
  }

  // 末尾の余分な<br>を除去
  while (result.length > 0 && result[result.length - 1] === "<br>") {
    result.pop();
  }

  return result.join("");
}

function renderInline(text: string): string {
  let html = escapeHtml(text);

  // インラインコード: `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>'
  );

  // 太字: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // 斜体: *text*（太字の後に処理）
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // リンク: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline">$1</a>'
  );

  // URLの自動リンク（[text](url)でマッチしなかった裸のURL）
  html = html.replace(
    /(?<!")(?<!=)(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline">$1</a>'
  );

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
