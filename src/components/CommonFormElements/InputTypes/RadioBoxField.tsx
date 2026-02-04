import React from "react";
import { labelClasses } from "../styles";

interface RadioOption {
  label: string;
  value: string;
}

interface RadioFieldProps {
  label: string;
  name: string;
  options: RadioOption[];
  value: string;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  onChange?: (value: string) => void; // 👈 ADD THIS
}

export const RadioBoxField: React.FC<RadioFieldProps> = ({
  label,
  name,
  options,
  value,
  setFieldValue,
  onChange,
}) => (
  <div className="flex flex-col w-full">
    <label className={labelClasses}>
       {label?.includes("*") ? (
        <>
          {label.replace("*", "")} <span className="text-red-500 ml-0.5">*</span>
        </>
      ) : (
        label
      )}
    </label>
    <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden h-10 w-full">
      {options.map((option, index) => (
        <React.Fragment key={option.value}>
          <button
            type="button"
            onClick={() => {
              setFieldValue(name, option.value); // Formik update
              onChange?.(option.value);          // 🔥 EXTRA LOGIC
            }}
            className={`flex-1 flex items-center justify-center text-sm font-medium transition ${
              value === option.value
                ? "text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {option.label} {value === option.value && "✓"}
          </button>
          {/* Add divider if not the last item */}
          {index < options.length - 1 && (
            <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);