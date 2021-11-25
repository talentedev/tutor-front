import {SessionHistoryAction} from './history';
import {MicroEvents} from '../../lib/core/common/events';
import {fabric} from 'fabric';
import {SessionHistory} from '../core/history';
import {saveAs} from 'file-saver';
import {BehaviorSubject, Observable} from 'rxjs';
import { WhiteboardTab } from '../whiteboard-tabs/whiteboard-tabs.component';

interface FreeDrawingBrush extends fabric.FreeDrawingBrush {
    strokeDashArray: number[];
}

const ObjectId = (m = Math, d = Date, h = 16, s = s => m.floor(s).toString(h)) =>
    s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h))

export type ObjectRef = { id: string } & fabric.Object

export type DrawMode = 'free' | 'circle' | 'line' | 'rectangle' | 'square' | 'triangle' | 'right-triangle';

export class Session extends MicroEvents implements WhiteboardTab {

    public id: string;

    private raw: any;

    private canvasEl: HTMLCanvasElement;

    private canvas: fabric.Canvas;

    private drawingMode: DrawMode;

    private drawingElement: any;

    private mouseDownEvent: any;

    private writeMode: boolean;

    private currentEditingText: fabric.IText;

    private fillColor = 'rgba(0, 0, 0, 0)'/*'#f3f3f3'*/;

    private lineColor = 'black';

    private strokeDashArray = [];

    private strokeWidth = 2;

    private fontSize = 14;
    private fontColor = '#000000';

    private fontFamily = 'Times New Roman';
    private fontFamilies: string[] = ['Pacifico', 'VT323', 'Quicksand', 'Inconsolata'];
    private fontStyleBold = false;
    private fontStyleItalic = false;
    private fontStyleUnderline = false;

    private _clipboard = null;
    private _clipboardCut: boolean;

    private _active: boolean;

    public readonly history: SessionHistory;

    private _change: BehaviorSubject<string> = new BehaviorSubject<string>('');
    public readonly change: Observable<string> = this._change.asObservable();

    private changesSent = false;

    /**
     * Flag indicating objects are added internally and not by user interactions
     */
    private loadedExternally = false;

    /**
     * Flag used to skip remove event on update
     */
    private skipRemoveEvent = false

    /**
     * Flag used to skip remove event on update
     */
    private skipModifyEvent = false

    public awake: boolean;

    constructor(public name: any, id?:string) {

        super();

        this.id = id ? id : ObjectId()
        this.history = new SessionHistory(this);
        this.canvasEl = document.createElement('canvas');
        this.canvas = new fabric.Canvas(this.canvasEl, {selection: true, isDrawingMode: true});
    }

    getName(): string {
        return this.name;
    }

    setName(name: string) {
        this.name = name;
    }

    isActive(): boolean {
        return this._active;
    }

    setActive(active: boolean) {
        this._active = active;
        if (active) {
            if (!this.awake) {
                this.wakeup();
            }
        } else {
            if (this.awake) {
                this.sleep();
            }
        }
    }

    resize(width: number, height: number): void {
        this.canvas.setWidth(width);
        this.canvas.setHeight(height);
    }

    setEvents(on: boolean): void {

        const events = {
            'mouse:down': this.onMouseDown,
            'mouse:up': this.onMouseUp,
            'object:added': this.onObjectAdded,
            'object:modified': this.onObjectModified,
            'object:removed': this.onObjectRemoved,
            'object:selected': this.onObjectSelected,
        }

        for (const event in events) {
            this.canvas[on ? 'on' : 'off'](event, events[event]);
        }
    }

    onObjectSelected(event: fabric.IEvent) {
        console.log(event.target['id'])
    }

    wakeup() {
        this.awake = true;
        this.setEvents(true);
    }

    sleep() {
        this.setEvents(false);
        this.awake = false;
    }

    public clearCanvas(): void {
        this.canvas.clear();
        // this.history.clearEvents();
        // this.history.clear();
    }

    destroy() {
        this.canvas.clear();
    }

    sendChanges(): void {
        if (this.changesSent) {
            setTimeout(() => this.sendChanges(), 100);
            return;
        }
        this.changesSent = true;
        this._change.next(JSON.stringify(this.canvas.toJSON()));
        setTimeout(() => this.changesSent = false, 200);
    }

