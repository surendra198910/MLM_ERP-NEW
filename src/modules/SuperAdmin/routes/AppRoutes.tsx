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
import PanelSettingHarsh from "../components/ThemeManagement/PanelSettingHarsh.js";
import AddEditEmployee from "../components/Employee/AddEditEmployee";

import Ref from "../components/Forms/Ref.js";
import MLMRegisterPage from "../components/Client/Register.js";
import GenerationTree from "../components/Client/GenerationTree/GenerationTree.js";
import Geneaology from "../components/Client/GenerationTree/Geneaology.js";
import Template from "../../../components/CommonFormElements/Template.js";
import MemberWallet from "../components/Client/MemberWallet.js";
// import DummyTabForm from "../BindedComponent/DummyTabForm.js";
import ProcessROIIncome from "../components/Commission/ProcessROI.js";

import GlobalSetting from "../components/settings/GlobalSetting";
import ManageClient from "../components/Client/ManageClient";
import MemberInvestment from "../components/Client/MemberInvestment.js";
import PackageMaster from "../components/settings/PackageMaster.js";
import ROISetting from "../components/settings/ROISetting.js";
import ManagePackage from "../components/settings/ManagePackage.js";
import SponsorSetting from "../components/settings/SponsorSetting.js";
import APIManager from "../components/settings/APIManager.js";
import LevelSetting from "../components/settings/LevelSetting.js";
import BinaryIncomeSetting from "../components/settings/BinaryIncomeSetting.js";
// import ProcessROIIncome from "../components/Commission/ProcessROIIncome.js";
import IncomeSetting from "../components/settings/IncomeSetting.js";
import ROIIncomeReport from "../components/Commission/ROIIncomeReport.js";
import AddReport from "../components/AdministrativeTools/AddReport/AddReport.js";
import ManageReports from "../components/AdministrativeTools/AddReport/ManageReport.js";
import ContactTypeV2 from "../components/Common/ContactTypeV2.js";

import MemberFroms from "../components/Forms/MemberForms.js";
import MemberFromCategory from "../components/Forms/MemberFormCategory";

//Website Management
import ManageMemberPopup from "../components/WebsiteManagement/ManageMemberPopup.js";
import ManageMemberBanner from "../components/WebsiteManagement/ManageMemberBanner.js";
import ManageWebsiteBanner from "../components/WebsiteManagement/ManageWebsiteBanner.js";
import ManageWebsitePopup from "../components/WebsiteManagement/ManageWebsitePopup.js";
import ProductWalletTransfer from "../components/PaymentMaster/ProductWalletTransfer.js";
import WalletTransferReport from "../components/PaymentMaster/WalletTransferReport.js";
import MailTemplateMaster from "../components/WebsiteManagement/MailTemplateMaster.js";

//Report
import InvestmentReport from "../components/Reports/InvestmentReport.js";
import Withdraw from "../components/Reports/WithdrawReport.js";
import TeamReport from "../components/Reports/TeamReport.js";

//Support
import CreateSupportTicket from "../components/Support/CreateSupportTicket.js";
import MySupportTicket from "../components/Support/MySupportTicket.js";
import SearchTicketAll from "../components/Support/SearchTicketAll.js";
import SupportDetailPage from "../components/Support/SupportDetailPage.js";
//Withdrawal
import WithdrawalSetting from "../components/WithdrawalSetting/WithdrawalSetting.js";
//Social Media
import SocialMediaSetting from "../components/SocialMediaSetting/SocialMediaSetting.js";

import MarqueeNewsManagement from "../components/WebsiteManagement/MarqueeNewsManagement.js";
import LibraryManagement from "../components/WebsiteManagement/LibraryManagement.js";
import SocialMediaPlatform from "../components/Common/SocialMediaPlatform.js";
import WithrawalBy from "../components/Common/WithdrawalBy.js";
import MemberThemeManagement from "../components/ThemeManagement/MemberThemeManagement.js";
import NewsAndAnnoucement from "../components/WebsiteManagement/NewsAndAnnouncement.js";

