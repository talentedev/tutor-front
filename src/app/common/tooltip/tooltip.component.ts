import { Component, Input } from "@angular/core";

@Component({
    selector: 'learnt-tooltip',
    template: `
        <span class="tooltip">{{ message }}</span>
    `,
    styleUrls: ['tooltip.component.scss'],
})
export class TooltipComponent {
    @Input() message: string;
}
