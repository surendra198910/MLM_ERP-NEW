import React, { useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { inputClasses, labelClasses, errorClasses } from "../styles"; // Adjust path to your styles

interface SponsorInputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  onBlur: (e: React.FocusEvent<any>) => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  verifyApi: (value: string) => Promise<string>; // 👈 ADD THIS
}

export const SponsorInputField: React.FC<SponsorInputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  verifyApi
}) => {
  const [status, setStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [sponsorName, setSponsorName] = useState("");
  const [apiError, setApiError] = useState("");

  const handleBlur = async (e: React.FocusEvent<any>) => {
    // 1. Call Formik's standard onBlur first
    onBlur(e);

    // 2. If empty, reset and do nothing
    if (!value) {
      setStatus("idle");
      setSponsorName("");
      setApiError("");
      return;
    }

    // 3. Start Verification
    setStatus("loading");
    setApiError("");
    setSponsorName("");

    try {
      // Call the API
      const name = await verifyApi(value);

      
      // Success
      setStatus("valid");
      setSponsorName(name);
    } catch (err) {
      // Failure
      setStatus("invalid");
      setApiError("User Not Found");
    }
  };

  // If the user starts typing again, reset the validation status to avoid confusion
  const handleChange = (e: React.ChangeEvent<any>) => {
    if (status !== "idle") {
      setStatus("idle");
      setSponsorName("");
      setApiError("");
    }
    onChange(e);
  };

  return (
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
        <input
          name={name}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange} 
          onBlur={handleBlur} // We use our custom blur handler
          className={`${inputClasses} ${
            status === "invalid" ? "border-red-500 focus:ring-red-500" : ""
          } ${status === "valid" ? "border-green-500 focus:ring-green-500" : ""}`}
        />
        
        {/* Loading Spinner inside Input */}
        {status === "loading" && (
          <div className="absolute right-3 top-3 text-gray-400">
            <FaSpinner className="animate-spin" />
          </div>
        )}
      </div>

      {/* --- FEEDBACK AREA --- */}
      
      {/* 1. API Success (Green Tick + Name) */}
      {status === "valid" && (
        <div className="flex items-center gap-2 mt-1 text-sm text-green-600 font-medium animate-fadeIn">
          <FaCheckCircle />
          <span>{sponsorName}</span>
        </div>
      )}

      {/* 2. API Error (Red Text) */}
      {status === "invalid" && (
        <div className="flex items-center gap-2 mt-1 text-sm text-red-500 font-medium animate-fadeIn">
          <FaTimesCircle />
          <span>{apiError}</span>
        </div>
      )}

      {/* 3. Formik Validation Error (Standard required field errors) */}
      {/* Only show this if we aren't already showing the "User Not Found" error to avoid double errors */}
      {error && touched && status !== "invalid" && (
        <span className={errorClasses}>{error}</span>
      )}
    </div>
  );
};