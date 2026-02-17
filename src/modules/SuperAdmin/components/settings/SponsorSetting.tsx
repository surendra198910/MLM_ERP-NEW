import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";
import { useCurrency } from "../../context/CurrencyContext";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import AccessRestricted from "../../common/AccessRestricted";

// Define the data structure for creators
export interface PackageSponsor {
    PackageId: number;
    Type: string;
    PackageName: string;
    PackageAmount: string;
    PackageImage: string;
    Validity: number;
    SponsorPercentage: number;
    ValueType: string;
}


const Template: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { universalService } = ApiService();
    const [packages, setPackages] = useState<PackageSponsor[]>([]);
    const [permissionLoading, setPermissionLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState(true);

    const path = location.pathname;
    const formName = path.split("/").pop();   // must match DB
    const isEditable = SmartActions.canAdd(formName);

    const [sponsorMap, setSponsorMap] = useState<{
        [key: number]: number;
    }>({});

    const { currency } = useCurrency();
    const fetchFormPermissions = async () => {
        try {
            setPermissionLoading(true);

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            const payload = {
                procName: "AssignForm",
                Para: JSON.stringify({
                    ActionMode: "GetForms",
                    FormName: formName,
                    EmployeeId: employeeId,
                }),
            };

            const response = await universalService(payload);
            const data = response?.data ?? response;

            if (!Array.isArray(data)) {
                setHasPageAccess(false);
                return;
            }

            const pagePermission = data.find(
                (p) =>
                    String(p.FormNameWithExt).trim().toLowerCase() ===
                    formName?.trim().toLowerCase()
            );

            if (
                !pagePermission ||
                !pagePermission.Action ||
                pagePermission.Action.trim() === ""
            ) {
                setHasPageAccess(false);
                return;
            }

            SmartActions.load(data);
            setHasPageAccess(true);

        } catch (err) {
            console.error("Permission fetch failed", err);
            setHasPageAccess(false);
        } finally {
            setPermissionLoading(false);
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

    const fetchPackages = async () => {
        try {
            setLoading(true);

            const payload = {
                procName: "SponsorSetting",
                Para: JSON.stringify({ ActionMode: "GetPackages" }),
            };

            const res = await universalService(payload);
            const data = res?.data || res;

            const pkgList: PackageSponsor[] = Array.isArray(data) ? data : [];
            setPackages(pkgList);

            // Bind into sponsorMap
            const sponsorObj: any = {};
            pkgList.forEach((p) => {
                sponsorObj[p.PackageId] = p.SponsorPercentage ?? 0;
            });


            setSponsorMap(sponsorObj);
        } catch (err) {
            console.error("Failed to load packages", err);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchFormPermissions();
        fetchPackages();
    }, []);

    const saveSponsor = async () => {
        const confirm = await Swal.fire({
            title: "Confirm Save",
            text: "Do you want to save Sponsor settings?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3b82f6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, Save",
            cancelButtonText: "Cancel",
        });

        if (!confirm.isConfirmed) return;

        try {
            setLoading(true); // ✅ show loader while saving

            const payload = Object.keys(sponsorMap).map((id) => ({
                PackageId: Number(id),
                SponsorPercentage: sponsorMap[Number(id)],
            }));

            const clientInfo = await getClientInfo();

            const response = await universalService({
                procName: "SponsorSetting",
                Para: JSON.stringify({
                    ActionMode: "UpdateSponsor",
                    Data: JSON.stringify(payload),
                    ClientInfo: clientInfo,
                }),
            });

            const res = Array.isArray(response)
                ? response[0]
                : response?.data?.[0];

            if (res?.StatusCode == "1") {
                await fetchPackages();   // ✅ 🔥 REFRESH COMPONENT DATA

                Swal.fire({
                    icon: "success",
                    title: "Success",
                    text: res?.Msg || "Saved successfully",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire("Error", res?.Msg || "Operation failed", "error");
            }

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error occurred", "error");
        } finally {
            setLoading(false); // ✅ stop loader
        }
    };





    const imageBaseUrl = import.meta.env.VITE_IMAGE_PREVIEW_URL;
    if (permissionLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-[#0c1427] rounded-md">
                <div className="flex flex-col items-center gap-3">
                    <div className="theme-loader"></div>
                    {/* <p className="text-sm text-gray-500">
          Loading permissions...
        </p> */}

                </div>
            </div>
        );
    }
    if (!hasPageAccess) {
        return (
            <AccessRestricted />
        );
    }

    return (
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            {/* --- HEADER & SEARCH SECTION --- */}
            <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
                <div className="trezo-card-title">
                    <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
                        Sponsor Setting
                    </h5>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
                        {/* 3. BUTTONS GROUP (Exactly from your design) */}
                        <div className="flex items-center gap-2">
                            {/* ADD BUTTON */}
                            <PermissionAwareTooltip
                                allowed={isEditable}
                                allowedText="Save Setting"
                                deniedText="Permission required"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isEditable) return;
                                        saveSponsor();
                                    }}
                                    disabled={!isEditable}
                                    className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover 
        text-white rounded text-sm font-medium transition-colors 
        disabled:opacity-50"
                                >
                                    Save Setting
                                </button>
                            </PermissionAwareTooltip>

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
                                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary-button-bg/60 to-transparent"></div>

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


                                    {/* Sponsor Settings */}
                                    <div className="space-y-4">
                                        {/* Value Type */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Value Type
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-gray-200">
                                                {pkg.ValueType}
                                            </span>
                                        </div>

                                        {/* Sponsor Percentage */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Sponsor Value
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={sponsorMap[pkg.PackageId] ?? 0}

                                                onChange={(e) =>
                                                    setSponsorMap({
                                                        ...sponsorMap,
                                                        [pkg.PackageId]: Number(e.target.value),
                                                    })
                                                }

                                                className="w-24 text-right bg-white dark:bg-[#020617] border border-primary-button-bg0 dark:primary-button-bg rounded-xl px-3 py-1.5 text-sm font-semibold text-primary-button-bg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>


                                    {/* Footer */}
                                    <p className="mt-4 text-[11px] text-gray-400 text-center tracking-wide">
                                        Sponsor value updates apply instantly for new investments.
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
