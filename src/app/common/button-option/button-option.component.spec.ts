import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonOptionComponent } from './button-option.component';

describe('ButtonOptionComponent', () => {
  let component: ButtonOptionComponent;
  let fixture: ComponentFixture<ButtonOptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ButtonOptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
