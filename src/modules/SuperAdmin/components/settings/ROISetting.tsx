import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";
import { useCurrency } from "../../context/CurrencyContext";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

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
  const [openROICap, setOpenROICap] = useState(false);
  const [investorCap, setInvestorCap] = useState<number | "">("");
  const [leaderCap, setLeaderCap] = useState<number | "">("");
  const [roiCapSaving, setRoiCapSaving] = useState(false);
  const [roiCapSettingId, setRoiCapSettingId] = useState<number | null>(null);

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
  const roiCappingSchema = Yup.object().shape({
    InvestorCap: Yup.number()
      .typeError("Investor ROI Multiplier must be a number")
      .required("Investor ROI Multiplier is required")
      .min(0, "Cannot be negative")
      .max(1000, "Value too large"),

    LeaderCap: Yup.number()
      .typeError("Leader ROI Multiplier must be a number")
      .required("Leader ROI Multiplier is required")
      .min(0, "Cannot be negative")
      .max(1000, "Value too large"),
  });

  const handleROICapping = async () => {
    try {
      const getResponse = await universalService({
        procName: "ManageGlobalSetting",
        Para: JSON.stringify({ ActionMode: "GetROICapping" }),
      });

      const existing =
        getResponse?.data?.[0] ||
        getResponse?.[0] ||
        {};

      setInvestorCap(existing?.ROICappingMultiplierInvestor ?? "");
      setLeaderCap(existing?.ROICappingMultiplierLeader ?? "");
      setRoiCapSettingId(existing?.SettingId ?? null);

      setOpenROICap(true);
    } catch (error) {
      Swal.fire("Error", "Failed to load ROI Capping", "error");
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
      <div className="relative min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 
                  bg-white/60 dark:bg-black/40 
                  backdrop-blur-sm
                  flex items-center justify-center 
                  z-20 rounded-lg">
            <div className="animate-spin w-10 h-10 
                    border-4 border-primary-button-bg 
                    border-t-transparent 
                    rounded-full" />
          </div>
        )}

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
                  <div
                    className="text-lg font-semibold text-gray-900 dark:text-white
             tracking-tight leading-snug
             line-clamp-2 break-words"
                    title={pkg.PackageName}
                  >
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
      <Dialog
        open={openROICap}
        onClose={() => setOpenROICap(false)}
        className="relative z-60"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity 
    data-[closed]:opacity-0 
    data-[enter]:duration-300 
    data-[leave]:duration-200 
    data-[enter]:ease-out 
    data-[leave]:ease-in"
        />

        <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">

            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
        data-[closed]:translate-y-4 data-[closed]:opacity-0 
        data-[enter]:duration-300 data-[leave]:duration-200
        data-[enter]:ease-out data-[leave]:ease-in 
        sm:my-8 sm:w-full sm:max-w-[550px]
        data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <div className="trezo-card w-full bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">

                {/* Header */}
                <div
                  className="trezo-card-header bg-gray-50 dark:bg-[#15203c] 
            mb-[20px] md:mb-[25px]
            flex items-center justify-between 
            -mx-[20px] md:-mx-[25px] 
            -mt-[20px] md:-mt-[25px]
            p-[20px] md:p-[25px] rounded-t-md"
                >
                  <div className="trezo-card-title">
                    <h5 className="!mb-0 font-bold text-black dark:text-white">
                      ROI Capping
                    </h5>
                  </div>

                  <button
                    type="button"
                    className="text-[23px] transition-all leading-none 
              text-black dark:text-white hover:text-primary-button-bg"
                    onClick={() => setOpenROICap(false)}
                  >
                    <i className="ri-close-fill"></i>
                  </button>
                </div>

                <Formik
                  initialValues={{
                    InvestorCap: investorCap,
                    LeaderCap: leaderCap,
                  }}
                  enableReinitialize
                  validationSchema={roiCappingSchema}
                  onSubmit={async (values) => {
                    const confirm = await Swal.fire({
                      title: "Confirm ROI Capping Update",
                      text: "Are you sure you want to update ROI Capping settings?",
                      icon: "question",
                      showCancelButton: true,
                      confirmButtonColor: "#3b82f6",
                      cancelButtonColor: "#d33",
                      confirmButtonText: "Yes, Save",
                      cancelButtonText: "Cancel",
                    });

                    if (!confirm.isConfirmed) return;

                    try {
                      setRoiCapSaving(true);

                      const response = await universalService({
                        procName: "ManageGlobalSetting",
                        Para: JSON.stringify({
                          ActionMode: "UpdateROICapping",
                          SettingId: roiCapSettingId,
                          ROICappingMultiplierInvestor: values.InvestorCap,
                          ROICappingMultiplierLeader: values.LeaderCap,
                        }),
                      });

                      const res =
                        response?.data?.[0] ||
                        response?.[0] ||
                        response;

                      if (res?.Status === "SUCCESS") {
                        Swal.fire("Success!", res?.Message, "success");
                        setOpenROICap(false);
                      } else {
                        Swal.fire("Error", res?.Message || "Failed", "error");
                      }

                    } catch (error) {
                      Swal.fire("Error", "Server error occurred", "error");
                    } finally {
                      setRoiCapSaving(false);
                    }
                  }}

                >
                  {({ handleSubmit }) => (
                    <Form onSubmit={handleSubmit} className="space-y-6">

                      {/* Investor */}
                      <div>
                        <label className="mb-[10px] text-black dark:text-white font-medium block">
                          Investor ROI Multiplier
                          <span className="text-red-500">*</span>
                        </label>

                        <Field
                          type="number"
                          name="InvestorCap"
                          placeholder="Enter Investor ROI Multiplier"
                          className="h-[55px] rounded-md text-black dark:text-white 
  border border-gray-200 dark:border-[#172036] 
  bg-white dark:bg-[#0c1427] 
  px-[17px] block w-full outline-0
  appearance-none
  [&::-webkit-inner-spin-button]:appearance-none
  [&::-webkit-outer-spin-button]:appearance-none
  focus:border-primary-button-bg"
                        />


                        <ErrorMessage
                          name="InvestorCap"
                          component="p"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Leader */}
                      <div>
                        <label className="mb-[10px] text-black dark:text-white font-medium block">
                          Leader ROI Multiplier
                          <span className="text-red-500">*</span>
                        </label>
                        <Field
                          type="number"
                          name="LeaderCap"
                          placeholder="Enter Leader ROI Multiplier"
                          className="h-[55px] rounded-md text-black dark:text-white 
  border border-gray-200 dark:border-[#172036] 
  bg-white dark:bg-[#0c1427] 
  px-[17px] block w-full outline-0
  appearance-none
  [&::-webkit-inner-spin-button]:appearance-none
  [&::-webkit-outer-spin-button]:appearance-none
  focus:border-primary-button-bg"
                        />


                        <ErrorMessage
                          name="LeaderCap"
                          component="p"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      <hr className="border-0 border-t border-gray-200 dark:border-gray-700 my-6 -mx-[20px] md:-mx-[25px]" />

                      {/* Footer */}
                      <div className="text-right">

                        <button
                          type="button"
                          className="mr-[15px] px-[26.5px] py-[12px] rounded-md 
          bg-danger-500 text-white hover:bg-danger-400"
                          onClick={() => setOpenROICap(false)}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={roiCapSaving}
                          className="px-[26.5px] py-[12px] rounded-md 
          bg-primary-button-bg text-white 
          hover:bg-primary-button-bg-hover"
                        >
                          {roiCapSaving ? (
                            <div className="flex items-center gap-2">
                              <div className="theme-loader"></div>
                              <span>Processing...</span>
                            </div>
                          ) : (
                            "Save ROI Capping"
                          )}
                        </button>

                      </div>

                    </Form>
                  )}
                </Formik>


              </div>
            </DialogPanel>

          </div>
        </div>
      </Dialog>

    </div>
  );
};

export default Template;
