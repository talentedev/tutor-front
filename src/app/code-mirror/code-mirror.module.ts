import {CommonComponentsModule} from '../common/common-components.module';
import {NgModule, Injector, ComponentFactory, ComponentFactoryResolver} from '@angular/core';
import {CommonModule} from '@angular/common';
import {VcrCodeMirrorComponent} from './vcr-code-mirror/vcr-code-mirror.component';
import {MatIconModule} from '@angular/material/icon';
import {VCRNgModule} from '../class-room/class-room.module';

@NgModule({
    imports: [
        CommonModule,
        MatIconModule,
        CommonComponentsModule
    ],
    entryComponents: [VcrCodeMirrorComponent],
    exports: [VcrCodeMirrorComponent],
    declarations: [VcrCodeMirrorComponent]
})
export class CodeMirrorModule implements VCRNgModule {

    private cmpFactory: ComponentFactory<any>;

    constructor(private componentFactory: ComponentFactoryResolver) {
    }

    public getVCREntryComponentFactory(): ComponentFactory<any> {
        if (this.cmpFactory !== undefined) {
            return this.cmpFactory;
        }

        this.cmpFactory = this.componentFactory.resolveComponentFactory(VcrCodeMirrorComponent);
        return this.cmpFactory;
    }
}
