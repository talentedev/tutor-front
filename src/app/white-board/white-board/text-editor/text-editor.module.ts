import { NgModule, ComponentFactoryResolver, Injector, ComponentFactory } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextEditorComponent } from './text-editor/text-editor.component';

@NgModule({
    imports: [
        CommonModule
    ],
    entryComponents: [TextEditorComponent],
    declarations: [TextEditorComponent]
})
export class TextEditorModule {

    constructor(
        private componentFactory: ComponentFactoryResolver,
        private injector: Injector
    ) { }

    getVCREntryComponentFactory(): ComponentFactory<any> {
        return this.componentFactory.resolveComponentFactory(
            TextEditorComponent
        );
    }
}
