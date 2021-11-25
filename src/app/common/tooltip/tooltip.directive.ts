import {
    ComponentFactoryResolver,
    Directive,
    ElementRef,
    Input,
    OnInit,
    Renderer2,
    ViewContainerRef
} from "@angular/core";
import { TooltipComponent } from "./tooltip.component";

@Directive({
    selector: '[tooltip]',
})
export class TooltipDirective implements OnInit {
    @Input() tooltip: string;

    constructor(private elRef: ElementRef, private renderer: Renderer2,
                private componentFactoryResolver: ComponentFactoryResolver,
                private viewContainerRef: ViewContainerRef) {
    }

    ngOnInit() {
        const tooltipComponentFactory = this.componentFactoryResolver.resolveComponentFactory(TooltipComponent);
        const tooltipComponent = this.viewContainerRef.createComponent(tooltipComponentFactory);
        tooltipComponent.instance.message = this.tooltip;
        // const tooltip = this.renderer.createElement('span');
        // tooltip.innerText = this.tooltip;
        // tooltip.classList = ['tooltip'];
        // tooltip.addEventListener('hover', () => this.renderer.addClass(tooltip, 'show'));
        // tooltip.style = `position: absolute; ` +
        //     `top: -2rem; ` +
        //     `background: #89c0ca; ` +
        //     `border-radius: 5px; ` +
        //     `padding: 0.125rem; ` +
        //     `color: white; ` +
        //     `width: 100px; ` +
        //     `left: calc(50% - 50px);`;
        // this.elRef.nativeElement.appendChild(tooltip);
        this.renderer.setStyle(this.elRef.nativeElement, 'position', 'relative');
    }
}
