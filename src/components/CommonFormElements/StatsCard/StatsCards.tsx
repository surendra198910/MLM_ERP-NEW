import React from "react";
import { useCurrency } from "../../../modules/SuperAdmin/context/CurrencyContext";

type StatsConfig = {
  key: string;
  title: string;
  icon: string;
};

type Props = {
  stats: Record<string, any>;
  config: StatsConfig[];
  loading?: boolean;
};

const iconColors = [
  "text-success-600 bg-success-50",
  "text-primary-600 bg-primary-50",
  "text-warning-600 bg-warning-50",
  "text-danger-600 bg-danger-50",
  "text-purple-600 bg-purple-50",
  "text-cyan-600 bg-cyan-50",
];

const StatsCardsTrezo: React.FC<Props> = ({ stats, config, loading }) => {
  const { currency } = useCurrency();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-[25px] gap-[25px] mb-[12px] mt-[15px]">
      {config.map((c, index) => {
        const value = stats?.[c.key] ?? 0;
        const colorClass = iconColors[index % iconColors.length];

        return (
          <div
            key={index}
            className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md border border-gray-200"
          >
            <div className="trezo-card-content">
              <div className="flex justify-between">
                <div>
                  <span className="block text-sm text-gray-500">
                    {c.title}
                  </span>

                  {loading ? (
                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
                  ) : (
                    <h5 className="!mb-0 !mt-[3px] !text-[20px] font-semibold">
                      {currency.symbol}
                      {Number(value).toLocaleString()}
                    </h5>
                  )}
                </div>

                {/* ICON */}
                <div
                  className={`w-[55px] lg:w-[60px] h-[55px] lg:h-[60px] flex items-center justify-center rounded-full ${colorClass} dark:bg-[#0a0e19]`}
                >
                  <i className="material-symbols-outlined">{c.icon}</i>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCardsTrezo;