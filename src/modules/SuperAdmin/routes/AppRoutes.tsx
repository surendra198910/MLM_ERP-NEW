import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "../layout/Header/index";
import SidebarMenu from "../layout/Sidebar/index";
import Footer from "../layout/Footer";
import DashboardIndex from "../pages/Dashboard";
import CRMContacts from "../pages/CrmContacts";
import CRMCustomers from "../pages/CrmCustomers";
import Leads from "../pages/Leads";
import AddCategoryForm from "../components/Forms/AddCategory";
import Forms from "../components/Forms/Forms";
import AddEmployee from "../components/Forms/AddEmployee";
import ManageEmployee from "../components/Employee/ManageEmployee.js";
import DynamicSideBar from "../layout/Sidebar/DynamicSideBar.js";
import Country from "../components/Forms/Country";
import State from "../components/Forms/State";
import City from "../components/Forms/City";

import CompanyDocument from "../components/KYC_Document_Master/CompanyDocuments/CompanyDocuments";
import EmployeeDocument from "../components/KYC_Document_Master/EmployeeDocuments/EmployeeDocuments";
import VendorDocument from "../components/KYC_Document_Master/VendorDocuments/VendorDocuments";
import CustomerDocument from "../components/KYC_Document_Master/ClientDocuments/ClientDocuments";
import Designation from "../components/HumanResource/Designation/Designation";
import Department from "../components/HumanResource/Department/Department";
import PaymentMode from "../components/Bill_Payments/PaymentMode/PaymentMode";
import TaskType from "../components/ProjectSetting/TaskfType.js";
import EmployeeType from "../components/EmployeeSetting/EmployeeType.js";
import LoginType from "../components/EmployeeSetting/LoginType.js";
import EnquiryFor from "../components/EnquirySetting/EnquiryFor.js";
import EnquiryType from "../components/EnquirySetting/EnquiryType.js";
import FindUsType from "../components/EnquirySetting/FindUsType.js";
import ExpenseItem from "../components/Expenses/ExpenseItem.js";
import ExpenseHead from "../components/Expenses/ExpenseHead.js";
import ExpenditureGroup from "../components/Expenses/ExpenditureGroup.js";
import CurrencyMaster from "../components/CompanySetting/CurrencyMaster.js";
import FinancialYearSetting from "../components/CompanySetting/FinancialYearSetting.js";

import ManageUserPermission from "../components/Forms/ManageUserPermission.js";
import SmartyInspector from "../components/Forms/SmartyInspector.js";
import FormCategory from "../components/Forms/FormCategory.js";
import AddCompany from "../components/Company/AddCompany.js";
import ManageCompany from "../components/Company/ManageCompany.js";
import PanelSetting from "../components/Forms/PanelSetting.js";
import ContactType from "../components/Common/ContactType.js";
import TaxSetting from "../components/Common/TaxSetting.js";
import { ThemeProvider } from "../context/ThemeContext.js";
import PanelSettingHarsh from "../components/Forms/PanelSettingHarsh.js";
import AddEditEmployee from "../components/Employee/AddEditEmployee";

import Ref from "../components/Forms/Ref.js";
import MLMRegisterPage from "../components/Client/Register.js";
import GenerationTree from "../components/Client/GenerationTree/GenerationTree.js";
import Geneaology from "../components/Client/GenerationTree/Geneaology.js";
import Template from "../../../components/CommonFormElements/Template.js";
import MemberWallet from "../components/Client/MemberWallet.js";
// import DummyTabForm from "../BindedComponent/DummyTabForm.js";

import GlobalSetting from "../components/settings/GlobalSetting"
import ManageClient from "../components/Client/ManageClient"
import MemberInvestment from "../components/Client/MemberInvestment.js";
import PackageMaster from "../components/settings/PackageMaster.js";
import ROISetting from "../components/settings/ROISetting.js";
import ManagePackage from "../components/settings/ManagePackage.js";
import SponsorSetting from "../components/settings/SponsorSetting.js"
import APIManager from "../components/settings/APIManager.js"

