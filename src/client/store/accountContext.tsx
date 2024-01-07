import React, { createContext, useState, useContext, ReactNode } from 'react';

// 定義 Context 的類型
interface AccountContextType {
    account: string;
    setAccount: (account: string) => void;
}

// 創建一個具有明確類型的 Context
const AccountContext = createContext<AccountContextType | null>(null);

// 導出一個自定義的 hook，用於在組件中訪問 context
export const useAccount = () => {
    const context = useContext(AccountContext);
    if (!context) {
        throw new Error('useAccount must be used within a AccountProvider');
    }
    return context;
};

// 提供者組件
export const AccountProvider = ({ children }: { children: ReactNode }) => {
    const [account, setAccount] = useState<string>(sessionStorage.getItem('temp-account') || '');

    return (
        <AccountContext.Provider value={{ account, setAccount }}>
            {children}
        </AccountContext.Provider>
    );
};
