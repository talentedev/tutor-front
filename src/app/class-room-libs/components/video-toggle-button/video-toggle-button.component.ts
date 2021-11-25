import {
    Component,
    HostBinding,
    Input,
    OnInit
} from '@angular/core';

@Component({
    selector: 'learnt-video-button',
    templateUrl: './video-toggle-button.component.html',
    styleUrls: ['./video-toggle-button.component.scss']
})
export class VideoButtonComponent implements OnInit {

    @Input()
    @HostBinding('class.active')
    active: boolean;

    @Input()
    icon: string;

    constructor() { }

    ngOnInit() {}
}
