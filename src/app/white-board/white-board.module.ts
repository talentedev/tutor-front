import { CommonModule } from '@angular/common';
import { ComponentFactory, ComponentFactoryResolver, CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { VCRNgModule } from '../class-room/class-room.module';
import { WhiteboardComponent } from './white-board/white-board.component';
import { WhiteboardColorPickerMatrixComponent } from './whiteboard-color-picker-matrix/whiteboard-color-picker-matrix.component';
import { WhiteboardTabsComponent } from './whiteboard-tabs/whiteboard-tabs.component';
import { WhiteboardToolbarButtonComponent } from './whiteboard-toolbar-button/whiteboard-toolbar-button.component';
import { WhiteboardToolbarFontButtonComponent } from './whiteboard-toolbar-font-button/whiteboard-toolbar-font-button.component';

@NgModule({
    imports: [
        CommonModule,
        MatIconModule,
    ],
    entryComponents: [
        WhiteboardComponent,
    ],
    exports: [
        WhiteboardComponent,
    ],
    declarations: [
        WhiteboardComponent,
        WhiteboardTabsComponent,
        WhiteboardToolbarButtonComponent,
        WhiteboardColorPickerMatrixComponent,
        WhiteboardToolbarFontButtonComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA,
        CUSTOM_ELEMENTS_SCHEMA
    ],
})
export class WhiteBoardModule implements VCRNgModule {

    private cmpFactory: ComponentFactory<any>;

    constructor(private componentFactory: ComponentFactoryResolver) {
    }

    public getVCREntryComponentFactory(): ComponentFactory<any> {
        if (this.cmpFactory !== undefined) {
            return this.cmpFactory;
        }

        this.cmpFactory = this.componentFactory.resolveComponentFactory(WhiteboardComponent);
        return this.cmpFactory;
    }
}
