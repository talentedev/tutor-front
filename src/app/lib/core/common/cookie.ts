export class Cookie {

    public static put(name, value, domain, expire): void {
        let expires = '';

        if (typeof(expire) === 'number') {
            const date = new Date();
            date.setTime(date.getTime() + (expire * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date['toGMTString']();
        } else if (typeof expire.getMonth === 'function') {
            expires = '; expires=' + expire['toGMTString']();
        }

        document.cookie = name + '=' + value + expires + '; domain=' + domain + '; path=/';
    }

    public static get(name): string | null {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');

        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }

        return null;
    }

    public static delete(name, domain): void {
        Cookie.put(name, '', domain, -1);
    }
}
