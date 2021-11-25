
import { MicroEvents } from 'app/lib/core/common/events';
import { PanelNavigation } from './panels';
import { ViewChild, ViewContainerRef } from '@angular/core';

export class PanelData {

    constructor(private data?: {[key: string]: any}) {}

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
        return typeof(this.data[key]) != 'undefined';
    }

    /**
     * Set custom key value
     * @param key string
     * @param value string
     */
    set(key: string, value: any) {
        
        if (!this.data) {
            this.data = {};
        }

        this.data[key] = value;
    }

    /**
     * Merge data from another paneldata
     */
    merge(from: PanelData): PanelData {

        from.each((key: string, value: string) => {
            this.data[key] = value;
        })

        return new PanelData(this.data);
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
    apply(ref: any, ...keys: string[]) {

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

            ref[key] = this.get(key);
        }
    }
}

export abstract class SidePanel extends MicroEvents {

    @ViewChild('panel', {read: ViewContainerRef})
    public vcr: ViewContainerRef;

    /**
     * Send event to the panel 
     * service to close this panel
     */
    close() {
        this.emit('close');
    }

    /**
     * Navigate to another panel
     * @param to Panel to open
     */
    navigate(to: PanelNavigation, data?: PanelData) {
        this.close();
        this.emit('navigate', to, data);
    }

    onData(data: PanelData): void {
        if (data) {
            throw new Error(`Panel received data but no implementation in the panel of onData`);
        }
    }

    setVisibility(visible: boolean) {
        setTimeout(() => {
            this.vcr.element.nativeElement.style['transform'] = visible ? 'translateX(0)' : 'translateX(470px)';
        })
    }
}