const AppRoutes = () => {
  const [active, setActive] = useState(false);

  const toggleActive = () => {
    setActive(!active);
  };

  return (
    <ThemeProvider>
      <div
        className={`main-content-wrap transition-all ${active ? "active" : ""}`}
      >
        {/* Sidebar */}
        {/* <SidebarMenu toggleActive={toggleActive} /> */}
        <DynamicSideBar />

        <div className="main-content flex flex-col overflow-hidden min-h-screen transition-all">
          {/* Header / Topbar */}
          <Header toggleActive={toggleActive} />

          {/* Routes */}
          <Routes>
            <Route path="/superadmin" element={<DashboardIndex />} />
            <Route path="/superadmin/contacts" element={<CRMContacts />} />
            <Route path="/superadmin/customers" element={<CRMCustomers />} />
            <Route path="/superadmin/leads" element={<Leads />} />
            <Route
              path="/superadmin/forms/form-categories"
              element={<FormCategory />}
            />
            <Route path="/superadmin/forms/forms" element={<Forms />} />
            <Route
              path="/superadmin/employee/add-employee"
              element={<AddEditEmployee />}
            />
            <Route
              path="superadmin/employee/edit/:id?"
              element={<AddEditEmployee key={location.pathname} />}
            />
            <Route
              path="/superadmin/employee/manage-employee"
              element={<ManageEmployee />}
            />
            <Route path="/superadmin/common/country" element={<Country />} />
            <Route path="/superadmin/common/state" element={<State />} />
            <Route path="/superadmin/common/city" element={<City />} />
            <Route
              path="/superadmin/kyc-documents-master/company-documents"
              element={<CompanyDocument />}
            />
            <Route
              path="/superadmin/kyc-documents-master/employee-documents"
              element={<EmployeeDocument />}
            />
            <Route
              path="/superadmin/kyc-documents-master/vendor-documents"
              element={<VendorDocument />}
            />
            <Route
              path="/superadmin/kyc-documents-master/client-documents"
              element={<CustomerDocument />}
            />
            <Route
              path="/superadmin/human-resource/designation"
              element={<Designation />}
            />
            <Route
              path="/superadmin/human-resource/department"
              element={<Department />}
            />
            <Route
              path="/superadmin/bills/payments/payment-mode"
              element={<PaymentMode />}
            />
            <Route
              path="/superadmin/company/add-company"
              element={<AddCompany />}
            />
            <Route
              path="/superadmin/company/manage-company/branch"
              element={<ManageCompany />}
            />
            <Route
              path="/superadmin/project-setting/task-type"
              element={<TaskType />}
            />
            <Route
              path="/superadmin/employee-setting/employee-type"
              element={<EmployeeType />}
            />
            <Route
              path="/superadmin/employee-setting/login-type"
              element={<LoginType />}
            />
            <Route
              path="/superadmin/enquiry-setting/enquiry-for"
              element={<EnquiryFor />}
            />
            <Route
              path="/superadmin/enquiry-setting/enquiry-type"
              element={<EnquiryType />}
            />
            <Route
              path="/superadmin/enquiry-setting/how-did-you-find-us-type"
              element={<FindUsType />}
            />
            <Route
              path="/superadmin/expenses/expense-item"
              element={<ExpenseItem />}
            />
            <Route
              path="/superadmin/expenses/expense-head"
              element={<ExpenseHead />}
            />
            <Route
              path="/superadmin/expenses/expenditure-group"
              element={<ExpenditureGroup />}
            />
            <Route
              path="/superadmin/company/add-company"
              element={<AddCompany />}
            />
            <Route
              path="/superadmin/company/add-company/edit/:id"
              element={<AddCompany />}
            />
            <Route
              path="/superadmin/company/manage-company/branch"
              element={<ManageCompany />}
            />
            <Route
              path="/superadmin/company/manage-company/branch/edit/:id"
              element={<ManageCompany />}
            />
            <Route
              path="/superadmin/company-setting/currency-master"
              element={<CurrencyMaster />}
            />
            <Route
              path="/superadmin/company-setting/financial-year-setting"
              element={<FinancialYearSetting />}
            />
            <Route
              path="/superadmin/common/contact-type"
              element={<ContactType />}
            />
            <Route
              path="/superadmin/common/tax-setting"
              element={<TaxSetting />}
            />
            <Route
              path="/superadmin/theme/theme-setting"
              element={<PanelSetting />}
            />
            <Route
              path="/superadmin/theme/theme-management"
              element={<PanelSettingHarsh />}
            />
            <Route
              path="/superadmin/fetchActions"
              element={<SmartyInspector />}
            />
            <Route
              path="/superadmin/employee/:employeeId/permissions"
              element={<ManageUserPermission />}
            />

            {/* <Route path="/superadmin/employee/addedit-employee" element={<AddEditEmployee />} />
                        <Route path="/superadmin/employee/addedit-employee/:id" element={<AddEditEmployee  key={location.pathname}  />} /> */}
            <Route path="/superadmin/ref" element={<Ref />} />
            <Route path="/superadmin/template" element={<Template />} />
            <Route
              path="/superadmin/client/add-client"
              element={<MLMRegisterPage />}
            />
            <Route
              path="/superadmin/client/generation-tree" element={<GenerationTree />}
            />
            <Route
              path="/superadmin/client/binary-tree"
              element={<Geneaology />}
            />
            <Route
              path="/superadmin/client/member-wallet"
              element={<MemberWallet />}
            />
            <Route path="/superadmin/mlm-setting/global-setting" element={<GlobalSetting/>} />
            <Route path="/superadmin/client/manage-client" element={<ManageClient/>} />
            <Route path="/superadmin/client/member-investment" element={<MemberInvestment/>} />
            <Route path="/superadmin/mlm-setting/add-package" element={<PackageMaster/>} />
            <Route
              path="/superadmin/mlm-setting/add-package/:id"
              element={<PackageMaster/>}
            />
            <Route path="/superadmin/mlm-setting/roi-setting" element={<ROISetting />} />
            <Route path="/superadmin/mlm-setting/sponsor-setting" element={<SponsorSetting />} />
            <Route path="/superadmin/mlm-setting/manage-package" element={<ManagePackage />} />
            <Route path="/superadmin/mlm-setting/api-manager" element={<APIManager />} />
          </Routes>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AppRoutes;
