export class SocketEventData {

    constructor(private readonly data?: {[key: string]: any}) {}

    /**
     * Get specific data
     * @param key string
     */
    get<T>(key: string): T {
        return this.data[key]
    }

    /**
     * Verify if data key exists
     */
    has(key: string): boolean {

        if (key.indexOf('.') != -1) {

            var tmp = this.data;
            const path = key.split('.');

            for (key in path) {

                if (typeof(tmp[path[key]]) === 'undefined') {
                    return false;
                }

                tmp = tmp[path[key]]
            }

            return true;
        }

        return typeof(this.data[key]) != 'undefined';
    }

    /**
     * Function to traverse all data
     * @param func callback
     */
    each(func: (key: string, value: string) => void) {
        for (let key in this.data) {
            func(key, this.data[key])
        }
    }

    /**
     * Data key values are automatically
     * applied to the object, this is only
     * to validate if required fields are present
     */
    must(...keys: string[]) {

        for (const i in keys) {

            const key = keys[i];

            let optional: boolean

            if (key.indexOf('?') === keys.length - 1) {
                optional = true;
            }

            if (!optional && !this.has(key)) {
                throw new Error(
                    `Key '${key}' expected in data pannel`
                );
            }
        }
    }
}

export interface SocketEvent {
    type: string;
    time: number;
    data: SocketEventData;
}

export interface SocketServiceHandler {
    onSocketEvent(event: SocketEvent): void;
}
