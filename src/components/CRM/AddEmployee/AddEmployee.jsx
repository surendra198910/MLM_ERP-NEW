"use client";

import React, { useState } from "react";

export default function AddEmployee() {
  const [tab, setTab] = useState(0);
  const [sameAddress, setSameAddress] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    fatherName: "",
    gender: "Male",
    dob: "",
    email: "",
    altEmail: "",
    phone: "",
    altPhone: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    c_address: "",
    c_country: "",
    c_state: "",
    c_city: "",
    c_zip: "",
    branch: "",
    manager: "",
    joiningDate: "",
    employeeType: "",
    department: "",
    designation: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    branchName: "",
    basic: "",
    hra: "",
    da: "",
    ta: "",
    esic: "",
    otherAllowance: "",
    pf: "",
    loginType: "",
    copyRoleFrom: "",
    shortAbout: "",
    skills: "",
    totalExperience: "",
  });

  const tabs = [
    "Address Details",
    "Joining Details",
    "Documents",
    "Bank Account Details",
    "Salary Details",
    "Login Detail",
    "Skills & Exp",
  ];

  // Avatar Handler
  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };
  const removeAvatar = () => setAvatar(null);

  const onChange = (key) => (e) => {
    const value = e?.target?.value ?? e;
    setForm((p) => ({ ...p, [key]: value }));
  };

  // ⭐ Dark-mode compatible input style
  const bigInputClasses =
    "w-full border border-gray-300 dark:border-gray-700 rounded-md px-4 py-3 text-base h-12 " +
    "placeholder-gray-400 dark:placeholder-gray-500 " +
    "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500";

  const InputField = ({ label, placeholder = "", type = "text", name, className }) => (
    <div className={`flex flex-col ${className || ""}`}>
      <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={form[name] ?? ""}
        onChange={onChange(name)}
        placeholder={placeholder}
        className={bigInputClasses}
      />
    </div>
  );

  const SelectField = ({ label, name, options = [] }) => (
    <div className="flex flex-col">
      <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select
        name={name}
        value={form[name] ?? ""}
        onChange={onChange(name)}
        className={`${bigInputClasses}`}
      >
        <option value="">Select</option>
        {options.map((o, idx) => (
          <option key={idx} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </div>
  );

  const TabButton = ({ i, label }) => (
    <button
      onClick={() => setTab(i)}
      className={`py-3 px-2 text-sm transition-colors ${
        tab === i
          ? "text-indigo-500 border-b-2 border-indigo-500"
          : "text-gray-500 dark:text-gray-400"
      }`}
      aria-current={tab === i}
    >
      {label.toUpperCase()}
    </button>
  );

  return (
    <div className="p-1">
      <h6 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">
        Add Employee
      </h6>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">

        {/* ================= TOP PROFILE ================= */}
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 md:col-span-2 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-700">
              {avatar ? (
                <img src={avatar} className="w-full h-full object-cover" />
              ) : (
                <svg
                  className="w-10 h-10 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeWidth={1.5} d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z" />
                  <path strokeWidth={1.5} d="M20 21a8 8 0 10-16 0" />
                </svg>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <label className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input type="file" onChange={onAvatarChange} className="hidden" />
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">
                  Upload
                </span>
              </label>

              <button className="text-xs text-red-600" onClick={removeAvatar}>
                Remove
              </button>
            </div>
          </div>

          {/* ================= MAIN FIELDS ================= */}
          <div className="col-span-12 md:col-span-10">
            <div className="grid grid-cols-12 gap-6">
              <InputField label="First Name" name="firstName" placeholder="Enter first name" className="col-span-12 md:col-span-3" />
              <InputField label="Middle Name" name="middleName" placeholder="Enter middle name" className="col-span-12 md:col-span-3" />
              <InputField label="Last Name *" name="lastName" placeholder="Enter last name" className="col-span-12 md:col-span-3" />
              <InputField label="Father's Name *" name="fatherName" placeholder="Enter father's name" className="col-span-12 md:col-span-3" />

              {/* Gender */}
              <div className="flex flex-col col-span-12 md:col-span-3">
                <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
                <div className="flex items-center gap-4 mt-2 text-gray-700 dark:text-gray-300">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={form.gender === "Male"}
                      onChange={() => onChange("gender")({ target: { value: "Male" } })}
                    />
                    Male
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={form.gender === "Female"}
                      onChange={() => onChange("gender")({ target: { value: "Female" } })}
                    />
                    Female
                  </label>
                </div>
              </div>

              <InputField label="Date of Birth *" name="dob" type="date" className="col-span-12 md:col-span-3" />
              <InputField label="Email *" name="email" placeholder="example@mail.com" className="col-span-12 md:col-span-3" />
              <InputField label="Alternate Email" name="altEmail" placeholder="example@mail.com" className="col-span-12 md:col-span-3" />
              <InputField label="Phone Number *" name="phone" placeholder="Enter phone number" className="col-span-12 md:col-span-3" />
              <InputField label="Alternate Number" name="altPhone" placeholder="Enter alternate number" className="col-span-12 md:col-span-3" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

        {/* ================= TABS ================= */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap gap-4 px-2 -mb-px">
            {tabs.map((t, i) => (
              <TabButton key={t} i={i} label={t} />
            ))}
          </nav>
        </div>

        <div className="pt-6">
          {/* ================= TAB 0 – ADDRESS ================= */}
          {tab === 0 && (
            <>
              <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">
                Permanent Address
              </h6>

              <div className="grid grid-cols-12 gap-6">
                <InputField label="Address" name="address" placeholder="Full address" className="col-span-12 md:col-span-4" />
                <div className="flex flex-col col-span-12 md:col-span-2"><SelectField label="Country" name="country" options={["India", "USA", "UK"]} className="col-span-12 md:col-span-2" /></div>
                <div className="flex flex-col col-span-12 md:col-span-2"><SelectField label="State" name="state" options={["State 1", "State 2"]} className="col-span-12 md:col-span-2" /></div>
                <div className="flex flex-col col-span-12 md:col-span-2"><SelectField label="City" name="city" options={["City 1", "City 2"]} className="col-span-12 md:col-span-2" /></div>
                <InputField label="Pin / Zip Code" name="zip" placeholder="Enter ZIP" className="col-span-12 md:col-span-2" />
              </div>

              <label className="flex items-center gap-2 mt-4 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={sameAddress}
                  onChange={(e) => setSameAddress(e.target.checked)}
                />
                Same as permanent address
              </label>

              {!sameAddress && (
                <>
                  <h6 className="text-sm text-gray-900 dark:text-gray-200 mt-6 mb-4">
                    Current Address
                  </h6>

                  <div className="grid grid-cols-12 gap-6">
                    <InputField label="Address" name="c_address" placeholder="Current address" className="col-span-12 md:col-span-4" />
                   <div className="flex flex-col col-span-12 md:col-span-2"> <SelectField label="Country" name="c_country" options={["India", "USA"]} className="col-span-12 md:col-span-2" /></div>
                   <div className="flex flex-col col-span-12 md:col-span-2"> <SelectField label="State" name="c_state" options={["State A", "State B"]} className="col-span-12 md:col-span-2" /></div>
                   <div className="flex flex-col col-span-12 md:col-span-2"> <SelectField label="City" name="c_city" options={["City X", "City Y"]} className="col-span-12 md:col-span-2" /></div>
                    <InputField label="Zip Code" name="c_zip" placeholder="Enter ZIP" className="col-span-12 md:col-span-2" />
                  </div>
                </>
              )}
            </>
          )}

          {/* ================= TAB 1 – JOINING DETAILS ================= */}
          {tab === 1 && (
            <>
              <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">Joining Details</h6>

              <div className="grid grid-cols-12 gap-6">
                <div className="flex flex-col col-span-12 md:col-span-3"><SelectField label="Branch" name="branch" options={["HQ", "Branch 1"]} className="col-span-12 md:col-span-3" /></div>
                {/* Manager Field with Icon */}
                <div className="col-span-12 md:col-span-3">
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Manager
                  </label>

                  <div className="relative">
                    <input
                      name="manager"
                      readOnly
                      placeholder="Select Manager"
                      className={`${bigInputClasses} pl-12`}
                    />

                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full 
                                    bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 
                                 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                                 px-3 py-1.5 rounded text-sm"
                    >
                      Select
                    </button>
                  </div>
                </div>

                <InputField label="Joining Date" name="joiningDate" type="date" className="col-span-12 md:col-span-3" />
                <div className="flex flex-col col-span-12 md:col-span-3"><SelectField label="Employee Type" name="employeeType" options={["Full-Time", "Intern"]} className="col-span-12 md:col-span-3" /></div>
               <div className="flex flex-col col-span-12 md:col-span-3"> <SelectField label="Department" name="department" options={["HR", "Sales", "Tech"]} className="col-span-12 md:col-span-3" /></div>
                <div className="flex flex-col col-span-12 md:col-span-3"><SelectField label="Designation" name="designation" options={["Manager", "Developer"]} className="col-span-12 md:col-span-3" /></div>
              </div>
            </>
          )}

          {/* ================= TAB 2 – DOCUMENTS ================= */}
          {tab === 2 && (
            <>
              <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-800 p-3 font-semibold text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  <div className="col-span-4">Document Name</div>
                  <div className="col-span-4">Document Number</div>
                  <div className="col-span-4">Upload</div>
                </div>

                {["Aadhar", "PAN", "Passport", "Resume"].map((label, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 p-3 gap-4 items-center border-b border-gray-200 dark:border-gray-700 
                               bg-white dark:bg-gray-900"
                  >
                    <div className="col-span-4 text-sm text-gray-800 dark:text-gray-200">
                      {label}
                    </div>

                    <div className="col-span-4">
                      <input placeholder="Enter number" className={`${bigInputClasses}`} />
                    </div>

                    <div className="col-span-2">
                      <label className="bg-indigo-600 text-white px-4 py-3 rounded-md text-sm cursor-pointer block text-center">
                        Upload File
                        <input type="file" className="hidden" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ================= TAB 3 – BANK ================= */}
          {tab === 3 && (
            <>
              <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">Bank Details</h6>

              <div className="grid grid-cols-12 gap-6">
                <InputField label="Account Number" name="accountNumber" placeholder="Enter Account Number" className="col-span-12 md:col-span-3" />
                <InputField label="IFSC" name="ifsc" placeholder="Enter IFSC Code" className="col-span-12 md:col-span-3" />
                <InputField label="Bank Name" name="bankName" placeholder="Enter Bank Name" className="col-span-12 md:col-span-3" />
                <InputField label="Branch Name" name="branchName" placeholder="Enter Branch Name" className="col-span-12 md:col-span-3" />
              </div>
            </>
          )}

          {/* ================= TAB 4 – SALARY ================= */}
          {tab === 4 && (
            <>
              <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">Earnings</h6>

              <div className="grid grid-cols-12 gap-6">
                <InputField label="Basic Salary" name="basic" placeholder="Enter Amount" className="col-span-12 md:col-span-2" />
                <InputField label="HRA" name="hra" placeholder="Enter Amount" className="col-span-12 md:col-span-2" />
                <InputField label="DA" name="da" placeholder="Enter Amount" className="col-span-12 md:col-span-2" />
                <InputField label="TA" name="ta" placeholder="Enter Amount" className="col-span-12 md:col-span-2" />
                <InputField label="ESIC" name="esic" placeholder="Enter Amount" className="col-span-12 md:col-span-2" />
                <InputField label="Other Allowance" name="otherAllowance" placeholder="Enter Amount" className="col-span-12 md:col-span-2" />
              </div>

              <h6 className="text-sm text-gray-900 dark:text-gray-200 mt-6 mb-2">Deductions</h6>

              <div className="grid grid-cols-12 gap-6">
                <InputField label="PF" name="pf" placeholder="Enter Amount" className="col-span-12 md:col-span-2" />
              </div>

              <button className="bg-indigo-600 text-white px-6 py-3 rounded-md mt-4">
                Net Salary: 0
              </button>
            </>
          )}

          {/* ================= TAB 5 – LOGIN ================= */}
          {tab === 5 && (
            <>
              <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">Login</h6>

              <div className="grid grid-cols-12 gap-6">
                <div className="flex flex-col col-span-12 md:col-span-3"><SelectField label="Login Type" name="loginType" options={["Admin", "Editor", "Viewer"]} className="col-span-12 md:col-span-3" /></div>

                <div className="col-span-12 md:col-span-3">
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">
                    Copy Role From:
                  </label>

                  <div className="relative">
                    <input
                      readOnly
                      placeholder="Select User"
                      className={`${bigInputClasses} pl-12`}
                    />

                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full 
                                    bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 dark:bg-gray-800 
                                 border border-gray-300 dark:border-gray-600 
                                 px-3 py-1.5 rounded text-sm"
                    >
                      Select
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    This will overwrite login type permissions.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 6 – SKILLS ================= */}
          {tab === 6 && (
            <>
              <h6 className="text-sm text-gray-900 dark:text-gray-200 mb-4">
                Skills & Experience
              </h6>

              <div className="grid grid-cols-12 gap-6">
                <InputField
                  label="Short About"
                  name="shortAbout"
                  placeholder="Write bried description"
                  className="col-span-12 md:col-span-6"
                />

                <InputField
                  label="Skills"
                  name="skills"
                  placeholder="e.g JavaScript, React"
                  className="col-span-12 md:col-span-6"
                />

                <InputField
                  label="Total Experience (Years)"
                  name="totalExperience"
                  placeholder="e.g 2 Years"
                  className="col-span-12 md:col-span-6"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================= SUBMIT ================= */}
      <div className="mt-6 mb-5 text-right">
        <button
          onClick={() => {
            console.log("submit", form);
            alert("Form submitted!");
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold"
        >
          Submit Employee
        </button>
      </div>
    </div>
  );
}
