import React from "react";
import { useLocation } from "react-router-dom";
import PermissionAwareTooltip from "../../../modules/SuperAdmin/components/Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../../../modules/SuperAdmin/components/Security/SmartActionWithFormName";

type Props = {
  row: any;
  OnAction?: (row: any) => void;
};

const ActionCell: React.FC<Props> = ({ row, OnAction }) => {
  const location = useLocation();
  const formName = location.pathname.split("/").pop();

  const canAction = SmartActions.canEdit(formName); // or create canAction if needed

  return (
    <div className="flex">
      <PermissionAwareTooltip allowed={canAction} allowedText="Take Action">
        <button
          disabled={!canAction}
          className={
            canAction
              ? "px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              : "px-3 py-1 text-sm bg-gray-300 text-gray-500 rounded cursor-not-allowed"
          }
          onClick={() => OnAction?.(row)}
        >
          Take Action
        </button>
      </PermissionAwareTooltip>
    </div>
  );
};

export default ActionCell;