import * as Yup from "yup";

export const getRegisterValidationSchema = (settings: any) =>
  Yup.object({
    sponsorId: Yup.string().required("Sponsor ID is required"),

    placeUnderId:
      settings.PlacementType === "Manual"
        ? Yup.string().required("Place Under is required")
        : Yup.string().nullable(),

    position:
      settings.PlanType === "Binary"
        ? Yup.string().required("Position is required")
        : Yup.string().nullable(),

    username:
      settings.UserNameType === "Manual"
        ? Yup.string().required("Username is required")
        : Yup.string().nullable(),

    password:
      settings.PasswordType === "Manual"
        ? Yup.string()
            .min(6, "Minimum 6 characters")
            .required("Password is required")
        : Yup.string().nullable(),

    firstName: Yup.string().required("First Name is required"),

    lastName: Yup.string().required("Last Name is required"),

    email: Yup.string()
      .email("Invalid email")
      .required("Email is required"),

    mobileNumber: Yup.string()
      .matches(/^[0-9]+$/, "Digits only")
      .min(10)
      .required("Mobile number is required"),
  });
