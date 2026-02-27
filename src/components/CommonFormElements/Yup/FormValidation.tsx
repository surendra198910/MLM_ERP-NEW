import * as Yup from "yup";

export const formSchema = Yup.object().shape({
  ContactTypeName: Yup.string()
    .trim()
    .required("Contact Type is required")
    .min(2, "Minimum 2 characters required")
    .max(50, "Maximum 50 characters allowed"),
});

export default formSchema;