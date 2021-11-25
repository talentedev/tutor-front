
let single: MicroEvents;

export class MicroEvents {
    private events: {[k:string]: ((...args: any[]) => any)[]};

    static single() {
        if (single) {
            return single;
        }
        single = new MicroEvents();
        return single;
    }

    on(event: string, func: (...args: any[]) => any) {
        this.events = this.events || {};
        this.events[event] = this.events[event]	|| [];
        this.events[event].push(func);
    }

    off(event: string, func: (...args: any[]) => any) {

        this.events = this.events || {};

        if (!Array.isArray(this.events[event])) {
            return;
        }

        this.events[event].splice(this.events[event].indexOf(func), 1);
    }

    emit(event: string, ...args: any[]) {
        this.events = this.events || {};
        if (!Array.isArray(this.events[event])) {
            return;
        }

        const item = this.events[event];
        const n = item.length;
        for (let i = 0; i < n; i++) {
            const fn = this.events[event][i]
            fn(...args);
        }
    }

    clearEvents() {
        this.events = {};
    }
}
