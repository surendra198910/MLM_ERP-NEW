import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";
import { useCurrency } from "../../context/CurrencyContext";
// Define the data structure for creators
export interface PackageROI {
  PackageId: number;
  Type: string;
  PackageName: string;
  PackageAmount: string; // "100-500" or "100"
  PackageImage: string;
  Validity: number;
  ROIPercentage: number;
}

const Template: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { universalService } = ApiService();
  const [packages, setPackages] = useState<PackageROI[]>([]);
  const [roiMap, setRoiMap] = useState<{ [key: number]: number }>({});
  const { currency } = useCurrency();
  const fetchPackages = async () => {
    try {
      setLoading(true);

      const payload = {
        procName: "ROISetting",
        Para: JSON.stringify({ ActionMode: "GetPackages" }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      const pkgList: PackageROI[] = Array.isArray(data) ? data : [];
      setPackages(pkgList);

      // 🔥 Bind ROI into roiMap
      const roiObj: { [key: number]: number } = {};
      pkgList.forEach((p) => {
        roiObj[p.PackageId] = p.ROIPercentage ?? 0;
      });
      setRoiMap(roiObj);
    } catch (err) {
      console.error("Failed to load packages", err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Load on page load
  useEffect(() => {
    fetchPackages();
  }, []);

  const handleROICapping = async () => {
    try {
      // 🔹 Fetch existing ROI values
      const getResponse = await universalService({
        procName: "ManageGlobalSetting",
        Para: JSON.stringify({ ActionMode: "GetROICapping" }),
      });

      const existing =
        getResponse?.data?.[0] ||
        getResponse?.[0] ||
        {};

      const investorValue =
        existing?.ROICappingMultiplierInvestor ?? "";

      const leaderValue =
        existing?.ROICappingMultiplierLeader ?? "";

      // 🔹 Get primary color dynamically
      const tempBtn = document.createElement("button");
      tempBtn.className = "bg-primary-button-bg";
      document.body.appendChild(tempBtn);
      const primaryColor =
        window.getComputedStyle(tempBtn).backgroundColor;
      document.body.removeChild(tempBtn);

      const { value: formValues } = await Swal.fire({
        title: "ROI Capping",
        html: `
        <div style="display:flex; flex-direction:column; gap:18px; text-align:left; margin-top:10px;">
          
          <div>
            <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px;">
              Investor ROI Cap (%)
            </label>
            <input 
              id="minCap" 
              type="number" 
              step="0.01"
              value="${investorValue}"
              placeholder="Enter Investor ROI Cap"
              style="
                width:100%;
                border:1px solid #e5e7eb;
                border-radius:6px;
                padding:8px 12px;
                font-size:14px;
                outline:none;
                transition:all 0.2s ease;
              "
              onfocus="this.style.borderColor='${primaryColor}'; this.style.boxShadow='0 0 0 1px ${primaryColor}';"
              onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none';"
            />
          </div>

          <div>
            <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px;">
              Leader ROI Cap (%)
            </label>
            <input 
              id="maxCap" 
              type="number" 
              step="0.01"
              value="${leaderValue}"
              placeholder="Enter Leader ROI Cap"
              style="
                width:100%;
                border:1px solid #e5e7eb;
                border-radius:6px;
                padding:8px 12px;
                font-size:14px;
                outline:none;
                transition:all 0.2s ease;
              "
              onfocus="this.style.borderColor='${primaryColor}'; this.style.boxShadow='0 0 0 1px ${primaryColor}';"
              onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none';"
            />
          </div>

        </div>
      `,
        showCancelButton: true,
        confirmButtonText: "Save",
        confirmButtonColor: primaryColor,
        width: 420,
        preConfirm: () => {
          const investor = (
            document.getElementById("minCap") as HTMLInputElement
          ).value;
          const leader = (
            document.getElementById("maxCap") as HTMLInputElement
          ).value;

          if (!investor || !leader) {
            Swal.showValidationMessage("Both fields are required");
            return;
          }

          return {
            InvestorCap: parseFloat(investor),
            LeaderCap: parseFloat(leader),
          };
        },
      });

      if (!formValues) return;

      const response = await universalService({
        procName: "ManageGlobalSetting",
        Para: JSON.stringify({
          ActionMode: "UpdateROICapping",
          SettingId: existing?.SettingId,
          ROICappingMultiplierInvestor: formValues.InvestorCap,
          ROICappingMultiplierLeader: formValues.LeaderCap,
        }),
      });

      const res =
        response?.data?.[0] ||
        response?.[0] ||
        response;

      if (res?.Status === "SUCCESS") {
        Swal.fire("Success!", res?.Message, "success");
      } else {
        Swal.fire("Error", res?.Message || "Failed", "error");
      }

    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Server error occurred", "error");
    }
  };


  const getIPLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      return {
        IP: data.ip,
        City: data.city,
        State: data.region,
        Country: data.country_name,
        Latitude: data.latitude,
        Longitude: data.longitude,
        ISP: data.org,
      };
    } catch (e) {
      console.error("IP fetch failed", e);
      return {};
    }
  };
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;

    let browser = "Unknown";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    return {
      UserAgent: ua,
      Browser: browser,
      Platform: navigator.platform,
      Language: navigator.language,
      Screen: `${window.screen.width}x${window.screen.height}`,
    };
  };
  const getClientInfo = async () => {
    const ipInfo = await getIPLocation();
    const browserInfo = getBrowserInfo();

    return {
      ...ipInfo,
      ...browserInfo,
      TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      DateTime: new Date().toISOString(),
    };
  };

  const saveROI = async () => {
    const confirm = await Swal.fire({
      title: "Confirm Save",
      text: "Do you want to save ROI settings?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Save",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const payload = Object.keys(roiMap).map((id) => ({
        PackageId: Number(id),
        ROIPercentage: roiMap[id],
      }));

      const clientInfo = await getClientInfo();

      const response = await universalService({
        procName: "ROISetting",
        Para: JSON.stringify({
          ActionMode: "UpdateROI",
          Data: JSON.stringify(payload),
          ClientInfo: clientInfo,
        }),
      });

      const res = Array.isArray(response)
        ? response[0]
        : response?.data?.[0];

      if (res?.StatusCode == "1") {
        Swal.fire("Success!", res?.Msg, "success");
      } else {
        Swal.fire("Error", res?.Msg || "Failed", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error occurred", "error");
    }
  };



  const imageBaseUrl = import.meta.env.VITE_IMAGE_PREVIEW_URL;
  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* --- HEADER & SEARCH SECTION --- */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            ROI Setting
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            {/* 3. BUTTONS GROUP (Exactly from your design) */}
            <div className="flex items-center gap-2">
              {/* ADD BUTTON */}
              <button
                type="button"
                onClick={handleROICapping}
                className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                ROI Capping
              </button>
              <button
                type="button"
                onClick={saveROI}
                className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                Save Setting
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="trezo-card mb-[25px]">
          <div className="trezo-card-content">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[25px]">
              {packages.map((pkg) => (
                <div
                  key={pkg.PackageId}
                  className="relative group bg-white/80 dark:bg-[#0b1220]/80 backdrop-blur-xl border border-blue-100 dark:border-blue-900/40 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 flex flex-col min-w-[280px] max-w-[320px]"
                >
                  {/* Top Glow */}
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"></div>

                  {/* Ribbon Badge */}
                  <div className="absolute top-0 right-0 z-20">
                    <div className="relative">
                      <div className="absolute right-0 top-0 w-24 h-24 overflow-hidden">
                        <span className="absolute top-[22px] right-[-38px] w-40 rotate-45 bg-primary-button-bg text-white text-[11px] font-semibold tracking-wide text-center py-1 shadow-md">
                          {pkg.Type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Package Name */}
                  <div className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight leading-snug line-clamp-2">
                    {pkg.PackageName}
                  </div>

                  {/* Image */}
                  <div className="mt-6 flex justify-center">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#111827] dark:to-[#020617] p-[2px] shadow-lg">
                      <img
                        src={`${imageBaseUrl}${pkg?.PackageImage}`} // adjust path
                        alt="package"
                        className="w-full h-full object-cover rounded-2xl bg-white"
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement>,
                        ) => {
                          e.currentTarget.src = `${imageBaseUrl}DefaultPackageImage.png`;
                        }}
                      />
                    </div>
                  </div>

                  {/* Investment Amount */}
                  <div className="mt-5 text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-primary-button-bg to-primary-button-bg bg-clip-text text-transparent">
                      {pkg.PackageAmount?.includes("-")
                        ? pkg.PackageAmount.split("-").map((amt, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && " - "}
                            {currency.symbol}
                            {amt.trim()}
                          </React.Fragment>
                        ))
                        : `${currency.symbol}${pkg.PackageAmount}`}
                    </p>

                  </div>

                  {/* Details Card */}
                  <div className="bg-blue-50/60 dark:bg-[#0f172a] border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 space-y-4 text-sm">
                    {/* ROI Input */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Daily ROI (%)
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={roiMap[pkg.PackageId] ?? 0}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) =>
                          setRoiMap({
                            ...roiMap,
                            [pkg.PackageId]: Number(e.target.value),
                          })
                        }
                        className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none w-24 text-right bg-white dark:bg-[#020617] border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-1.5 text-sm font-semibold text-primary-button-bg dark:text-primary-button-bg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    {/* Duration */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Duration
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">
                        {pkg.Validity} Days
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <p className="mt-4 text-[11px] text-gray-400 text-center tracking-wide">
                    ROI updates apply instantly for new investments.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template;
