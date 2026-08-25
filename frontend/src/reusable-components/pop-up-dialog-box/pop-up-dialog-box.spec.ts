import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopUpDialogBox } from './pop-up-dialog-box';

describe('PopUpDialogBox', () => {
  let component: PopUpDialogBox;
  let fixture: ComponentFixture<PopUpDialogBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopUpDialogBox],
    }).compileComponents();

    fixture = TestBed.createComponent(PopUpDialogBox);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
