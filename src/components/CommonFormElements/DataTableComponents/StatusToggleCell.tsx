import React, { useState } from "react";
import Swal from "sweetalert2";
import { ApiService } from "../../../services/ApiService";


interface Props {
  row: any;
  onSuccess?: () => void; // callback to refresh grid
}

const StatusToggleCell: React.FC<Props> = ({ row, onSuccess }) => {
  const { universalService } = ApiService();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const newStatus = !(row.Status === true || row.Status === 1);

    try {
      setLoading(true);

      const payload = {
        procName: "ManageMarqueeNews",
        Para: JSON.stringify({
          ActionMode: "ToggleStatus",
          EditId: row.Id,
          Status: newStatus ? 1 : 0,
          ModifiedBy: 1,
        }),
      };

      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response;

      if (res?.Status === 1 || res?.Status === "1") {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Status updated successfully",
          timer: 1000,
          showConfirmButton: false,
        });

        onSuccess && onSuccess(); // 🔥 refresh grid
      } else {
        Swal.fire("Error", res?.Message || "Failed", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const isChecked = row.Status === true || row.Status === 1;

  return (
    <div className="flex items-center justify-center">
      {loading ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-button-bg rounded-full animate-spin"></div>
      ) : (
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div
            className="relative w-11 h-6 bg-gray-200 rounded-full peer 
            peer-checked:bg-primary-button-bg 
            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
            after:bg-white after:border after:rounded-full after:h-5 after:w-5
            after:transition-all peer-checked:after:translate-x-full"
          ></div>
        </label>
      )}
    </div>
  );
};

export default StatusToggleCell;