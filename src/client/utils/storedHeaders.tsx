export function storedHeaders(): { [key: string]: string } {
    const storedAccount = sessionStorage.getItem('account');
    const tempStoreAccount = sessionStorage.getItem('temp-account') || "";

    if (storedAccount !== null) {
        const encodedAccount = encodeURIComponent(storedAccount);
        let response: { [key: string]: string } = { 'stored-account': encodedAccount };
        
        if (storedAccount == "admin") 
            response['temp-stored-account'] = tempStoreAccount;

        return response;
    }

    return {};
}
