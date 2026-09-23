/**
 * Robust copy-to-clipboard helper that works in:
 * - HTTPS secure contexts
 * - HTTP / non-secure contexts (e.g. direct IP access http://51.210.104.232:3000)
 * - iframes / sandboxed environments
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern navigator.clipboard API if available and in secure context
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, falling back to execCommand:", err);
    }
  }

  // 2. Fallback: textarea with document.execCommand('copy')
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Prevent scrolling or zooming on mobile
    textarea.style.position = "fixed";
    textarea.style.left = "-999999px";
    textarea.style.top = "-999999px";
    textarea.style.opacity = "0";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error("Fallback execCommand copy failed:", err);
    return false;
  }
}
