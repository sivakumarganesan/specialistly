import React, { createContext, useContext, useState, useCallback } from 'react';

export interface PaymentContextType {
  isOpen: boolean;
  openPayment: (config: PaymentConfig) => void;
  closePayment: () => void;
  isProcessing: boolean;
  paymentConfig: PaymentConfig | null;
}

export interface PaymentConfig {
  serviceId: string;
  serviceType: 'course' | 'consulting';
  serviceName: string;
  amount: number;
  currency: string;
  specialistId: string;
  specialistName: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);

  const openPayment = useCallback((config: PaymentConfig) => {
    setPaymentConfig(config);
    setIsOpen(true);
  }, []);

  const closePayment = useCallback(() => {
    setIsOpen(false);
    setPaymentConfig(null);
    setIsProcessing(false);
  }, []);

  const value: PaymentContextType = {
    isOpen,
    openPayment,
    closePayment,
    isProcessing,
    paymentConfig,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePaymentContext = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePaymentContext must be used within PaymentProvider');
  }
  return context;
};
