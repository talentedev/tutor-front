import {Component, HostBinding, Input, OnInit} from '@angular/core';

@Component({
    selector: 'learnt-spinner',
    template: '',
    styles: [`
        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        :host {
            position: relative;
            box-sizing: border-box;
            display: inline-block;
            padding: 0;
            border-radius: 100%;
            border-style: solid;
            animation: spin 0.8s linear infinite;
        }

        :host .margins {
            margin: 0 10px;
        }
    `]
})
export class SpinnerComponent implements OnInit {

    @Input()
    @HostBinding('style.width.px')
    @HostBinding('style.height.px')
    size = 25;

    @Input()
    @HostBinding('style.borderWidth.px')
    thickness = 2;

    @Input()
    @HostBinding('style.borderTopColor')
    color = '#F37073';

    @Input()
    opacity = '.1';

    @HostBinding('style.borderBottomColor')
    @HostBinding('style.borderLeftColor')
    @HostBinding('style.borderRightColor')
    secondColor = '';

    ngOnInit(): void {
        const c = this.hexToRgb(this.color);
        this.secondColor = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', ' + this.opacity + ')';
    }

    private hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}
