import {NgModule, ComponentFactoryResolver, Injector, ComponentFactory} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PreviewComponent} from './preview/preview.component';
import {VCRNgModule} from '../class-room/class-room.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule
    ],
    entryComponents: [
        PreviewComponent
    ],
    declarations: [
        PreviewComponent
    ]
})
export class ScreenShareModule implements VCRNgModule {

    private cmpFactory: ComponentFactory<any>;

    constructor(private componentFactory: ComponentFactoryResolver) {
    }

    public getVCREntryComponentFactory(): ComponentFactory<any> {
        if (this.cmpFactory !== undefined) {
            return this.cmpFactory;
        }

        this.cmpFactory = this.componentFactory.resolveComponentFactory(PreviewComponent);
        return this.cmpFactory;
    }
}
