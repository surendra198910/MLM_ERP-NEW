import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";

import Header from "../layout/Header/index";
import SidebarMenu from "../layout/Sidebar/index";
import Footer from "../layout/Footer";
import DashboardIndex from "../pages/Dashboard";
import NewProfile from "../pages/Profile";
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
import ProcessBinaryIncome from "../components/Commission/ProcessBinaryIncome.js";

import GlobalSetting from "../components/settings/GlobalSetting";
import ManageClient from "../components/Client/ManageClient";
import MemberInvestment from "../components/Client/MemberInvestment.js";
import PackageMaster from "../components/settings/PackageMaster.js";
import ROISetting from "../components/settings/ROISetting.js";
import ManagePackage from "../components/settings/ManagePackage.js";
import SponsorSetting from "../components/settings/SponsorSetting.js";
import APIManager from "../components/settings/APIManager.js";
import LevelSetting from "../components/settings/LevelSetting.js";
import SponsorLevelIncome from "../components/AdminTools/SponsorLevelIncome.js";
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
import InvestmentReport from "../components/Investment/InvestmentReport.js";
import Withdraw from "../components/Withdraw/Withdraw.js";
import TeamReport from "../components/Reports/TeamReport.js";
import LevelWiseTeam from "../components/Team/LevelWiseTeamReport.js";

//Support
import CreateSupportTicket from "../components/Support/CreateSupportTicket.js";
import MySupportTicket from "../components/Support/MySupportTicket.js";
import SearchTicketAll from "../components/Support/SearchTicketAll.js";
import SupportDetailPage from "../components/Support/SupportDetailPage.js";
//Withdrawal
import WithdrawalSetting from "../components/WithdrawalSetting/WithdrawalSetting.js";
import WithdrawReport from "../components/Withdraw/WIthdrawReport.js";
//Social Media
import SocialMediaSetting from "../components/SocialMediaSetting/SocialMediaSetting.js";

import MarqueeNewsManagement from "../components/WebsiteManagement/MarqueeNewsManagement.js";
import LibraryManagement from "../components/WebsiteManagement/LibraryManagement.js";
import SocialMediaPlatform from "../components/Common/SocialMediaPlatform.js";
import WithrawalBy from "../components/Common/WithdrawalBy.js";
import MemberThemeManagement from "../components/ThemeManagement/MemberThemeManagement.js";
import NewsAndAnnoucement from "../components/WebsiteManagement/NewsAndAnnouncement.js";

import P2PReport from "../components/Reports/P2PReport.js";
import SponsorIncomeReport from "../components/Reports/SponsorIncomeReport.js";

// Crypto wallet setting
import ManageCryptowallet from "../components/settings/ManageCryptoWallet.js";
import ManageWalletType from "../components/settings/ManageWalletType.js";
import CompanyBankAccount from "../../SuperAdmin/components/settings/ManagebankAccount.js";
import ProtectedRoute from "../../../utils/ProtectedRoutes.js";
import AccessRestricted from "../common/AccessRestricted";

// Blocks access to any route where :id / :employeeId === "1" for non-SuperAdmin users
const SuperAdminIdGuard: React.FC<{
  paramKey: string;
  children: React.ReactNode;
}> = ({ paramKey, children }) => {
  const params = useParams<Record<string, string>>();
  const id = params[paramKey];
  const saved = localStorage.getItem("EmployeeDetails");
  const loggedInId = saved ? String(JSON.parse(saved).EmployeeId) : null;

  if (id && String(id) === "1" && loggedInId !== "1") {
    return <AccessRestricted />;
  }
  return <>{children}</>;
};
import ApproveRejectRequestFund from "../components/RequestFund/ApproveRejectRequestFund.js";
import RequestFundReport from "../components/RequestFund/RequestFundReport.js";
import BinaryTreeComponent from "../components/Team/BinaryTree/GenealogyBinaryTree.js";
import ManageLoginType from "../components/AdministrativeTools/AddReport/ManageLoginType.js";
import ManageAdminCryptoWallet from "../components/AdministrativeTools/ManageAdminCryptoWallet";

import IncomeSettings from "../components/AdminTools/IncomeSettings.js";
import ROILevelIncomeReport from "../components/Commission/ROILevelIncomeReport.js";
import BinaryIncomeReport from "../components/Commission/BinaryIncomeReport.js";
import TeamDownlineReport from "../components/Reports/TeamDownlineReport.js";
import BinaryTeamReport from "../components/Reports/BinaryTeamReport.js";

