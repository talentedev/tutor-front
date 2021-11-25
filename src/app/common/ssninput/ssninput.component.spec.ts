import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SSNInputComponent } from './ssninput.component';

describe('SSNInputComponent', () => {
  let component: SSNInputComponent;
  let fixture: ComponentFixture<SSNInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SSNInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SSNInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
