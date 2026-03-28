"use client";

import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import AccessRestricted from "../../common/AccessRestricted";

interface FormValues {
    username: string;
    amount: string;
    paymentMode: string;
    remark: string;
    transactionNumber: string;
    transactionDate: string;
    bankName: string;
    branchName: string;
    transactiontype: string;
}

const schema = Yup.object().shape({
    username: Yup.string().required("Username required"),
    amount: Yup.number().required("Amount required"),
    transactionDate: Yup.string().required("Transaction date required"),
});

const Template: React.FC = () => {

    const { universalService } = ApiService();

    const [permissionLoading, setPermissionLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState(true);
    const [loading, setLoading] = useState(false)

    const path = location.pathname;
    const formName = path.split("/").pop();
    const canAdd = SmartActions.canAdd(formName);

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

            if (!pagePermission || !pagePermission.Action?.trim()) {
                setHasPageAccess(false);
                return;
            }

            SmartActions.load(data);
            setHasPageAccess(true);

        } catch (err) {
            console.error(err);
            setHasPageAccess(false);
        } finally {
            setPermissionLoading(false);
        }
    };

    useEffect(() => {
        fetchFormPermissions();
    }, []);

    const initialValues: FormValues = {
        username: "",
        amount: "",
        paymentMode: "Cash",
        remark: "",
        transactionNumber: "",
        transactionDate: "",
        bankName: "",
        branchName: "",
        transactiontype: "Credit"
    };

    const handleSubmit = async (values: FormValues) => {

        const confirm = await Swal.fire({
            title: "Confirm Transfer?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
        });

        if (!confirm.isConfirmed) return;

        try {

            setLoading(true);

            const saved = localStorage.getItem("EmployeeDetails");
            const employee = saved ? JSON.parse(saved) : {};

            const payload = {
                procName: "AdminWallet",
                Para: JSON.stringify({
                    LoginId: employee?.LoginId || 1,
                    Amount: values.amount,
                    MemberUserName: values.username,
                    PaymentMode: values.paymentMode,
                    TransactionNumber: values.transactionNumber,
                    TransactionDate: values.transactionDate,
                    BankName: values.bankName,
                    BranchName: values.branchName,
                    Remark: values.remark,
                    ActionMode: "TransferAmount",
                    TransactionType: values.transactiontype || "Credit",
                    EmployeeId: employee?.EmployeeId || 0,
                    Token: employee?.Token || localStorage.getItem("authtoken") || 0
                })
            };

            const response = await universalService(payload);

            const data = response?.data ?? response;

            if (Array.isArray(data) && data.length > 0) {

                const result = data[0];

                if (result.StatusCode == 1 || result.StatusCode == "1") {

                    Swal.fire({
                        icon: "success",
                        title: "Success",
                        text: result.Msg || "Wallet transferred successfully"
                    });

                } else {

                    Swal.fire({
                        icon: "error",
                        title: "Failed",
                        text: result.Msg || "Transfer failed"
                    });

                }

            } else {

                Swal.fire("Error", "Unexpected server response", "error");

            }

        } catch (err) {

            console.error(err);

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Server error while transferring wallet"
            });

        } finally {

            setLoading(false);

        }
    };

    const input =
        "w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm h-10 bg-white dark:bg-[#0c1427]";

    if (permissionLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="theme-loader"></div>
            </div>
        );
    }

    if (!hasPageAccess) {
        return <AccessRestricted />;
    }

    return (

        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">

            {/* HEADER */}

            {/* <div className="flex items-center justify-between pb-5 border-b border-gray-200 mb-5 -mx-7 px-5">


                <h5 className="font-bold text-xl text-black dark:text-white">
                    Wallet Transfer
                </h5>

                <PermissionAwareTooltip
                    allowed={canAdd}
                    allowedText="Add Package"
                    deniedText="Permission required"
                >
                    <button
                        type="submit"
                        disabled={!canAdd}
                        className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover 
        text-white rounded text-sm font-medium disabled:opacity-50"
                    >
                        Submit
                    </button>
                </PermissionAwareTooltip>


            </div> */}


            <Formik
                initialValues={initialValues}
                validationSchema={schema}
                onSubmit={handleSubmit}
            >
                {({ values, handleChange, handleSubmit, errors, touched }) => (

                    <form onSubmit={handleSubmit}>

                        {/* HEADER */}

                        <div className="flex items-center justify-between pb-5 border-b border-gray-200 mb-5 -mx-7 px-5">

                            <h5 className="font-bold text-xl text-black dark:text-white">
                                Wallet Transfer
                            </h5>

                            <PermissionAwareTooltip
                                allowed={canAdd}
                                allowedText="Add Package"
                                deniedText="Permission required"
                            >
                                <button
                                    type="submit"
                                    disabled={!canAdd || loading}
                                    className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover 
            text-white rounded text-sm font-medium disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : "Submit"}
                                </button>
                            </PermissionAwareTooltip>

                        </div>

                        {/* FORM FIELDS */}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-[20px]">

                            {/* USERNAME */}

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Username
                                </label>

                                <input
                                    name="username"
                                    value={values.username}
                                    onChange={handleChange}
                                    className={input}
                                    placeholder="Enter username"
                                />

                                {errors.username && touched.username && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            {/* AMOUNT */}

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Transfer Amount
                                </label>

                                <input
                                    name="amount"
                                    value={values.amount}
                                    onChange={handleChange}
                                    className={input}
                                    placeholder="Enter amount"
                                />
                            </div>
                            {/* PAYMENT MODE */}

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Payment Mode
                                </label>

                                <select
                                    name="paymentMode"
                                    value={values.paymentMode}
                                    onChange={handleChange}
                                    className={input}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="NEFT">NEFT</option>
                                </select>
                            </div>

                            {/* TRANSACTION DATE */}

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Transaction Date
                                </label>

                                <input
                                    type="date"
                                    name="transactionDate"
                                    value={values.transactionDate}
                                    onChange={handleChange}
                                    className={input}
                                />
                            </div>




                            {/* CHEQUE / NEFT FIELDS */}

                            {(values.paymentMode === "Cheque" ||
                                values.paymentMode === "NEFT") && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {values.paymentMode === "Cheque"
                                                    ? "Cheque Number"
                                                    : "Transaction Number"}
                                            </label>

                                            <input
                                                name="transactionNumber"
                                                value={values.transactionNumber}
                                                onChange={handleChange}
                                                className={input}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Bank Name
                                            </label>

                                            <select
                                                name="bankName"
                                                value={values.bankName}
                                                onChange={handleChange}
                                                className={input}
                                            >
                                                <option value="">Select Bank</option>
                                                <option>State Bank of India</option>
                                                <option>ICICI Bank</option>
                                                <option>HDFC Bank</option>
                                                <option>Axis Bank</option>
                                                <option>Punjab National Bank</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Branch Name
                                            </label>

                                            <input
                                                name="branchName"
                                                value={values.branchName}
                                                onChange={handleChange}
                                                className={input}
                                            />
                                        </div>
                                    </>
                                )}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Transaction Type
                                </label>

                                <select
                                    name="transactiontype"
                                    onChange={handleChange}
                                    className={input}
                                >

                                    <option>Credit</option>
                                    <option>Debit</option>

                                </select>
                            </div>
                            {/* REMARK */}

                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Remark
                                </label>

                                <textarea
                                    name="remark"
                                    value={values.remark}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-[#0c1427]"
                                />
                            </div>
                        </div>

                    </form>

                )}
            </Formik>

        </div>
    );
};

export default Template;