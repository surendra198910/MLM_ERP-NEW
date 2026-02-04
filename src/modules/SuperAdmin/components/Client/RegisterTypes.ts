export interface FormValues {
  // --- Basic Info ---
  sponsorId: string;
  placeUnderId: string;
  position: string;
  firstName: string;
  lastName: string;
  username: string;
  gender: string;
  email: string;
  mobileNumber: string;
  profilePic: string;

  // --- Bank ---
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountHolderName: string;
  walletAddress: string;

  // --- Password ---
  newPassword: string;
  confirmPassword: string;

  // --- Nominee ---
  nomineeName: string;
  nomineeRelation: string;
  nomineeDob: string;
  address: string;
  country: string;
  state: string;
  city: string;
}

// Optional: Type for your dropdown options
export interface SelectOption {
  label: string;
  value: string | number;
}

export interface MasterDocument {
  DocumentId: number;
  DocumentName: string;
}
export interface DropdownOption {
  value: string | number;
  label: string;
}

export interface LocationFormValues {
  country: string;
  state: string;
  city: string;
}
