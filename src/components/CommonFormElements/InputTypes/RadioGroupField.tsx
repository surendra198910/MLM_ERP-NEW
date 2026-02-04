"use client";

import React from "react";

interface RadioOption {
  label: string;
  value: string | number;
}

interface RadioGroupFieldProps {
  label: string;
  name: string;
  options: RadioOption[];

  /** Formik props */
  values: Record<string, any>;
  errors?: Record<string, any>;
  touched?: Record<string, any>;
  setFieldValue: (field: string, value: any) => void;

  /** Optional */
  className?: string;
}

const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  name,
  options,
  values,
  errors,
  touched,
  setFieldValue,
  className = "",
}) => {
  const isRequired = label?.includes("*");

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Label */}
      <label className="text-sm text-gray-700 dark:text-gray-300 mb-2">
        {isRequired ? (
          <>
            {label.replace("*", "")}
            <span className="text-red-500 ml-0.5">*</span>
          </>
        ) : (
          label
        )}
      </label>

      {/* Radio Options */}
      <div className="flex items-center gap-6">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={values?.[name] === opt.value}
              onChange={() => setFieldValue(name, opt.value)}
              className="w-4 h-4 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* Error */}
      {errors?.[name] && touched?.[name] && (
        <span className="text-xs text-red-600 mt-1">
          {errors[name]}
        </span>
      )}
    </div>
  );
};

export default RadioGroupField;
