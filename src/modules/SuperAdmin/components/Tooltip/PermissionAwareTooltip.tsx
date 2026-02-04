import React from "react";
import Tooltip from "./Tooltip";
import PermissionTooltip from "./PermissionTooltip";

type PermissionAwareTooltipProps = {
  allowed: boolean;
  allowedText?: string;
  deniedText?: string;
  children: React.ReactNode;
};

const PermissionAwareTooltip: React.FC<PermissionAwareTooltipProps> = ({
  allowed,
  allowedText,
  deniedText,
  children,
}) => {
  if (allowed) {
    return allowedText ? (
      <Tooltip text={allowedText}>{children}</Tooltip>
    ) : (
      <>{children}</>
    );
  }

  return (
    <PermissionTooltip text={"You do not have permission to perform this action."}>
      {/* span is REQUIRED so tooltip works on disabled elements */}
      <span className="inline-flex pointer-events-auto">
        {children}
      </span>
    </PermissionTooltip>
  );
};

export default PermissionAwareTooltip;


