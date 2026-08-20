import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormRenderer } from './dynamic-form-renderer';

describe('DynamicFormRenderer', () => {
  let component: DynamicFormRenderer;
  let fixture: ComponentFixture<DynamicFormRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormRenderer],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormRenderer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
