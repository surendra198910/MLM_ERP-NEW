import React from "react";
import { inputClasses, labelClasses, errorClasses } from "../styles";

interface Option {
  label: string;
  value: string | number;
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: Option[];
  value: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  touched,
  disabled,
}) => (
  <div className="flex flex-col dark:text-gray-100 w-full">
    <label className={labelClasses}>
      {label?.includes("*") ? (
        <>
          {label.replace("*", "")} <span className="text-red-500 ml-0.5">*</span>
        </>
      ) : (
        label
      )}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className={`${inputClasses} ${
          disabled ? "bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-400" : ""
        } ${error && touched ? "border-red-500" : ""}`}
      >
        <option value="">Select Option</option>
        {options.map((o, i) => (
          <option key={i} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
    {error && touched && <span className={errorClasses}>{error}</span>}
  </div>
);