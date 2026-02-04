 import * as Yup from "yup";

export const employeeValidationSchema = Yup.object({
  // ================= BASIC =================
  firstName: Yup.string()
    .trim()
    .min(2, "Min 2 characters")
    .required("First name is required"),

  middleName: Yup.string().nullable(),

  lastName: Yup.string()
    .trim()
    .required("Last name is required"),

  fatherName: Yup.string()
    .trim()
    .required("Father name is required"),

  gender: Yup.string()
    .oneOf(["Male", "Female"])
    .required("Gender is required"),

  dob: Yup.date()
    .max(new Date(), "DOB cannot be future date")
    .required("Date of birth is required"),

  email: Yup.string()
    .email("Invalid email")
    .required("Email is required"),

  altEmail: Yup.string()
    .email("Invalid email")
    .nullable(),

  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Invalid phone number")
    .required("Phone number is required"),

  altPhone: Yup.string()
    .matches(/^[6-9]\d{9}$/, "Invalid phone number")
    .nullable(),

  // ================= ADDRESS =================
  address: Yup.string().required("Address is required"),
  country: Yup.string().required("Country is required"),
  state: Yup.string().required("State is required"),
  city: Yup.string().required("City is required"),
  zip: Yup.string()
    .matches(/^\d{5,6}$/, "Invalid ZIP")
    .required("ZIP is required"),

  c_address: Yup.string().nullable(),
  c_country: Yup.string().nullable(),
  c_state: Yup.string().nullable(),
  c_city: Yup.string().nullable(),
  c_zip: Yup.string()
    .matches(/^\d{5,6}$/, "Invalid ZIP")
    .nullable(),

  // ================= JOINING =================
  branch: Yup.string().required("Company/Branch required"),
  joiningDate: Yup.date().required("Joining date required"),
  employeeType: Yup.string().required("Employee type required"),
  department: Yup.string().required("Department required"),
  designation: Yup.string().required("Designation required"),

  // ================= BANK =================
  accountNumber: Yup.string()
    .matches(/^\d{6,18}$/, "Invalid account number")
    .required("Account number required"),

  ifsc: Yup.string()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC")
    .required("IFSC required"),

  bankName: Yup.string().required("Bank name required"),
  branchName: Yup.string().required("Branch name required"),

  // ================= LOGIN =================
  loginType: Yup.string().required("Login type required"),

  // ================= SKILLS =================
  shortAbout: Yup.string()
    .min(10, "Min 10 characters")
    .required("Short about required"),

  skills: Yup.string().required("Skills required"),

  totalExperience: Yup.number()
    .typeError("Must be number")
    .min(0, "Invalid experience")
    .required("Experience required"),

  // ================= SALARY (DYNAMIC) =================
  salary: Yup.object().test(
  "salary-check",
  "All salary fields must be filled",
  (value) => {
    if (!value) return false;
    return Object.values(value).every(
      (v) => v !== "" && !isNaN(Number(v))
    );
  }
),

});
