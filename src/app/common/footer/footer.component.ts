import { Platform } from './../../services/platform';
import {
    AfterContentInit,
    AfterViewInit,
    Component,
    HostBinding,
    Input,
    OnInit,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {MediaChange, MediaObserver} from '@angular/flex-layout';
import {MatGridList} from '@angular/material/grid-list';

interface Link {
    title: string;
    href: string;
}

interface LinkSection {
    title: string;
    links: Link[];
}

@Component({
    selector: 'learnt-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss', './footer.component.mobile.scss']
})
export class FooterComponent implements OnInit, AfterContentInit {
    @Input() alwaysOpen: boolean;
    @ViewChild('footerMenuGrid') footerMenuGrid: MatGridList;
    @HostBinding('class.always-open') get isOpen() { return this.alwaysOpen; }

    private footerButtonOpenText = '';
    private gridBreakpoints = {
        xl: {cols: 6, rowHeight: '275px'},
        lg: {cols: 6, rowHeight: '275px'},
        md: {cols: 3, rowHeight: '240px'},
        sm: {cols: 2, rowHeight: '205px'},
        xs: {cols: 2, rowHeight: '205px'}
    };
    private layoutBreakpoints = [
        {size: 'xl', min: 1921, max: Infinity},
        {size: 'lg', min: 1281, max: 1920},
        {size: 'md', min: 961, max: 1280},
        {size: 'sm', min: 451, max: 960},
        {size: 'xs', min: 0, max: 450}
    ];
    private innerWidth: number;
    isFooterOpen = false;
    footerButtonText = '';
    gridColSize = 0;
    links: LinkSection[] = [];

    constructor(
        private platform: Platform,
        private observableMedia: MediaObserver
    ) {
        this.setLinks();
    }
    
    setLinks(): void {

        const rows = 6;

        const footerLinksSetting = this.platform.setting('footer_links');

        if (!footerLinksSetting) {
            return;
        }

        let setting = null;

        try {
            setting = JSON.parse(footerLinksSetting);
        } catch (e) {
            return;
        }

        let row = 0;
        let section: LinkSection;

        const fill = (ar: any[], title: string, fn: (d: any) => string) => {

            section = {
                title: title,
                links: []
            };

            for (let i = 0; i < ar.length; i++) {

                const subject = ar[i];

                if (row >= rows) {
                    this.links.push(section);
                    section = {
                        title: '',
                        links: []
                    };
                    row = 0;
                }

                section.links.push({
                    title: subject.name,
                    href: fn(subject),
                });

                row++;
            }

            if (row < rows) {
                this.links.push(section);
            }
        }

        fill(setting.subjects, 'Tutors by Subject', (d) => `/tutors/?subject=${d._id}`);
        fill(setting.locations, 'Tutors by Location', (d) => `/tutors?location=${d.lat},${d.lon}`);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.alwaysOpen) {
            this.isFooterOpen = !!changes.alwaysOpen.currentValue;
        }
    }
    
    ngOnInit(): void {
        // Set footer button text
        this.footerButtonText = this.footerButtonOpenText;
        
        this.isFooterOpen = !!this.alwaysOpen;

        // Set footer menu columns size
        this.innerWidth = window.innerWidth;
        const screenSize = this.layoutBreakpoints.filter(x => x.min <= this.innerWidth && x.max >= this.innerWidth);
        this.gridColSize = this.gridBreakpoints[screenSize[0].size].cols;
    }

    ngAfterContentInit(): void {
        this.observableMedia.media$.subscribe((change: MediaChange) => {
            if (!this.gridBreakpoints[change.mqAlias]) {
                change.mqAlias = 'xl';
            }
            // this.footerMenuGrid.cols = this.gridBreakpoints[change.mqAlias].cols;
            // this.footerMenuGrid.rowHeight = this.gridBreakpoints[change.mqAlias].rowHeight;
        });
    }

    public toggleFooterButton(event: any): void {
        this.isFooterOpen = !this.isFooterOpen;

        this.footerButtonText = this.footerButtonOpenText;
        if (this.isFooterOpen) {
            this.footerButtonText = 'Close';
        }
    }
}
