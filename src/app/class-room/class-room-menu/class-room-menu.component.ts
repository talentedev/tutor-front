import {deepClone} from '../../lib/core/utils';
import {Logger} from '../../lib/core/common/logger';
import {ChangeDetectorRef, Component} from '@angular/core';

@Component({
    selector: 'learnt-class-room-menu',
    templateUrl: './class-room-menu.component.html',
    styleUrls: ['./class-room-menu.component.scss']
})
export class ClassRoomMenuComponent {

    index = 0;

    rootDefault = [{
        name: 'file',
        label: 'File'
    }];

    root: any;

    constructor(private logger: Logger,
                private cdref: ChangeDetectorRef) {
        this.clear();
    }

    get(name: string): any {
        let names = [name];

        if (name.indexOf('.') !== -1) {
            names = name.split('.');
            names = names.map(x => x.trim());
        }

        let ref = null;
        let childrens = this.root;

        for (const step of names) {
            for (const item of childrens) {
                if (item.name === step) {
                    ref = item;
                    childrens = item.children;
                }
            }
        }

        return ref;
    }

    clear() {
        this.root = deepClone(this.rootDefault);
    }

    lock() {
        this.rootDefault = deepClone(this.root);
    }

    add(name: string, o: any) {

        o.index = this.index;
        o.name = name;

        this.index++;

        if (!o.label) {
            throw new Error('Menu item has no label');
        }

        if (o.parent) {

            const parent = this.get(o.parent);

            if (parent) {
                parent.children = parent.children || [];
                if (o.position) {
                    parent.children.splice(o.position, 0, o);
                } else {
                    parent.children.push(o);
                }
            } else {
                let label: string = o.parent || '';
                if (label.length > 1) {
                    label = label[0].toUpperCase() + label.substring(1, label.length);
                }
                this.add(o.parent, {label: label}).children = [
                    o,
                ];
            }

            return;
        }

        const node = this.get(name);

        if (node) {
            throw new Error(`Menu item with name "${name}" already exist in root`);
        }

        if (o.position) {
            this.root.splice(o.position, 0, o);
        } else {
            this.root.push(o);
        }

        this.logger.warn(`A root menu with key "${o.name}" already exists!`);

        return o;
    }

    init(data: any) {

        this.clear();

        for (const i in data) {
            const node = data[i];
            if (node.parent && !this.get(node.parent) && data[node.parent]) {
                this.add(node.parent, data[node.parent]);
                delete data[node.parent];
            }
        }

        for (const key in data) {
            this.add(key, data[key]);
        }
    }

    isDisabled(menu: any): boolean {

        if (typeof(menu.disabled) === 'function') {
            return menu.disabled();
        }

        if (typeof(menu.disabled) === 'boolean') {
            return menu.disabled;
        }

        return false;
    }

    getLabelOf(o: any) {

        if (!o) {
            return '';
        }

        if (typeof(o.label) === 'function') {
            return o.label();
        }

        return o.label;
    }

    onClick(event: MouseEvent, menu: any, parent: any) {
        if (menu.handler) {
            menu.handler(this);
        }
        delete parent.__hover;
    }

    onMouseOver(event: MouseEvent, menu) {
        menu.__hover = true;
        this.cdref.detectChanges();
    }

    onMouseOut(event: MouseEvent, menu) {
        delete menu.__hover;
        this.cdref.detectChanges();
    }
}
