"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, type FormikProps } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { FaTimes } from "react-icons/fa";

// Component Imports

import { ApiService } from "../../../../services/ApiService";
import { TextAreaField } from "../../../../components/CommonFormElements/InputTypes/TextAreaField";
import { SelectField } from "../../../../components/CommonFormElements/InputTypes/SelectField";
import { InputField } from "../../../../components/CommonFormElements/InputTypes/InputField";
import SelectUserModal from "../../../../components/CommonFormElements/PopUp/SelectUserModal";

/* ------------------------------------------------------------------ */
/* VALIDATION SCHEMA */
/* ------------------------------------------------------------------ */
const enquiryValidationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  contactNumber: Yup.string()
    .matches(/^[0-9]{10}$/, "Must be 10 digits")
    .required("Required"),
  productService: Yup.number().required("Required"),
  enquiryFor: Yup.number().required("Required"),
  enquiryType: Yup.number().required("Required"),
  country: Yup.number().required("Required"),
  enquiryDetail: Yup.string().required("Required"),
});

/* ------------------------------------------------------------------ */
/* TYPES & HELPERS */
/* ------------------------------------------------------------------ */
interface DropdownOption {
  value: number | string;
  label: string;
}

interface EnquiryFormValues {
  name: string;
  contactNumber: string;
  email: string;
  productService: number | "";
  enquiryFor: number | "";
  enquiryType: number | "";
  enquiryDetail: string;
  country: number | "";
  state: number | "";
  city: number | "";
  address: string;
  callbackDate: string;
  findUs: number | "";
}

// Helper to extract ID from "100|India" or handle pure numbers
// Helper to extract ID from "100|India" or handle pure numbers
const splitDDLValue = (val: any) => {
  if (!val) return "";
  if (typeof val === "number") return val;
  return val.includes("|") ? Number(val.split("|")[0]) : Number(val);
};

/* 👇 ADD THIS BELOW splitDDLValue */
const hasValidProfileImage = (profilePic?: string) => {
  if (!profilePic) return false;

  const cleanPic = profilePic.split("|")[0].toLowerCase();

  return cleanPic !== "avatar.png" && cleanPic !== "avatar2.png";
};

