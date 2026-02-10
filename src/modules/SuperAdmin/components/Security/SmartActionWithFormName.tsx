type PermissionMap = Record<string, Set<string>>;

/**
 * Canonical action normalizer
 */
const normalizeAction = (action: string) =>
  action.trim().toLowerCase().replace(/\s+/g, "-");

const normalizeForm = (form: string) =>
  form.trim().toLowerCase().replace(/\s+/g, "-");

class SmartAction {
  private permissions: PermissionMap = {};

  /** Load permissions from API */
  load(apiResponse: any[]) {
    this.permissions = {};

    apiResponse.forEach(({ FormNameWithExt, Action }) => {
      if (!FormNameWithExt || !Action) return;

      const formKey = normalizeForm(FormNameWithExt);

      this.permissions[formKey] = new Set(
        Action.split(",").map((a: string) => normalizeAction(a))
      );
    });
  }

  /** Core checker */
  can(formName: string, action: string): boolean {
    const formKey = normalizeForm(formName);
    const actionKey = normalizeAction(action);

    const result = this.permissions[formKey]?.has(actionKey) ?? false;
    console.log("CHECK:", formKey, actionKey, result);

    return result;
  }

  /* Helper Methods */
  canAdd = (form: string) => this.can(form, "add");
  canEdit = (form: string) => this.can(form, "edit");
  canDelete = (form: string) => this.can(form, "delete");
  canSearch = (form: string) => this.can(form, "search");
  canManageColumns = (form: string) => this.can(form, "manage-columns");
  canAdvancedSearch = (form: string) => this.can(form, "advance-search");
}

export const SmartActions = new SmartAction();
