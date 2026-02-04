import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";

const SignInForm: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  const loginUrl = import.meta.env.VITE_LOGIN_URL;

  const initialValues = { adminId: "", password: "" };

  const validationSchema = Yup.object({
    adminId: Yup.string().required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setApiError("");

    try {
      const payload = {
        Username: values.adminId,
        Password: values.password,
      };

      const response = await axios.post(loginUrl, payload);

      const result = response.data;
      console.log("Login Response:", result);

      if (result?.StatusCode === 1) {
        toast.success(result.Msg || "Login successful!");

        // ⭐ NEW: Save token
        localStorage.setItem("authtoken", result.Token);

        // ⭐ NEW: Save employee details
        if (result.Employee) {
          localStorage.setItem(
            "EmployeeDetails",
            JSON.stringify(result.Employee)
          );

          // Save common values for use in UI
          localStorage.setItem("FullName", result.Employee.FirstName || "");
          localStorage.setItem("EmailId", result.Employee.EmailId || "");
          localStorage.setItem("CompanyId", result.Employee.CompanyId || "");
          localStorage.setItem("ActiveModuleId",result.Employee.ActiveModuleId || "");
          localStorage.setItem("ActiveModuleId",result.Employee.ActiveModuleId || "");

        }

        // ⭐ SAVE PANEL SETTINGS (THEME)
        if (result.PanelSetting) {
          localStorage.setItem(
            "PanelSetting",
            JSON.stringify(result.PanelSetting)
          );

          localStorage.setItem("SidebarColor", result.PanelSetting.SidebarColor || "");
          localStorage.setItem("TextColor", result.PanelSetting.TextColor || "");
          localStorage.setItem("FooterData", result.PanelSetting.FooterData || "");
          localStorage.setItem("PanelLogo", result.PanelSetting.Logo || "");
          localStorage.setItem("HoverColor", result.PanelSetting.HoverColor || "");
          localStorage.setItem("SidebarHeader", result.PanelSetting.SidebarHeader || "");
        }


        setTimeout(() => navigate("/superadmin"), 800);
      } else {
        const msg = result?.Msg || "Invalid Email or Password!";
        setApiError(msg);
        toast.error(msg);
      }
    } catch (error) {
      const msg = "Network error. Please check your connection.";
      setApiError(msg);
      toast.error(msg);
    }

    setSubmitting(false);
  };

  return (
    <>
      <ToastContainer />

      <div className="auth-main-content bg-white dark:bg-[#0a0e19] py-[60px] md:py-[80px] lg:py-[135px]">
        <div className="mx-auto px-[12.5px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1255px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[25px] items-center">
            {/* LEFT SIDE IMAGE */}
            <div className="xl:ltr:-mr-[25px] xl:rtl:-ml-[25px] 2xl:ltr:-mr-[45px] 2xl:rtl:-ml-[45px] rounded-[25px] order-2 lg:order-1">
              <img
                src="/images/sign-in.jpg"
                alt="sign-in-image"
                className="rounded-[25px]"
                width={646}
                height={804}
              />
            </div>

            {/* RIGHT SIDE FORM */}
            <div className="xl:ltr:pl-[90px] xl:rtl:pr-[90px] 2xl:ltr:pl-[120px] 2xl:rtl:pr-[120px] order-1 lg:order-2">
              <img
                src="/images/logo-big.svg"
                className="inline-block dark:hidden"
                width={142}
              />
              <img
                src="/images/white-logo-big.svg"
                className="hidden dark:inline-block"
                width={142}
              />

              <div className="my-[17px] md:my-[25px]">
                <h1 className="font-semibold text-[22px] md:text-xl lg:text-2xl mb-[5px]">
                  Welcome back to Trezo!
                </h1>
                <p className="font-medium lg:text-md text-[#445164] dark:text-gray-400">
                  Sign In with social account or enter your details
                </p>
              </div>

              {/* SOCIAL LOGIN BUTTONS */}
              <div className="flex items-center justify-between mb-[20px] md:mb-[23px] gap-[12px]">
                {["google.svg", "facebook2.svg", "apple.svg"].map(
                  (icon, idx) => (
                    <div className="grow" key={idx}>
                      <button
                        type="button"
                        className="block w-full rounded-md py-[10.5px] px-[25px] border border-[#D6DAE1] dark:border-[#172036] bg-white dark:bg-[#0a0e19] text-black dark:text-white hover:border-primary-500 shadow-sm"
                      >
                        <img
                          src={`/images/icons/${icon}`}
                          width={25}
                          height={25}
                        />
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* API ERROR MESSAGE */}
              {apiError && (
                <div className="bg-red-100 text-red-700 border border-red-300 rounded-md p-3 text-sm mb-3">
                  {apiError}
                </div>
              )}

              {/* FORMIK FORM */}
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    {/* EMAIL FIELD */}
                    <div className="mb-[15px]">
                      <label className="mb-[10px] font-medium block text-black dark:text-white">
                        Email Address
                      </label>
                      <Field
                        type="text"
                        name="adminId"
                        placeholder="example@trezo.com"
                        className="h-[55px] w-full rounded-md border border-gray-200 
                        dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] text-black 
                        dark:text-white"
                      />
                      <ErrorMessage
                        name="adminId"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>

                    {/* PASSWORD FIELD */}
                    <div className="mb-[15px]">
                      <label className="mb-[10px] font-medium block text-black dark:text-white">
                        Password
                      </label>

                      <div className="relative">
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Type password"
                          className="h-[55px] w-full rounded-md border border-gray-200 
                          dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] text-black 
                          dark:text-white"
                        />

                        {/* EYE ICON */}
                        <button
                          type="button"
                          className="absolute right-[15px] top-[17px] text-gray-400"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>

                      <ErrorMessage
                        name="password"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>

                    {/* FORGOT PASSWORD */}
                    <Link
                      to="/authentication/forgot-password"
                      className="inline-block text-primary-500 font-semibold hover:underline"
                    >
                      Forgot Password?
                    </Link>

                    {/* SUBMIT BUTTON */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full text-center mt-[20px] rounded-md font-medium py-[12px] 
                      bg-primary-500 text-white hover:bg-primary-400 flex items-center 
                      justify-center gap-[5px]"
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin" /> Signing In...
                        </>
                      ) : (
                        <>
                          <i className="material-symbols-outlined">login</i>{" "}
                          Sign In
                        </>
                      )}
                    </button>
                  </Form>
                )}
              </Formik>

              <p className="mt-[15px]">
                Don’t have an account?{" "}
                <Link
                  to="/authentication/sign-up"
                  className="text-primary-500 font-semibold hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignInForm;
