
export function storedHeaders(): { [key: string]: string } {
    const storedAccount = sessionStorage.getItem('account');

    // 如果 storedAccount 不為 null，則返回含有 'stored-account' 的物件
    if (storedAccount !== null) {
        return { 'stored-account': storedAccount };
    }

    // 否則返回一個空物件
    return {};
}
