import React from "react";

export const TrezoCardContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="trezo-card bg-white dark:bg-[#0c1427] 
                  mb-[25px] p-[20px] md:p-[25px] 
                  rounded-md shadow-sm">
    {children}
  </div>
);

export const EnquirySectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white dark:bg-[#0f172a] 
                  border border-gray-200 dark:border-[#172036] 
                  rounded-md p-[20px] md:p-[25px] 
                  shadow-sm">
    {children}
  </div>
);

export const EnquirySectionHeader: React.FC<{ icon?: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 
                  mb-[15px] pb-[10px] 
                  border-b border-gray-200 dark:border-[#172036]">

    {icon}

    <p className="text-[14px] font-semibold 
                  text-black dark:text-white 
                  tracking-wide">
      {title}
    </p>

  </div>
);

export const EnquiryProfileCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-gray-50 dark:bg-[#15203c] 
                  border border-gray-200 dark:border-[#172036] 
                  rounded-md p-[20px] md:p-[25px] mb-6">
    {children}
  </div>
);

export const EnquiryHistoryCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white dark:bg-[#0f172a] 
                  border border-gray-200 dark:border-[#172036] 
                  rounded-md p-[20px] md:p-[25px] 
                  flex flex-col h-full">
    {children}
  </div>
);

export const EnquiryBottomBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="sticky bottom-0 
                  bg-white dark:bg-[#0c1427] 
                   border-gray-200 dark:border-[#172036] 
                  px-[20px] md:px-[25px] py-[15px] 
                  rounded-b-md">
    {children}
  </div>
);

export const EnquiryGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-[25px]">
    {children}
  </div>
);

export const DetailBox = ({ label, value }: { label: string; value: any }) => (
  <div className="flex flex-col">

    <p className="text-[10px] font-bold uppercase tracking-wider 
                  text-gray-400 dark:text-gray-500">
      {label}
    </p>

    <p className="text-sm font-semibold 
                  text-gray-800 dark:text-gray-200">
      {value || "---"}
    </p>

  </div>
);
