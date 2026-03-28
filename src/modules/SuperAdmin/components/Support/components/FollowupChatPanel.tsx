"use client";
import React, { useRef } from "react";
import { FaComment, FaPaperPlane } from "react-icons/fa";
import DOMPurify from "dompurify";

interface Followup {
    ReplyType: string;
    Message: string;
    MessageStatus: string;
    EntryDate: string;
    EmployeeName: string;
    ProfilePic: string;
}

interface Props {
    followups: Followup[];
    message: string;
    setMessage: (val: string) => void;
    replyFrom: string;
    setReplyFrom: (val: string) => void;
    callbackDate: string;
    setCallbackDate: (val: string) => void;
    handleAddFollowup: () => void;
    loading: boolean;
    getEmployeeImage: (url?: string) => string;
}

export default function FollowupChatPanel({
    followups,
    message,
    setMessage,
    replyFrom,
    setReplyFrom,
    callbackDate,
    setCallbackDate,
    handleAddFollowup,
    loading,
    getEmployeeImage,
}: Props) {
    const chatEndRef = useRef<HTMLDivElement>(null);

    return (
        <div className="lg:w-1/3 flex flex-col overflow-y-auto max-h-[70vh] custom-scrollbar">

            {/* Header */}
            <div className="text-sm px-5 font-bold text-gray-800 dark:text-white border-b border-gray-200 pb-2 mt-4 mb-3 flex items-center">
                <FaComment className="text-blue-500 mr-2" /> Followup:
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-y-auto px-4 bg-white dark:bg-[#0c1427]">
                {followups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <div className="bg-blue-50 dark:bg-blue-500/10 p-5 rounded-full mb-4">
                            <FaComment className="text-blue-500 text-3xl" />
                        </div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            No Followups Yet
                        </div>
                        <p className="text-xs text-gray-400 mt-2 max-w-xs">
                            Start the conversation by sending the first follow-up message.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {followups.map((f, i) => {
                            const isEmployee = f.ReplyType === "E";

                            return (
                                <div
                                    key={i}
                                    className={`flex gap-3 ${isEmployee ? "justify-start" : "justify-end"
                                        }`}
                                >
                                    {/* Avatar */}
                                    <img
                                        src={`${import.meta.env.VITE_IMAGE_PREVIEW_URL}${f.ProfilePic}`}
                                        className="w-8 h-8 rounded-full object-cover border"
                                        alt="Client Logo"
                                    />


                                    {/* Message */}
                                    <div className="max-w-[75%]">
                                        <div className="text-[11px] text-gray-500 mb-1">
                                            {f.EmployeeName} •{" "}
                                            {new Date(f.EntryDate).toLocaleString()}
                                        </div>

                                        <div
                                            className={`px-4 py-2 rounded-2xl text-sm ${isEmployee
                                                    ? "bg-gray-100 text-gray-800"
                                                    : "bg-blue-600 text-white"
                                                }`}
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(f.Message),
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border border-gray-200">
                {/* <div className="flex gap-4 mb-2">
                    <select
                        value={replyFrom}
                        onChange={(e) => setReplyFrom(e.target.value)}
                        className="flex-1 border rounded-md px-2 py-2 text-sm"
                    >
                        <option value="Employee">Employee</option>
                        <option value="Client">Client</option>
                    </select>

                    <input
                        type="date"
                        value={callbackDate}
                        onChange={(e) => setCallbackDate(e.target.value)}
                        className="flex-1 border rounded-md px-2 py-2 text-sm"
                    />
                </div> */}

                <div className="flex gap-2">
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddFollowup();
                            }
                        }}
                        placeholder="Type message..."
                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
                    />

                    <button
                        onClick={handleAddFollowup}
                        disabled={loading || !message.trim()}
                        className="bg-blue-600 text-white w-10 h-10 rounded-md flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                        ) : (
                            <FaPaperPlane />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}