import React, { useState } from "react";
import { FaCloudUploadAlt, FaFile, FaCheckCircle } from "react-icons/fa";

export const ProgressUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Simulate upload progress
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        setProgress(p);
        if (p >= 100) clearInterval(interval);
      }, 200);
    }
  };

  return (
    <div className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50">
      <input type="file" id="file-upload" className="hidden" onChange={handleFile} />
      
      {!file ? (
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <FaCloudUploadAlt className="text-4xl text-primary-500 mb-2" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Click to upload document
          </span>
          <span className="text-xs text-gray-400 mt-1">PDF, JPG up to 5MB</span>
        </label>
      ) : (
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FaFile className="text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[150px]">
                {file.name}
              </span>
            </div>
            {progress === 100 && <FaCheckCircle className="text-green-500" />}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-right text-xs text-gray-500 mt-1">{progress}%</p>
        </div>
      )}
    </div>
  );
};