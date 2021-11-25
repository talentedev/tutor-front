import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTutorsComponent } from './admin-tutors.component';

describe('AdminTutorsComponent', () => {
  let component: AdminTutorsComponent;
  let fixture: ComponentFixture<AdminTutorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminTutorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminTutorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
