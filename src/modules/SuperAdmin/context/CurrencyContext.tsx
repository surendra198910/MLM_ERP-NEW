// CurrencyContext.tsx
import { createContext, useContext, useState } from "react";

const CurrencyContext = createContext<any>(null);

export const CurrencyProvider = ({ children }: any) => {
  const [currency, setCurrency] = useState({
    code: "USDT",
    symbol: "$",
    rate: 1,
  });

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
