import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormBuilderEngine } from './form-builder-engine';

describe('FormBuilderEngine', () => {
  let component: FormBuilderEngine;
  let fixture: ComponentFixture<FormBuilderEngine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormBuilderEngine],
    }).compileComponents();

    fixture = TestBed.createComponent(FormBuilderEngine);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
