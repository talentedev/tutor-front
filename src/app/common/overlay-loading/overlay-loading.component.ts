import { Component, OnInit } from '@angular/core';

export class OverlayLoadingComponentPositionStrategy {

    /** Updates the position of the overlay element. */
    apply(element: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            console.log('Preloader:', element);
            resolve();
        });
    }

    /** Cleans up any DOM modifications made by the position strategy, if necessary. */
    dispose(): void {}
}

@Component({
  selector: 'learnt-overlay-loading',
  templateUrl: './overlay-loading.component.html',
  styleUrls: ['./overlay-loading.component.scss']
})
export class OverlayLoadingComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
