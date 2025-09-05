import React, { createContext, useContext, useState } from 'react';

const defaultTargets = ['USD', 'EUR', 'GBP', 'JPY', 'NGN', 'CAD', 'AUD', 'ZAR', 'CNY', 'BRL', 'INR'];

const CurrencyContext = createContext<any>(null);

export const CurrencyProvider = ({ children }: any) => {
  const [targets, setTargets] = useState<string[]>(defaultTargets);
  return (
    <CurrencyContext.Provider value={{ targets, setTargets }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrencyTargets = () => useContext(CurrencyContext);