    addObject(obj: any, id?:string) {
        //TODO: Use this.canvas.loadFromJSON?
        const idobj = obj['id'];
        this.enliven(obj).then(obj => {
            this.loadedExternally = true;
            obj['id'] = id ? id : idobj;
            this.canvas.add(obj);
            this.loadedExternally = false;
        })
    }

    render() {
        this.canvas.renderAll();
    }

    private enliven(obj: any): Promise<fabric.Object> {
        return new Promise((resolve, reject) => {
            fabric.util.enlivenObjects([obj], (objects) => {
                resolve(objects[0]);
            }, "")
        })
    }

    removeObject(id: string) {
        this.canvas.getObjects().forEach((o: ObjectRef) => {
            if (o.id == id) {
                this.canvas.remove(o);
                return;
            }
        })
    }

    modifyObject(obj: ObjectRef) {
        this.canvas.getObjects().forEach((o: ObjectRef) => {
            if (o.id == obj.id) {
                this.skipRemoveEvent = true;
                this.canvas.remove(o);
                this.skipRemoveEvent = false;
                this.addObject(obj);
                this.canvas.discardActiveObject()
                return;
            }
        })
    }

    onObjectModified = (event: any) => {
        if (this.loadedExternally) {
            return;
        }
        this.sendChanges();
        if (!this.skipModifyEvent && !event.isClick) {
            const objects = this.canvas.getActiveObjects();
            objects ? objects.forEach(obj => {
                setTimeout(() => this.emit('object:modified', obj), 10);
            }) : this.emit('object:modified', event.target)
            this.canvas.requestRenderAll()
            this.canvas.discardActiveObject()
        }
    }

    onObjectAdded = (event: fabric.IEvent) => {
        if (this.loadedExternally) {
            return;
        }
        this.sendChanges();
        if (!event.target['id']) {
            event.target['id'] = ObjectId()
        }
        if (event.target.type === 'path') {
            this.emit('object:added', event.target)
        }
        this.history.push(SessionHistoryAction.ADD, event.target);
    }

    onObjectRemoved = (event: fabric.IEvent) => {
        if (!this.skipRemoveEvent) {
            this.emit('object:removed', event.target)
        }
    }

    cut() {
        const current = this.canvas.getActiveObject();

        if (!current) {
            return;
        }

        current.clone((cloned) => {
            this._clipboard = cloned;
            this.canvas.remove(current);
        });
    }

    copy() {
        const current = this.canvas.getActiveObject();

        if (!current) {
            return;
        }

        current.clone((cloned) => {
            this._clipboard = cloned;
        });
    }

    paste() {
        if (this._clipboard) {
            this._clipboard.clone((clonedObj) => {
                this.canvas.discardActiveObject();
                clonedObj.set({
                    left: clonedObj.left + 10,
                    top: clonedObj.top + 10,
                    evented: true,
                });
                if (clonedObj.type === 'activeSelection') {
                    // active selection needs a reference to the canvas.
                    clonedObj.canvas = this.canvas;
                    clonedObj.forEachObject((obj) => {
                        this.canvas.add(obj);
                    });
                    // this should solve the unselectability
                    clonedObj.setCoords();
                } else {
                    this.canvas.add(clonedObj);
                }
                this.canvas.setActiveObject(clonedObj);
                this.canvas.renderAll();
                this._clipboard = null;
            });
        }
    }

    set selectable(state: boolean) {
        this.canvas.discardActiveObject();
        this.canvas.selection = state;
        this.canvas.forEachObject(function(o) {
            o.selectable = state;
            o.evented = state;
        });
    }

    public setDrawing(state: boolean, mode: DrawMode = 'free'): void {
        this.drawingMode = mode;
        this.selectable = !state;
        this.canvas.isDrawingMode = (state && mode === 'free');
        this.canvas.setCursor('crosshair');
        this.canvas.renderAll();
    }

    public setFillColor(color: string): void {
        this.fillColor = color;
    }

    public setLineColor(color: string): void {
        this.lineColor = color;
        this.canvas.freeDrawingBrush.color = this.lineColor;
    }

    public setStrokeDashArray(strokeDashArray: number[]): void {
        this.strokeDashArray = strokeDashArray;
        (this.canvas.freeDrawingBrush as FreeDrawingBrush).strokeDashArray = strokeDashArray;
    }

    public setStrokeWidth(width: number): void {
        this.strokeWidth = width;
        this.canvas.freeDrawingBrush.width = this.strokeWidth;
    }

