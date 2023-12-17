export function storedHeaders(): { [key: string]: string } {
    const storedAccount = sessionStorage.getItem('account');

    // 如果 storedAccount 不為 null，則对其进行 URL 编码并返回含有 'stored-account' 的对象
    if (storedAccount !== null) {
        const encodedAccount = encodeURIComponent(storedAccount);
        return { 'stored-account': encodedAccount };
    }

    // 否則返回一個空物件
    return {};
}