import ACtiveInActiveMembers from "../components/reports/ACtiveInActiveMembers.js";

import TopEarners from "../components/Reports/TopEarners.js";


const AppRoutes = () => {
  useEffect(() => {
    const s = document.createElement("script");

    s.src = "https://api.erppilot.io/widget/sysfo-mlm-erp.js?v=1";

    document.body.appendChild(s);

    return () => void document.body.removeChild(s);
  }, []);
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
                path="/superadmin/superadmin-tools/manage-forms/form-categories"
                element={<FormCategory />}
              />
              <Route
                path="/superadmin/superadmin-tools/manage-forms/forms"
                element={<Forms />}
              />
              <Route
                path="/superadmin/employee/add-employee"
                element={<AddEditEmployee />}
              />
              <Route
                path="superadmin/employee/add-employee/:id?"
                element={
                  <SuperAdminIdGuard paramKey="id">
                    <AddEditEmployee key={location.pathname} />
                  </SuperAdminIdGuard>
                }
              />
              <Route
                path="/superadmin/employee/manage-employee"
                element={<ManageEmployee />}
              />
              <Route path="/superadmin/common/country" element={<Country />} />
              <Route path="/superadmin/common/state" element={<State />} />
              <Route path="/superadmin/common/city" element={<City />} />
              <Route
                path="/superadmin/superadmin-tools/kyc-documents-master/company-documents"
                element={<CompanyDocument />}
              />
              <Route
                path="/superadmin/superadmin-tools/kyc-documents-master/employee-documents"
                element={<EmployeeDocument />}
              />
              <Route
                path="/superadmin/superadmin-tools/kyc-documents-master/vendor-documents"
                element={<VendorDocument />}
              />
              <Route
                path="/superadmin/superadmin-tools/kyc-documents-master/client-documents"
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
                path="/superadmin/superadmin-tools/employee-setting/employee-type"
                element={<EmployeeType />}
              />
              <Route
                path="/superadmin/superadmin-tools/employee-setting/login-type"
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
                path="/superadmin/superadmin-tools/company-setting/currency-master"
                element={<CurrencyMaster />}
              />
              <Route
                path="/superadmin/superadmin-tools/company-setting/financial-year-setting"
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
                path="/superadmin/superadmin-tools/theme/theme-setting"
                element={<PanelSetting />}
              />
              <Route
                path="/superadmin/superadmin-tools/theme/theme-management"
                element={<PanelSettingHarsh />}
              />
              <Route
                path="/superadmin/fetchActions"
                element={<SmartyInspector />}
              />
              <Route
                path="/superadmin/employee/:employeeId/permissions"
                element={
                  <SuperAdminIdGuard paramKey="employeeId">
                    <ManageUserPermission />
                  </SuperAdminIdGuard>
                }
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
                path="/superadmin/team/generation-tree"
                element={<GenerationTree />}
              />
              <Route
                path="/superadmin/team/binary-tree"
                element={<Geneaology />}
              />
              <Route
                path="/superadmin/team/new-binary-tree"
                element={<BinaryTreeComponent />}
              />
              <Route
                path="/superadmin/wallet/member-wallet"
                element={<MemberWallet />}
              />
              //Admin Tools
              <Route
                path="/superadmin/superadmin-tools/other-tools/global-setting"
                element={<GlobalSetting />}
              />
              <Route
                path="/superadmin/superadmin-tools/other-tools/income-setting"
                element={<IncomeSetting />}
              />
              <Route
                path="/superadmin/superadmin-tools/other-tools/api-manager"
                element={<APIManager />}
              />
              //Client
              <Route
                path="/superadmin/client/manage-client"
                element={<ManageClient />}
              />
              <Route
                path="/superadmin/investment/member-investment"
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
                path="/superadmin/admin-tools/roi-setting"
                element={<ROISetting />}
              />
              <Route
                path="/superadmin/admin-tools/sponsor-setting"
                element={<SponsorSetting />}
              />
              <Route
                path="/superadmin/admin-tools/level-setting"
                element={<LevelSetting />}
              />
              <Route
                path="/superadmin/admin-tools/sponsor-level-income"
                element={<SponsorLevelIncome />}
              />
              <Route
                path="/superadmin/admin-tools/binary-income-setting"
                element={<BinaryIncomeSetting />}
              />
              <Route
                path="/superadmin/commission/process-roi-income"
                element={<ProcessROIIncome />}
              />

               <Route 
                path="/superadmin/commission/process-binary-income"
                element={<ProcessBinaryIncome />}
              />
              <Route
                path="/superadmin/commission/roi-level-income-report"
                element={<ROILevelIncomeReport />}
              />
              <Route
                path="/superadmin/commission/binary-income-report"
                element={<BinaryIncomeReport />}
              />
              <Route
                path="/superadmin/commission/roi-income-report"
                element={<ROIIncomeReport />}
              />
              <Route
                path="/superadmin/request-fund/approve-reject-requestfund"
                element={<ApproveRejectRequestFund />}
              />
              <Route
                path="/superadmin/request-fund/request-fund-report"
                element={<RequestFundReport />}
              />
              <Route
                path="/superadmin/superadmin-tools/reports/add-report/:id?"
                element={<AddReport />}
              />
              <Route
                path="/superadmin/superadmin-tools/reports/manage-report"
                element={<ManageReports />}
              />
              <Route
                path="/superadmin/admin-tools/testing"
                element={<ContactTypeV2 />}
              />
              //Forms
              <Route
                path="/superadmin/superadmin-tools/manage-forms/member-forms"
                element={<MemberFroms />}
              />
              <Route
                path="/superadmin/superadmin-tools/manage-forms/member-form-categories"
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
                path="/superadmin/superadmin-tools/templates/email-template"
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
                path="/superadmin/investment/investment-report"
                element={<InvestmentReport />}
              />
              <Route
                path="/superadmin/withdraw/withdraw-report"
                element={<Withdraw />}
              />
              <Route
                path="/superadmin/withdraw/withdraw-reports"
                element={<WithdrawReport />}
              />
              <Route
                path="/superadmin/reports/team-report"
                element={<TeamReport />}
              />
              <Route
                path="/superadmin/team/level-wise-team"
                element={<LevelWiseTeam />}
              />
              <Route
                path="/superadmin/reports/p2p-report"
                element={<P2PReport />}
              />

               <Route
                path="/superadmin/reports/p2p-report"
                element={<P2PReport />}
              />
              <Route
                path="/superadmin/reports/Active-InActive-Members"
                element={<ACtiveInActiveMembers />}
              />
              <Route
                path="/superadmin/reports/TopEarners"
                element={<TopEarners />}
              />
              <Route
                path="/superadmin/commission/sponsor-income-report"
                element={<SponsorIncomeReport />}
              />
               <Route
                path="/superadmin/reports/team-downline-report"
                element={<TeamDownlineReport />}
              />
              <Route
                path="/superadmin/reports/binary-team-report"
                element={<BinaryTeamReport />}
              />
              //Withdrawal
              <Route
                path="/superadmin/admin-tools/withdrawal-setting"
                element={<WithdrawalSetting />}
              />
              //SocialMedia Setting
              <Route
                path="/superadmin/admin-tools/socialmedia-setting"
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
                path="/superadmin/superadmin-tools/other-tools/withdraw-method"
                element={<WithrawalBy />}
              />
              <Route
                path="/superadmin/superadmin-tools/theme/member-panel-theme"
                element={<MemberThemeManagement />}
              />
              //Manage Crypto wallet
              <Route
                path="/superadmin/admin-tools/CryptoWallet-setting"
                element={<ManageCryptowallet />}
              />
              <Route
                path="/superadmin/admin-tools/manage-crypto-wallet-setting"
                element={<ManageAdminCryptoWallet />}
              />
              <Route
                path="/superadmin/superadmin-tools/wallet-setting/wallettype-setting"
                element={<ManageWalletType />}
              />
              <Route
                path="/superadmin/superadmin-tools/role-permission/role-permission"
                element={<ManageLoginType />}
              />
              <Route
                path="/superadmin/admin-tools/company-bank-account"
                element={<CompanyBankAccount />}
              />
              //Admin Tools
              <Route
                path="/superadmin/admin-tools/income-settings"
                element={<IncomeSettings />}
              />
              <Route path="/superadmin/my-profile" element={<NewProfile />} />
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
