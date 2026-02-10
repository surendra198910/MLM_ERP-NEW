
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
    console.log(this.permissions[formId]?.has(normalizeAction(action)));
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
