/**
 * Regex validator for an email address.
 * @param email
 * @param simple
 */
export function IsEmail(email: string, simple: boolean = true): boolean {
    simple = simple || false;
    // tslint:disable-next-line:max-line-length
    const longRe = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const shortRe = /^\S+@\S+$/;
    if (simple === true) {
        return shortRe.test(email.toLowerCase());
    }
    return longRe.test(email.toLowerCase());
}

/**
 * Returns a number range in the form of an array.
 * Defaults to zero indexed.
 * @param {number} n
 * @param {boolean} zeroIndexed
 * @return {number[]}
 */
export function Range(n: number, zeroIndexed: boolean = true): number[] {
    return Array.apply(null, Array(n)).map((x, i) => zeroIndexed ? i : i + 1);
}

/**
 * Splits the provided array into a an array consisting of chunks of n items.
 * @param {any[]} a
 * @param {number} n
 * @return {any[]}
 */
export function Chunk(a: any[], n: number): any[] {
    return Range(Math.ceil(a.length / n)).map((x, i) => a.slice(i * n, i * n + n));
}

/**
 * Check two objects if they have the same items with the same values.
 * @param a
 * @param b
 * @return {boolean}
 * @constructor
 */
export function ObjectsAreEqual(a: any, b: any): boolean {
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);

    if (aProps.length !== bProps.length) {
        return false;
    }

    for (let i = 0; i < aProps.length; i++) {
        const propName = aProps[i];
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    return true;
}

/**
 * Capitalizes a string.
 * @param s
 */
export const Capitalize = (s: string) => {
    return s.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.substr(1)).join(' ');
};
