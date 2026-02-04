export type SmartyActionItem = {
  action: string;
  tag: string;
  type?: string | null;
  text?: string | null;
};

export const scanSmartyActions = (): SmartyActionItem[] => {
  const nodes = document.querySelectorAll("[smarty-action]");

  return Array.from(nodes).map((el) => ({
    action: el.getAttribute("smarty-action") || "",
    tag: el.tagName.toLowerCase(),
    type: (el as HTMLInputElement).type || null,
    text: el.textContent?.trim() || null,
  }));
};