// Crypto wallet setting
import ManageCryptowallet from "../components/settings/ManageCryptoWallet.js";
import ManageWalletType from "../components/settings/ManageWalletType.js";
import CompanyBankAccount from "../../SuperAdmin/components/settings/ManagebankAccount.js";
import ProtectedRoute from "../../../utils/ProtectedRoutes.js";

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
            <Route element={<ProtectedRoute />}>
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
                path="superadmin/employee/add-employee/:id?"
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
                path="/superadmin/company/add-company/:id"
                element={<AddCompany />}
              />
              <Route
                path="/superadmin/company/branch"
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
                path="/superadmin/client/add-client/:ClientId?"
                element={<MLMRegisterPage />}
              />
              <Route
                path="/superadmin/client/generation-tree"
                element={<GenerationTree />}
              />
              <Route
                path="/superadmin/client/binary-tree"
                element={<Geneaology />}
              />
              <Route
                path="/superadmin/client/member-wallet"
                element={<MemberWallet />}
              />
              //Admin Tools
              <Route
                path="/superadmin/admin-tools/global-setting"
                element={<GlobalSetting />}
              />
              <Route
                path="/superadmin/admin-tools/income-setting"
                element={<IncomeSetting />}
              />
              <Route
                path="/superadmin/admin-tools/api-manager"
                element={<APIManager />}
              />
              //Client
              <Route
                path="/superadmin/client/manage-client"
                element={<ManageClient />}
              />
              <Route
                path="/superadmin/client/member-investment"
                element={<MemberInvestment />}
              />
              //Package
              <Route
                path="/superadmin/package/add-package"
                element={<PackageMaster />}
              />
              <Route
                path="/superadmin/package/add-package/:id"
                element={<PackageMaster />}
              />
              <Route
                path="/superadmin/package/manage-package"
                element={<ManagePackage />}
              />
              <Route
                path="/superadmin/mlm-setting/roi-setting"
                element={<ROISetting />}
              />
              <Route
                path="/superadmin/mlm-setting/sponsor-setting"
                element={<SponsorSetting />}
              />
              <Route
                path="/superadmin/mlm-setting/level-setting"
                element={<LevelSetting />}
              />
              <Route
                path="/superadmin/mlm-setting/binary-income-setting"
                element={<BinaryIncomeSetting />}
              />
              <Route
                path="/superadmin/commission/process-roi-income"
                element={<ProcessROIIncome />}
              />
              <Route
                path="/superadmin/commission/roi-income-report"
                element={<ROIIncomeReport />}
              />
              <Route
                path="/superadmin/mlm-setting/add-report/:id?"
                element={<AddReport />}
              />
              <Route
                path="/superadmin/mlm-setting/manage-report"
                element={<ManageReports />}
              />
              <Route
                path="/superadmin/mlm-setting/testing"
                element={<ContactTypeV2 />}
              />
              //Forms
              <Route
                path="/superadmin/forms/member-forms"
                element={<MemberFroms />}
              />
              <Route
                path="/superadmin/forms/member-form-categories"
                element={<MemberFromCategory />}
              />
              //Website Management
              <Route
                path="/superadmin/website-management/member-popup"
                element={<ManageMemberPopup />}
              />
              <Route
                path="/superadmin/website-management/member-banner"
                element={<ManageMemberBanner />}
              />
              <Route
                path="/superadmin/website-management/website-banner"
                element={<ManageWebsiteBanner />}
              />
              <Route
                path="/superadmin/website-management/website-popup"
                element={<ManageWebsitePopup />}
              />
              <Route
                path="/superadmin/website-management/news-and-announcement"
                element={<NewsAndAnnoucement />}
              />
              <Route
                path="/superadmin/website-management/email-template"
                element={<MailTemplateMaster />}
              />
              //Support
              <Route
                path="/superadmin/support-center/my-support-ticket"
                element={<MySupportTicket />}
              />
              <Route
                path="/superadmin/support-center/search-ticket-all"
                element={<SearchTicketAll />}
              />
              <Route
                path="/superadmin/support-center/createticket"
                element={<CreateSupportTicket />}
              />
              <Route
                path="/superadmin/support-center/createticket/:taskId?"
                element={<CreateSupportTicket />}
              />
              <Route
                path="/superadmin/support-center/support-detail"
                element={<SupportDetailPage />}
              />
              <Route
                path="/superadmin/support-center/support-detail/:taskId?"
                element={<SupportDetailPage />}
              />
              //PaymentMaster
              <Route
                path="/superadmin/payment-master/wallet-transfer"
                element={<ProductWalletTransfer />}
              />
              <Route
                path="/superadmin/payment-master/wallet-transfer-report"
                element={<WalletTransferReport />}
              />
              //Report
              <Route
                path="/superadmin/reports/investment-report"
                element={<InvestmentReport />}
              />
              <Route
                path="/superadmin/reports/withdraw-report"
                element={<Withdraw />}
              />
              <Route
                path="/superadmin/reports/team-report"
                element={<TeamReport />}
              />
              //Withdrawal
              <Route
                path="/superadmin/mlm-setting/withdrawal-setting"
                element={<WithdrawalSetting />}
              />
              //SocialMedia Setting
              <Route
                path="/superadmin/mlm-setting/socialmedia-setting"
                element={<SocialMediaSetting />}
              />
              <Route
                path="/superadmin/website-management/marquee-news-management"
                element={<MarqueeNewsManagement />}
              />
              <Route
                path="/superadmin/website-management/library-management"
                element={<LibraryManagement />}
              />
              <Route
                path="/superadmin/common/social-media-platfrom"
                element={<SocialMediaPlatform />}
              />
              <Route
                path="/superadmin/common/withdraw-method"
                element={<WithrawalBy />}
              />
              <Route
                path="/superadmin/theme/member-panel-theme"
                element={<MemberThemeManagement />}
              />
              //Manage Crypto wallet
              <Route
                path="/superadmin/mlm-setting/CryptoWallet-setting"
                element={<ManageCryptowallet />}
              />
              <Route
                path="/superadmin/mlm-setting/WalletType-setting"
                element={<ManageWalletType />}
              />
              <Route
                path="/superadmin/mlm-setting/company-bank-account"
                element={<CompanyBankAccount />}
              />
            </Route>
          </Routes>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AppRoutes;
