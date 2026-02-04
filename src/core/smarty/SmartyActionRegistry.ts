export type SmartyDeclaredAction = {
  action: string;
  description?: string;
};

export const SmartyActionRegistry: Record<
  string,
  SmartyDeclaredAction[]
> = {
  "SuperAdmin.FormCategories": [
    { action: "search" },
    { action: "add" },
    { action: "edit" },
    { action: "delete" },
    { action: "manage-columns" },
    { action: "export" },
  ],

  "SuperAdmin.Forms": [
    { action: "add" },
    { action: "edit" },
    { action: "delete" },
  ],
};