const normalizeDDL = (
  data: any[],
  idKey = "id",
  nameKey = "name",
): DropdownOption[] =>
  (Array.isArray(data) ? data : []).map((x) => ({
    value: x[idKey],
    label: x[nameKey],
  }));

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT */
/* ------------------------------------------------------------------ */
export default function EnquiryFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isSectionLocked = isEditMode;

  const enquiryId = id ? Number(id) : 0;

  const navigate = useNavigate();
  const { universalService } = ApiService();

  const loggedInEmployeeId =
    JSON.parse(localStorage.getItem("EmployeeDetails") || "{}").EmployeeId || 0;
  const todayDate = new Date().toISOString().split("T")[0];

  // Dropdown states
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [enquiryForList, setEnquiryForList] = useState<DropdownOption[]>([]);
  const [enquiryTypes, setEnquiryTypes] = useState<DropdownOption[]>([]);
  const [findUsList, setFindUsList] = useState<DropdownOption[]>([]);
  const [countries, setCountries] = useState<DropdownOption[]>([]);
  const [states, setStates] = useState<DropdownOption[]>([]);
  const [cities, setCities] = useState<DropdownOption[]>([]);

  // Loading states
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [loading, setLoading] = useState(false);

  // Assignment states
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignedEmployees, setAssignedEmployees] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [editData, setEditData] = useState<any>("");

  const prevCountryRef = useRef<any>(null);
  const prevStateRef = useRef<any>(null);

  const CompanyIdLocalSTG = localStorage.getItem("CompanyId") || "1";

  const fetchDDL = async ({
    tbl,
    searchField,
    filterCTL = "",
    filterCTLvalue = "",
    filterData = "",
  }: any) => {
    const payload = {
      procName: "GetDDLData",
      Para: JSON.stringify({
        tbl,
        searchField,
        filterCTL,
        filterCTLvalue,
        filterData,
      }),
    };
    const res = await universalService(payload);
    return Array.isArray(res?.data) ? res.data : res || [];
  };

  // Combined Load for Initial Dropdowns and Edit Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [prodRes, forRes, typeRes, findRes, countryRes, userRes] =
          await Promise.all([
            fetchDDL({
              tbl: "product.ProductMaster",
              searchField: "ProductName",
              filterData: encodeURIComponent(
                JSON.stringify({
                  status: "Active",
                  CompanyId: CompanyIdLocalSTG,
                }),
              ),
            }),
            fetchDDL({
              tbl: "master.enquiryfor",
              searchField: "EnquiryFor",
              filterData: encodeURIComponent(
                JSON.stringify({ CompanyId: CompanyIdLocalSTG }),
              ),
            }),
            fetchDDL({
              tbl: "master.EnquiryType",
              searchField: "EnquiryType",
              filterData: encodeURIComponent(
                JSON.stringify({ CompanyId: CompanyIdLocalSTG }),
              ),
            }),
            fetchDDL({
              tbl: "master.HowdidyouFindUs",
              searchField: "HowdidyouFindUs",
              filterData: encodeURIComponent(
                JSON.stringify({ CompanyId: CompanyIdLocalSTG }),
              ),
            }),
            fetchDDL({ tbl: "master.country", searchField: "countryname" }),
            universalService({
              procName: "AddEnquiry",
              Para: JSON.stringify({
                CompanyId: CompanyIdLocalSTG,
                ActionMode: "getEnquiryUsers",
              }),
            }),
          ]);

        setProducts(normalizeDDL(prodRes));
        setEnquiryForList(normalizeDDL(forRes));
        setEnquiryTypes(normalizeDDL(typeRes));
        setFindUsList(normalizeDDL(findRes));
        setCountries(normalizeDDL(countryRes));

        const rawFixedUsers = Array.isArray(userRes?.data)
          ? userRes.data
          : Array.isArray(userRes)
            ? userRes
            : [];

        const fixedUsers = rawFixedUsers.map((u: any) => ({
          EmployeeId: u.EmployeeId,
          Name: `${u.FirstName ?? ""} ${u.LastName ?? ""}`.trim(),
          DesignationName: u.DesignationName,
          ProfilePic: u.ProfilePic,
          isFixed: true,
        }));

        if (isEditMode) {
          // fetch enquiry data
          const res = await universalService({
            procName: "AddEnquiry",
            Para: JSON.stringify({
              ActionMode: "Select",
              EditId: enquiryId,
              CompanyId: CompanyIdLocalSTG,
            }),
          });

          const data = res?.data?.[0] || res?.[0];

          if (data) {
            setEditData(data);

            let assignedFromDB: any[] = [];

            if (data.EmployeeList) {
              const parsed = JSON.parse(data.EmployeeList);

              assignedFromDB = parsed.map((e: any) => ({
                EmployeeId: e.EmployeeId,
                Name: e.EmployeeName,
                DesignationName: e.Designation,
                ProfilePic: e.ProfilePic,
                isFixed: false,
              }));
            }

            // merge fixed + db employees
            const mergedEmployees = [
              ...fixedUsers,
              ...assignedFromDB.filter(
                (dbEmp) =>
                  !fixedUsers.some(
                    (fixed) => fixed.EmployeeId === dbEmp.EmployeeId,
                  ),
              ),
            ];

            setAssignedEmployees(mergedEmployees);
          }
        } else {
          setAssignedEmployees(fixedUsers);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isEditMode, enquiryId]);

  const handleSubmitForm = async (
    values: EnquiryFormValues,
    { setSubmitting }: any,
  ) => {
    if (assignedEmployees.length === 0) {
      Swal.fire({
        title: "Assignment Required",
        text: "Please assign at least one employee.",
        icon: "warning",
        confirmButtonColor: "#F59E0B",
      });
      setSubmitting(false);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        procName: "AddEnquiry",
        Para: JSON.stringify({
          ActionMode: isEditMode ? "Update" : "Insert",
          EditId: isEditMode ? enquiryId : "",
          Name: values.name,
          ContactNo: values.contactNumber,
          EmailId: values.email,
          Address: values.address,
          Query: values.enquiryDetail,
          CountryId: values.country || 0,
          StateId: values.state || 0,
          CityId: values.city || 0,
          ProductId: values.productService || 0,
          EnquiryFor: values.enquiryFor,
          EnquiryType: values.enquiryType,
          ExpectedCallBack: values.callbackDate,
          HowdidyouFindUs: values.findUs,
          EmployeeList: encodeURIComponent(
            JSON.stringify(assignedEmployees.map((e) => e.EmployeeId)),
          ),
          EntryBy: loggedInEmployeeId,
          CompanyId: CompanyIdLocalSTG,
        }),
      };

      const res = await universalService(payload);

      const responseData = Array.isArray(res?.data)
        ? res.data[0]
        : Array.isArray(res)
          ? res[0]
          : null;

      if (responseData?.statuscode === "1") {
        // ✅ INSERT SUCCESS
        Swal.fire({
          title: "Success!",
          text: responseData.msg || "Enquiry created successfully.",
          icon: "success",
          confirmButtonColor: "#3B82F6",
        }).then(() => {
          navigate("/superadmin/enquiry/manage-enquiries");
        });
      } else if (responseData?.statuscode === "2") {
        // ✅ UPDATE SUCCESS
        Swal.fire({
          title: "Updated!",
          text: responseData.msg || "Enquiry updated successfully.",
          icon: "success",
          confirmButtonColor: "#22C55E",
        }).then(() => {
          navigate("/superadmin/enquiry/manage-enquiries");
        });
      } else {
        // ❌ BACKEND ERROR
        Swal.fire({
          title: "Failed",
          text: responseData?.msg || "Operation failed.",
          icon: "error",
          confirmButtonColor: "#EF4444",
        });
      }
    } catch (error) {
      Swal.fire("Error", "Something went wrong while submitting.", "error");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const removeEmployee = (id: number) => {
    if (assignedEmployees.length === 1) {
      Swal.fire({
        title: "Action not allowed",
        text: "At least one employee must remain assigned.",
        icon: "info",
      });
      return;
    }
    setAssignedEmployees(
      assignedEmployees.filter((emp) => emp.EmployeeId !== id),
    );
  };

  const filteredUsers = users.filter((u) => {
    const notAssigned = !assignedEmployees.some(
      (emp) => emp.EmployeeId === u.EmployeeId,
    );
    const searchText = userSearch.toLowerCase();
    return (
      notAssigned &&
      (u.Name?.toLowerCase().includes(searchText) ||
        u.DesignationName?.toLowerCase().includes(searchText))
    );
  });

  return (
    <Formik<EnquiryFormValues>
      enableReinitialize
      initialValues={{
        name: editData?.Name ?? "",
        contactNumber: editData?.ContactNo ?? "",
        email: editData?.EmailId ?? "",
        productService: splitDDLValue(editData?.ProductId),
        enquiryFor: editData?.EnquiryFor ?? "",
        enquiryType: editData?.EnquiryType ?? "",
        enquiryDetail: editData?.Query ?? "",
        country: splitDDLValue(editData?.CountryId),
        state: splitDDLValue(editData?.StateId),
        city: splitDDLValue(editData?.CityId),
        address: editData?.Address ?? "",
        callbackDate: editData?.ExpectedCallBack?.split("T")[0] ?? todayDate,
        findUs: editData?.HowdidyouFindUs ?? "",
      }}
      validationSchema={enquiryValidationSchema}
      onSubmit={handleSubmitForm}
    >
      {(formik: FormikProps<EnquiryFormValues>) => {
        const {
          values,
          errors,
          touched,
          handleChange,
          setFieldValue,
          isSubmitting,
        } = formik;

        // Effect for States
        useEffect(() => {
          if (!values.country) return;

          // 🚫 Skip reset on first initialization (edit mode)
          if (
            prevCountryRef.current &&
            prevCountryRef.current !== values.country
          ) {
            setFieldValue("state", "");
            setFieldValue("city", "");
            setCities([]);
          }

          prevCountryRef.current = values.country;

          setIsLoadingStates(true);
          fetchDDL({
            tbl: "master.state",
            searchField: "statename",
            filterCTL: "countryid",
            filterCTLvalue: values.country,
          }).then((res) => {
            setStates(normalizeDDL(res));
            setIsLoadingStates(false);
          });
        }, [values.country]);

        // Effect for Cities
        useEffect(() => {
          if (!values.state) return;

          // 🚫 Skip reset on first initialization (edit mode)
          if (prevStateRef.current && prevStateRef.current !== values.state) {
            setFieldValue("city", "");
          }

          prevStateRef.current = values.state;

          setIsLoadingCities(true);
          fetchDDL({
            tbl: "master.city",
            searchField: "cityname",
            filterCTL: "stateid",
            filterCTLvalue: values.state,
          }).then((res) => {
            setCities(normalizeDDL(res));
            setIsLoadingCities(false);
          });
        }, [values.state]);

        useEffect(() => {
          if (!isModalOpen) return;

          const fetchModalUsers = async () => {
            try {
              const res = await universalService({
                procName: "Employee",
                Para: JSON.stringify({
                  CompanyId: CompanyIdLocalSTG,
                  ActionMode: "getUsersListByCompany",
                }),
              });

              const rawUsers = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res)
                  ? res
                  : [];

              const formattedUsers = rawUsers.map((u: any) => ({
                EmployeeId: u.EmployeeId,
                Name:
                  u.Name || `${u.FirstName ?? ""} ${u.LastName ?? ""}`.trim(),
                DesignationName: u.DesignationName,
                ProfilePic: u.ProfilePic,
                isFixed: false,
              }));

              setUsers(formattedUsers);
            } catch (err) {
              console.error(err);
            }
          };

          fetchModalUsers();
        }, [isModalOpen]);

        return (
          <div className="relative bg-white dark:bg-[#0c1427] dark:text-gray-100 rounded-lg mb-10">
            {(loading || isSubmitting) && (
              <div className="absolute inset-0 z-50 bg-white/50 dark:bg-[#0c1427]/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
              <div className="text-lg font-bold text-gray-800 dark:text-white">
                {isEditMode ? "Edit Enquiry" : "Add Enquiry"}
              </div>
              <div className="flex gap-x-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="enquiryForm"
                  className="px-4 py-1.5 rounded text-sm font-medium text-white bg-primary-button-bg hover:bg-primary-button-bg-hover shadow-sm"
                >
                  {isEditMode ? "Update" : "Submit"}
                </button>
              </div>
            </div>

            <Form
              id="enquiryForm"
              className="flex flex-col lg:flex-row min-h-[500px]"
            >
              <div className="flex-[3] p-5 lg:border-r border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[calc(100vh-210px)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                  <InputField
                    label="Name:*"
                    name="name"
                    placeholder="Enter name"
                    value={values.name}
                    onChange={handleChange}
                    error={errors.name}
                    touched={touched.name}
                  />
                  <InputField
                    label="Contact Number:*"
                    name="contactNumber"
                    placeholder="Enter contact number"
                    value={values.contactNumber}
                    onChange={handleChange}
                    error={errors.contactNumber}
                    touched={touched.contactNumber}
                  />
                  <InputField
                    label="Email:"
                    name="email"
                    placeholder="Enter Email"
                    value={values.email}
                    onChange={handleChange}
                  />

                  <SelectField
                    label="Product/Service:*"
                    name="productService"
                    options={products}
                    value={values.productService}
                    onChange={handleChange}
                    error={errors.productService}
                    touched={touched.productService}
                  />
                  <SelectField
                    label="Enquiry For:*"
                    name="enquiryFor"
                    options={enquiryForList}
                    value={values.enquiryFor}
                    onChange={handleChange}
                    error={errors.enquiryFor}
                    touched={touched.enquiryFor}
                  />
                  <SelectField
                    label="Enquiry Type:*"
                    name="enquiryType"
                    options={enquiryTypes}
                    value={values.enquiryType}
                    onChange={handleChange}
                    error={errors.enquiryType}
                    touched={touched.enquiryType}
                  />

                  <div className="md:col-span-3">
                    <TextAreaField
                      label="Enquiry Detail:*"
                      name="enquiryDetail"
                      rows={4}
                      value={values.enquiryDetail}
                      onChange={handleChange}
                      error={errors.enquiryDetail}
                      touched={touched.enquiryDetail}
                      disabled={isEditMode}
                    />
                  </div>

                  <SelectField
                    label="Country:*"
                    name="country"
                    options={countries}
                    value={values.country}
                    onChange={handleChange}
                    error={errors.country}
                    touched={touched.country}
                  />
                  <SelectField
                    label={isLoadingStates ? "Loading States..." : "State:"}
                    name="state"
                    options={states}
                    value={values.state}
                    onChange={handleChange}
                    isLoading={isLoadingStates}
                    disabled={!values.country || isLoadingStates}
                  />
                  <SelectField
                    label={isLoadingCities ? "Loading Cities..." : "City:"}
                    name="city"
                    options={cities}
                    value={values.city}
                    onChange={handleChange}
                    isLoading={isLoadingCities}
                    disabled={!values.state || isLoadingCities}
                  />

                  <InputField
                    label="Address:"
                    name="address"
                    placeholder="Enter address"
                    value={values.address}
                    onChange={handleChange}
                  />
                  <InputField
                    label="Expected CallBack Date:"
                    name="callbackDate"
                    type="date"
                    value={values.callbackDate}
                    onChange={handleChange}
                    disabled={isEditMode}
                  />
                  <SelectField
                    label="How did you find us?:"
                    name="findUs"
                    options={findUsList}
                    value={values.findUs}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* --- EXACT ORIGINAL DESIGN FOR ASSIGN ENQUIRY --- */}
              <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-[#0c1427] overflow-y-auto max-h-[calc(100vh-210px)]">
                <div className="p-5 flex items-center border-b border-gray-100 dark:border-gray-700">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-800 dark:text-white tracking-wider">
                      Assign Enquiry
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium -mt-5">
                      Assigned to {assignedEmployees.length} Employee(s)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="w-[34px] h-[34px] flex items-center justify-center border border-primary-500 text-primary-500 rounded-md hover:bg-primary-500 hover:text-white transition-all shadow-sm"
                  >
                    <span className="text-xl font-light">+</span>
                  </button>
                </div>

                <div className="p-5 flex-1 space-y-3">
                  {assignedEmployees.length > 0 ? (
                    assignedEmployees.map((emp) => (
                      <div
                        key={emp.EmployeeId}
                        className="flex items-center gap-x-5 px-5 py-3 border-b bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#16203a] transition-all"
                      >
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                          {hasValidProfileImage(emp.ProfilePic) ? (
                            <img
                              src={`${import.meta.env.VITE_IMAGE_PREVIEW_URL}${emp.ProfilePic.split("|")[0]}`}
                              alt={emp.Name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                              {emp.Name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <span className="text-[13px] font-medium text-gray-800 dark:text-white truncate">
                            {emp.Name}
                          </span>
                          <span className="text-[11px] text-gray-500 truncate">
                            {emp.DesignationName}
                          </span>
                        </div>
                        {!emp.isFixed && (
                          <button
                            type="button"
                            onClick={() => removeEmployee(emp.EmployeeId)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <FaTimes size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                      <p className="text-xs text-gray-400 font-medium">
                        No employee assigned
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* --- END ORIGINAL DESIGN --- */}
            </Form>

            <SelectUserModal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              users={filteredUsers}
              onSelect={(user: any) => {
                setAssignedEmployees([
                  ...assignedEmployees,
                  { ...user, isFixed: false },
                ]);
                setIsModalOpen(false);
              }}
              search={userSearch}
              setSearch={setUserSearch}
            />
          </div>
        );
      }}
    </Formik>
  );
}
