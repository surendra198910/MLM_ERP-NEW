import React from "react";
import { inputClasses, labelClasses, errorClasses } from "../styles";

interface InputFieldWithLogoProps {
  label: string;
  name: string;
  icon: React.ReactNode;
  placeholder?: string;
  value: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  error?: string;
  touched?: boolean;
}

export const InputFieldWithLogo: React.FC<InputFieldWithLogoProps> = ({
  label,
  name,
  icon,
  placeholder,
  value,
  onChange,
  error,
  touched,
}) => (
  <div className="flex flex-col dark:text-gray-100 w-full">
    <label className={labelClasses}>{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        name={name}
        type="text"
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        className={`${inputClasses} pl-10`} // Added padding-left for icon
      />
    </div>
    {error && touched && <span className={errorClasses}>{error}</span>}
  </div>
);