import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PermissionAwareTooltip from "../../../modules/SuperAdmin/components/Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../../../modules/SuperAdmin/components/Security/SmartActionWithFormName";

type Props = {
  row: any;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
};

const ActionCell: React.FC<Props> = ({ row, onEdit, onDelete }) => {
  const location = useLocation();
  const formName = location.pathname.split("/").pop();
  const navigate = useNavigate();
  const isEmployeePage = location.pathname.toLowerCase().includes("/employee");
  const canEdit = SmartActions.canEdit(formName);
  const canDelete = SmartActions.canDelete(formName);

  return (
    <div className="flex gap-2">

      {/* EDIT */}
      <PermissionAwareTooltip allowed={canEdit} allowedText="Edit">
        <button
          disabled={!canEdit}
          className={
            canEdit
              ? "text-gray-500 hover:text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          }
          onClick={() => onEdit?.(row)}
        >
          <i className="material-symbols-outlined !text-md">edit</i>
        </button>
      </PermissionAwareTooltip>
      {/* ⚙ PERMISSION (ONLY EMPLOYEE PAGE) */}
      {isEmployeePage && row?.EmployeeId && (
        <PermissionAwareTooltip allowed={canEdit} allowedText="Manage Permissions">
          <button
            disabled={!canEdit}
            className={
              canEdit
                ? "text-gray-500 hover:text-indigo-600"
                : "text-gray-300 cursor-not-allowed"
            }
            onClick={() =>
              navigate(`/superadmin/employee/${row.EmployeeId}/permissions`)
            }
          >
            <i className="material-symbols-outlined !text-md">settings</i>
          </button>
        </PermissionAwareTooltip>
      )}
      {/* DELETE */}
      <PermissionAwareTooltip allowed={canDelete} allowedText="Delete">
        <button
          disabled={!canDelete}
          className={
            canDelete
              ? "text-danger-500 hover:text-danger-700"
              : "text-gray-300 cursor-not-allowed"
          }
          onClick={() => onDelete?.(row)}
        >
          <i className="material-symbols-outlined !text-md">delete</i>
        </button>
      </PermissionAwareTooltip>

    </div>
  );
};

export default ActionCell;