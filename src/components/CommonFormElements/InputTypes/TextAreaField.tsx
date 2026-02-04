import React from "react";
import { inputClasses, labelClasses, errorClasses } from "../styles";

interface TextAreaFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  value: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  error?: string;
  touched?: boolean;
  rows?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  touched,
  rows = 3,
}) => (
  <div className="flex flex-col dark:text-gray-100 w-full">
    <label className={labelClasses}>{label}</label>
    <textarea
      name={name}
      rows={rows}
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
      className={`${inputClasses} h-auto py-2`} 
    />
    {error && touched && <span className={errorClasses}>{error}</span>}
  </div>
);