    public setFontFamily(family: string): void {
        this.fontFamily = family;

        const obj = this.canvas.getActiveObject() as fabric.IText;
        if (obj === undefined || obj === null) {
            return;
        }

        if (this.fontFamilies.indexOf(family) === -1) {
            return;
        }

        obj.set('fontFamily', family);
        this.canvas.renderAll();
    }

    public setFontSize(size: number): void {
        this.fontSize = size;

        const obj = this.canvas.getActiveObject() as fabric.IText;
        if (obj === undefined || obj === null) {
            return;
        }

        obj.set('fontSize', size);
        this.canvas.renderAll();
    }

    public setFontColor(color: string): void {
        this.fontColor = color;

        const obj = this.canvas.getActiveObject();
        if (obj === undefined || obj === null) {
            return;
        }

        obj.setColor(color);
        this.canvas.renderAll();
    }

    public setFontStyle(style: string, state: boolean = true): void {

        switch (style) {
            case 'bold':
                this.fontStyleBold = state;
                break;
            case 'italic':
                this.fontStyleItalic = state;
                break;
            case 'underline':
                this.fontStyleUnderline = state;
                break;
        }

        const obj = this.canvas.getActiveObject() as fabric.IText;

        if (obj === undefined || obj === null) {
            return;
        }

        switch (style) {
            case 'bold':
                obj.set('fontWeight', state ? 'bold' : 'normal');
                break;
            case 'italic':
                obj.set('fontStyle', state ? 'italic' : 'normal');
                break;
            case 'underline':
                obj.set('underline', state);
                break;
        }

        this.canvas.requestRenderAll();
    }

    public deleteSelectedObjects(): void {
        if (this.writeMode) {
            return;
        }

        const objects = this.canvas.getActiveObjects();
        objects.forEach(o => this.canvas.remove(o))
        // this.history.push(SessionHistoryAction.REMOVE, objects);
        this.canvas.requestRenderAll()
        this.canvas.discardActiveObject()
    }

    selectAll() {

        this.canvas.discardActiveObject();

        const objects: fabric.Object[] = this.canvas.getObjects().map((object: any) => object.set('active', true));

        if (objects.length === 1) {
            this.canvas.setActiveObject(objects[0]);
        } else if (objects.length > 1) {
            const group: fabric.Group = new fabric.Group(objects.reverse(), {canvas: this.canvas} as any);
            group.addWithUpdate(null);
            this.canvas.trigger('selection:created', {target: group});
        }

        this.canvas.renderAll();
    }

    private newWriteMode(point: { x: number, y: number }, event: any) {
        this.currentEditingText = new fabric.IText('', {
            left: point.x, top: point.y - 20,
            fontFamily: this.fontFamily,
            fill: this.fontColor,
            fontWeight: this.fontStyleBold ? 'bold' : 'normal',
            fontStyle: this.fontStyleItalic ? 'italic' : 'normal',
            underline: this.fontStyleUnderline,
        });

        this.canvas.add(this.currentEditingText);
        this.canvas.setActiveObject(this.currentEditingText);
        this.emit('object:added', this.currentEditingText)
        this.currentEditingText.enterEditing();

        setTimeout(() => {
            if (this.currentEditingText.hiddenTextarea !== undefined) {
                this.currentEditingText.hiddenTextarea.focus();
            }
        });

        this.currentEditingText.on('editing:exited', () => {
            this.skipModifyEvent = true
            this.currentEditingText = undefined;
            this.setWriteMode(false);
            this.skipModifyEvent = false;
            this.canvas.renderAll();
        });

        this.currentEditingText.on('editing:entered', () => {
            this.emit('text:editing:entered', this, this.currentEditingText);
        });

        event.e.stopPropagation();
        event.e.preventDefault();

        this.canvas.renderAll();
    }

    public setWriteMode(state: boolean = true): void {

        this.setDrawing(false);

        this.selectable = !state;

        if (!state && this.writeMode === true) {
            if (this.currentEditingText) {
                this.currentEditingText.exitEditing();
                this.emit('object:added', this.currentEditingText);
                this.currentEditingText = null;
            }

            this.writeMode = false;

            this.emit('text:editing:exited', this);
            this.sendChanges();

            this.canvas.renderAll();

            return
        }

        if (state && !this.writeMode) {
            this.writeMode = true;
            this.canvas.setCursor('text');
        }
    }

