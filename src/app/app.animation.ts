import {animate, AnimationMetadata, state, style, transition, trigger} from '@angular/animations';

const dustAnimation = [
    state('*',
        style({
            opacity: 1,
            transform: 'translateX(0) translate3D(0,0,0)'
        })
    ),
    /*transition(':enter', [
      style({
        opacity: 0,
        transform: 'translateX(-50px)'
      }),
      animate('0.3s cubic-bezier(0, 0, 0, 1)')
    ]),*/
    transition(':leave', [
        animate('1s cubic-bezier(0, 0, 0, 1)', style({
            opacity: 0,
            filter: 'blur(100px)',
            transform: 'translateY(30px) translate3D(0,0,0)'
        }))
    ])
];

const slideDownAnimation = [
    state('*',
        style({
            opacity: 1,
            transform: 'translateX(0) translate3D(0,0,0)'
        })
    ),
    transition(':leave', [
        animate('0.1s ease-in', style({
            opacity: 0,
            transform: 'translateY(10px) translate3D(0,0,0)'
        }))
    ])
];

const noAnimation = [];

// Component transition animations
export const ROUTE_ANIMATION_DEFAULT: AnimationMetadata =
    trigger('routeAnimation', dustAnimation);


export const ROUTE_ANIMATION_DUST: AnimationMetadata =
    trigger('routeAnimation', dustAnimation);

export const ROUTE_ANIMATION_SLIDE_DOWN: AnimationMetadata =
    trigger('routeAnimation', slideDownAnimation);
