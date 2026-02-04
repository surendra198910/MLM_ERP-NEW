// src/context/SweetAlertContext.tsx
import React, { createContext, useContext } from 'react';
import Swal from 'sweetalert2';

interface SweetAlertContextType {
  showAlert: (title: string, text?: string) => Promise<any>;
  showInputAlert: (title: string, inputPlaceholder?: string) => Promise<any>;
  ShowSuccessAlert: (title: string) => Promise<any>;
  ShowConfirmAlert: (title: string, text?: string) => Promise<boolean>; // Updated return type
  ShowConfirmBox: (title: string, text?: string) => Promise<boolean>; // Updated return type
}

const SweetAlertContext = createContext<SweetAlertContextType | undefined>(undefined);

export const SweetAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showAlert = (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'OK',
    });
  };

  const showInputAlert = (title: string, inputPlaceholder?: string) => {
    return Swal.fire({
      title,
      input: 'text',
      inputPlaceholder,
      showCancelButton: true,
    });
  };

  const ShowSuccessAlert = (title: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const ShowConfirmAlert = (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed!',
      cancelButtonText: 'No, cancel!',
    }).then((result) => {
      return result.isConfirmed; // Returns true if confirmed, false otherwise
    });
  };
  const ShowConfirmBox = (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: false,
      confirmButtonText: 'Procced To Deposit',
      cancelButtonText: 'No, cancel!',
    }).then((result) => {
      return result.isConfirmed; // Returns true if confirmed, false otherwise
    });
  };
  return (
    <SweetAlertContext.Provider value={{ showAlert, showInputAlert, ShowSuccessAlert, ShowConfirmAlert,ShowConfirmBox }}>
      {children}
    </SweetAlertContext.Provider>
  );
};

export const useSweetAlert = (): SweetAlertContextType => {
  const context = useContext(SweetAlertContext);
  if (!context) {
    throw new Error('useSweetAlert must be used within a SweetAlertProvider');
  }
  return context;
};
