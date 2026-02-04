// type PermissionMap = Record<number, Set<string>>;

// class SmartAction {
//   private permissions: PermissionMap = {};

//   /** Load permissions once from API */
//   load(apiResponse: any[]) {
//     this.permissions = {};

//     apiResponse.forEach(row => {
//       this.permissions[row.FormId] = new Set(
//         row.Action
//           .split(",")
//           .map((a: string) => a.trim().toLowerCase())
//       );
//     });
//   }

//   /** Core checker */
//   can(formId: number, action: string): boolean {
//     return this.permissions[formId]?.has(action.toLowerCase()) ?? false;
//   }

//   /** Semantic helpers */
//   canAdd(formId: number) {
//     return this.can(formId, "add");
//   }

//   canEdit(formId: number) {
//     return this.can(formId, "edit");
//   }

//   canDelete(formId: number) {
//     return this.can(formId, "delete");
//   }

//   canSearch(formId: number) {
//     return this.can(formId, "search");
//   }

//   canManageColumns(formId: number) {
//     return this.can(formId, "manage-columns");
//   }

//   canAdvancedSearch(formId: number) {
//     return this.can(formId, "advance-search");
//   }
// }

// export const SmartActions = new SmartAction();

// type PermissionMap = Record<number, Set<string>>;

// const ACTIONS = {
//   ADD: "add",
//   EDIT: "edit",
//   DELETE: "delete",
//   SEARCH: "search",
//   MANAGE_COLUMNS: "manage-columns",
//   ADVANCED_SEARCH: "advance-search",
// } as const;

// type ActionKey = typeof ACTIONS[keyof typeof ACTIONS];

// class SmartAction {
//   private permissions: PermissionMap = {};

//   load(apiResponse: any[]) {
//     this.permissions = {};

//     apiResponse.forEach(({ FormId, Action }) => {
//       this.permissions[FormId] = new Set(
//         Action.split(",").map((a: string) => a.trim().toLowerCase())
//       );
//     });
//   }

//   can(formId: number, action: ActionKey) {
//     return this.permissions[formId]?.has(action) ?? false;
//   }

//   canAdd = (formId: number) => this.can(formId, ACTIONS.ADD);
//   canEdit = (formId: number) => this.can(formId, ACTIONS.EDIT);
//   canDelete = (formId: number) => this.can(formId, ACTIONS.DELETE);
//   canSearch = (formId: number) => this.can(formId, ACTIONS.SEARCH);
//   canManageColumns = (formId: number) =>
//     this.can(formId, ACTIONS.MANAGE_COLUMNS);
//   canAdvancedSearch = (formId: number) =>
//     this.can(formId, ACTIONS.ADVANCED_SEARCH);
// }

// export const SmartActions = new SmartAction();

// type PermissionMap = Record<number, Set<string>>;

// class SmartAction {
//   private permissions: PermissionMap = {};

//   load(apiResponse: any[]) {
//     this.permissions = Object.fromEntries(
//       apiResponse.map(({ FormId, Action }) => [
//         FormId,
//         new Set(Action.split(",").map((a: string) => a.trim().toLowerCase()))
//       ])
//     );
//   }

//   can(formId: number, action: string) {
//     return this.permissions[formId]?.has(action.toLowerCase()) ?? false;
//   }
// }

// export const SmartActions = new Proxy(new SmartAction(), {
//   get(target, prop: string) {
//     if (prop.startsWith("can") && prop !== "can") {
//       const action = prop
//         .replace(/^can/, "")
//         .replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
//         .slice(1);

//       return (formId: number) => target.can(formId, action);
//     }

//     return (target as any)[prop];
//   }
// });

type PermissionMap = Record<number, Set<string>>;

/**
 * Canonical action normalizer
 * Converts:
 *  "Add" → "add"
 *  "Manage-Columns" → "manage-columns"
 *  "Advance Search" → "advance-search"
 */
const normalizeAction = (action: string) =>
  action.trim().toLowerCase().replace(/\s+/g, "-");

class SmartAction {
  private permissions: PermissionMap = {};

  /** Load permissions from API */
  load(apiResponse: any[]) {
    this.permissions = {};

    apiResponse.forEach(({ FormId, Action }) => {
      if (!Action) return;

      this.permissions[FormId] = new Set(
        Action.split(",").map((a: string) => a.trim().toLowerCase())
      );
    });
  }

  /** Core checker (generic & future-proof) */
  can(formId: number, action: string): boolean {
    return this.permissions[formId]?.has(normalizeAction(action)) ?? false;
  }

  /* ===========================
     BACKWARD-COMPATIBLE HELPERS
     (NO PAGE CHANGES NEEDED)
  ============================ */

  canAdd = (formId: number) => this.can(formId, "add");
  canEdit = (formId: number) => this.can(formId, "edit");
  canDelete = (formId: number) => this.can(formId, "delete");
  canSearch = (formId: number) => this.can(formId, "search");
  canManageColumns = (formId: number) => this.can(formId, "manage-columns");
  canAdvancedSearch = (formId: number) => this.can(formId, "advance-search");
  canAddCompany  = (formId: number) => this.can(formId, "add");
  canEditCompany  = (formId: number) => this.can(formId, "edit");
}

export const SmartActions = new SmartAction();