    private mergeOptions(point: { x: number, y: number }, actual: any = {}) {
        const options = {
            left: point.x,
            top: point.y,
            originX: 'left',
            originY: 'top',
            fill: this.fillColor,
            stroke: this.lineColor,
            strokeWidth: this.strokeWidth,
            strokeDashArray: this.strokeDashArray,
            hasControls: true,
            hasBorders: true,
            selectable: true,
        };

        return {...actual, ...options};
    }

    private onMouseDown = (event: any) => {

        this.mouseDownEvent = event;

        const point = this.canvas.getPointer(event.e);

        if (this.writeMode && !this.currentEditingText) {
            return this.newWriteMode(point, event);
        }

        if(this.drawingMode === 'free') {
            this.mouseDownEvent = null;
            return;
        }

        this.canvas.on('mouse:move', this.onMouseMove);
        this.canvas.on('mouse:up', this.onMouseUpDrawing);

        switch (this.drawingMode) {
            case 'line': {
                const options = this.mergeOptions(point);
                this.drawingElement = new fabric.Line([point.x, point.y, point.x, point.y], options);
                break;
            }
            case 'circle':
                this.drawingElement = new fabric.Circle(this.mergeOptions(point, {radius: 10}));
                break;
            case 'square':
                this.drawingElement = new fabric.Rect(this.mergeOptions(point));
                break;
            case 'rectangle':
                this.drawingElement = new fabric.Rect(this.mergeOptions(point));
                break;
            case 'triangle':
                this.drawingElement = new fabric.Triangle(this.mergeOptions(point));
                break;
            case 'right-triangle':
                this.drawingElement = new fabric.Triangle(this.mergeOptions(point, {skewY: 45, angle: -45}));
                break;
        }

        if (this.drawingElement) {
            this.canvas.add(this.drawingElement);
        }
    }

    private onMouseMove = (event: any) => {
        const mouseDownEventPointer = this.mouseDownEvent.pointer;
        const mouseMoveEventPointer = event.pointer;

        if (!this.drawingElement) {
            return;
        }

        const maxX = Math.max(mouseDownEventPointer.x, mouseMoveEventPointer.x);
        const minX = Math.min(mouseDownEventPointer.x, mouseMoveEventPointer.x);

        const maxY = Math.max(mouseDownEventPointer.y, mouseMoveEventPointer.y);
        const minY = Math.min(mouseDownEventPointer.y, mouseMoveEventPointer.y);

        const width = maxX - minX, height = maxY - minY;

        switch (this.drawingMode) {
            case 'line':
                this.drawingElement.set({x2: mouseMoveEventPointer.x, y2: mouseMoveEventPointer.y});
                break;
            case 'circle':
                const circleWidth = Math.pow(width, 2);
                const circleHeight = Math.pow(height, 2);
                const radius: number = Math.sqrt(circleWidth + circleHeight) / 2;
                this.drawingElement.set({radius});
                break;
            case 'square':
                this.drawingElement.set({width: width, height: width});
                break;
            case 'rectangle':
                this.drawingElement.set({width, height});
                break;
            case 'triangle':
            case 'right-triangle':
                this.drawingElement.set({width, height});
                break;
        }

        this.canvas.requestRenderAll();
    }

    private onMouseUpDrawing = (event: any) => {

        this.canvas.discardActiveObject()

        if (this.drawingElement) {
            this.emit('drawn', this, this.drawingElement);
            this.emit('object:added', this.drawingElement)
        }

        this.mouseDownEvent = null;
        this.drawingElement = null;

        this.canvas.off('mouse:move', this.onMouseMove);
        this.canvas.off('mouse:up', this.onMouseUpDrawing);

        this.sendChanges();
        this.canvas.renderAll();
    }

    private onMouseUp = (event: any) => {
        if (this.hasSelectedObjects) {
            // this.history.push('select', event.target);
        }
    }

    get size(): number {
        return typeof(this.canvas) !== 'undefined' ? this.canvas.size() : 0;
    }

    get hasSelectedObjects() {
        return this.canvas && this.canvas.getActiveObject();
    }

    get elements(): any[] {
        return [
            this.canvas.getElement(),
            this.canvas.getSelectionElement(),
        ];
    }

    get isWriteMode() {
        return this.writeMode;
    }

    get clipboard() {
        return this._clipboard;
    }

    saveAs(name: string) {
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
        this.canvasEl.toBlob(b => saveAs(b, name));
    }

    getCanvas(): fabric.Canvas {
        return this.canvas;
    }

    toString(): string {
        return `[SESSION ${JSON.stringify(this.name)}]`;
    }
}

