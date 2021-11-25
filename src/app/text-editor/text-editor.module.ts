import {NgModule, ComponentFactoryResolver, Injector, ComponentFactory} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TextEditorComponent} from './text-editor/text-editor.component';
import {VCRNgModule} from '../class-room/class-room.module';

@NgModule({
    imports: [CommonModule],
    entryComponents: [TextEditorComponent],
    declarations: [TextEditorComponent]
})
export class TextEditorModule implements VCRNgModule {

    private cmpFactory: ComponentFactory<any>;

    constructor(private componentFactory: ComponentFactoryResolver) {
    }

    public getVCREntryComponentFactory(): ComponentFactory<any> {
        if (this.cmpFactory !== undefined) {
            return this.cmpFactory;
        }

        this.cmpFactory = this.componentFactory.resolveComponentFactory(TextEditorComponent);
        return this.cmpFactory;
    }
}
