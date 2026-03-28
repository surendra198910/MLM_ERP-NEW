import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PermissionAwareTooltip from "../../../modules/SuperAdmin/components/Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../../../modules/SuperAdmin/components/Security/SmartActionWithFormName";

type Props = {
  row: any;
  onView?: (row: any) => void;
};

const ActionCell: React.FC<Props> = ({ row, onView }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const formName = location.pathname.split("/").pop();

  const canEdit = SmartActions.canEdit(formName);
  const canView = SmartActions.canView ? SmartActions.canView(formName) : true;

  return (
    <div className="flex gap-2">

      {/* 👁️ VIEW */}
      <PermissionAwareTooltip allowed={canView} allowedText="View">
        <button
          disabled={!canView}
          className={
            canView
              ? "text-gray-500 hover:text-blue-600"
              : "text-gray-300 cursor-not-allowed"
          }
          onClick={() => navigate(`/superadmin/support-center/support-detail/${row.TaskId}`)}
        >
          <i className="material-symbols-outlined !text-md">visibility</i>
        </button>
      </PermissionAwareTooltip>

      {/* ✏️ EDIT → NAVIGATE */}
      <PermissionAwareTooltip allowed={canEdit} allowedText="Edit">
        <button
          disabled={!canEdit}
          className={
            canEdit
              ? "text-gray-500 hover:text-green-600"
              : "text-gray-300 cursor-not-allowed"
          }
          onClick={() => navigate(`/superadmin/support-center/createticket/${row.TaskId}`)} // ✅ KEY CHANGE
        >
          <i className="material-symbols-outlined !text-md">edit</i>
        </button>
      </PermissionAwareTooltip>

    </div>
  );
};

export default ActionCell;