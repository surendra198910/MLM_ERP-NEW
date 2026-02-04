import React from "react";
import { inputClasses, labelClasses, errorClasses } from "../styles"; // Assuming you saved styles above

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = "text",
  placeholder,
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
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className={`${inputClasses} ${
        disabled ? "bg-gray-100 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-400" : ""
      } ${error && touched ? "border-red-500 focus:ring-red-500" : ""}`}
    />
    {error && touched && <span className={errorClasses}>{error}</span>}
  </div>
);