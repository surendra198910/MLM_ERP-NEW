import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../services/ApiService";
import Swal from "sweetalert2";
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
    const [sponsorMap, setSponsorMap] = useState<{
        [key: number]: { percentage: number; valueType: string };
    }>({});

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
                sponsorObj[p.PackageId] = {
                    percentage: p.SponsorPercentage ?? 0,
                    valueType: p.ValueType || "Percentage",
                };
            });

            setSponsorMap(sponsorObj);
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
            const payload = Object.keys(sponsorMap).map((id) => ({
                PackageId: Number(id),
                SponsorPercentage: sponsorMap[id].percentage,
                ValueType: sponsorMap[id].valueType,
            }));

            // ✅ Get client info
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
                Swal.fire("Success", res?.Msg || "Saved successfully", "success");
            } else {
                Swal.fire("Error", res?.Msg || "Operation failed", "error");
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
                        Sponsor Setting
                    </h5>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
                        {/* 3. BUTTONS GROUP (Exactly from your design) */}
                        <div className="flex items-center gap-2">
                            {/* ADD BUTTON */}
                            <button
                                type="button"
                                onClick={saveSponsor}
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
                                            {pkg.PackageAmount}
                                        </p>
                                    </div>

                                    {/* Details Card */}
                                    {/* Sponsor Settings */}
                                    <div className="space-y-4">
                                        {/* Value Type */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Value Type
                                            </span>
                                            <select
                                                value={sponsorMap[pkg.PackageId]?.valueType || "Percentage"}
                                                onChange={(e) =>
                                                    setSponsorMap({
                                                        ...sponsorMap,
                                                        [pkg.PackageId]: {
                                                            ...sponsorMap[pkg.PackageId],
                                                            valueType: e.target.value,
                                                        },
                                                    })
                                                }
                                                className="w-30 bg-white dark:bg-[#020617] border border-primary-button-bg dark:primary-button-bg rounded-xl px-2 py-1 text-sm"
                                            >
                                                <option value="Percentage">Percentage</option>
                                                <option value="Value">Value</option>
                                            </select>
                                        </div>

                                        {/* Sponsor Percentage */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Sponsor Value
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={sponsorMap[pkg.PackageId]?.percentage ?? 0}
                                                onChange={(e) =>
                                                    setSponsorMap({
                                                        ...sponsorMap,
                                                        [pkg.PackageId]: {
                                                            ...sponsorMap[pkg.PackageId],
                                                            percentage: Number(e.target.value),
                                                        },
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
