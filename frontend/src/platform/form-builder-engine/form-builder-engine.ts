import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiServices } from '../../services/api-services/api-services';
import { PopUpDialogBox, PopUpDialogConfig } from '../../reusable-components/pop-up-dialog-box/pop-up-dialog-box';

/* =========================================================
   FIELD TYPES
   ========================================================= */

type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'button'
  | 'file'
  | 'table';

/* =========================================================
   FORM BUILDER MODE
   ========================================================= */

type FormBuilderMode =
  | 'create'
  | 'edit'
  | 'delete';

/* =========================================================
   BEHAVIOR KEY
   ========================================================= */

type BehaviorKey =
  | 'required'
  | 'hidden'
  | 'readOnly'
  | 'disabled';

/* =========================================================
   BEHAVIOR
   ========================================================= */

interface FieldBehavior {
  key: BehaviorKey;
  label: string;
}

/* =========================================================
   OPTION
   ========================================================= */

interface FormOption {
  label: string;
  value: string;
}

/* =========================================================
   FIELD VALIDATION
   ========================================================= */

interface FieldValidation {
  required: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  pattern?: string;
}

/* =========================================================
   FORM SECTION
   ========================================================= */

interface FormSection {
  id: string;
  name: string;
  label: string;
  description: string;
}

/* =========================================================
   FORM FIELD
   ========================================================= */

interface FormField {
  name: string;
  label: string;
  type: FieldType;

  hidden: boolean;
  readOnly: boolean;
  disabled: boolean;

  placeholder: string;

  defaultValue:
    | string
    | number
    | boolean
    | null;

  validation: FieldValidation;
  options: FormOption[];

  dateFormat?: string;

  /*
   * null = field is not inside a section
   * value = field belongs to that section
   */
  sectionId: string | null;

  table?: DynamicTableConfig;
}

/* =========================================================
   DYNAMIC TABLE COLUMN
   ========================================================= */

interface DynamicTableColumn extends FormField {}

/* =========================================================
   DYNAMIC TABLE CONFIGURATION
   ========================================================= */

interface DynamicTableConfig {
  name: string;
  description: string;
  columns: DynamicTableColumn[];
}

/* =========================================================
   FORM CONFIGURATION
   ========================================================= */

interface FormConfig {
  id: string;
  name: string;

  /*
   * Sections are optional.
   */
  sections: FormSection[];

  /*
   * Fields remain in one collection.
   */
  fields: FormField[];
}

/* =========================================================
   COMPONENT
   ========================================================= */

@Component({
  selector: 'app-form-builder-engine',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PopUpDialogBox
],
  templateUrl: './form-builder-engine.html',
  styleUrl: './form-builder-engine.css'
})
export class FormBuilderEngine {

  

  /* =======================================================
     FORM MODEL
     ======================================================= */

  form: FormConfig = {
    id: '',
    name: '',
    sections: [],
    fields: []
  };

  /* =======================================================
     FORM BUILDER MODE
     ======================================================= */

  mode: FormBuilderMode = 'create';

  /* =======================================================
     ACCORDION STATE
     ======================================================= */

  openFieldIndex: number | null = null;

  /* =======================================================
     SECTION STATE
     ======================================================= */

  openSectionIndex: number | null = null;

  /* =======================================================
     FIELD BEHAVIORS
     ======================================================= */

  behaviors: FieldBehavior[] = [
    {
      key: 'required',
      label: 'Required'
    },
    {
      key: 'hidden',
      label: 'Hidden'
    },
    {
      key: 'readOnly',
      label: 'Read Only'
    },
    {
      key: 'disabled',
      label: 'Disabled'
    }
  ];

  /* =======================================================
     CONSTRUCTOR
     ======================================================= */

  constructor(private api: ApiServices) {}


  /* =======================================================
     DEFAULT VALIDATION
     ======================================================= */

  private createDefaultValidation(): FieldValidation {
    return {
      required: false,
      minLength: null,
      maxLength: null,
      min: null,
      max: null,
      pattern: ''
    };
  }

  /* =======================================================
     CREATE NORMAL FIELD
     ======================================================= */

  private createField(): FormField {
    return {
      name: '',
      label: '',
      type: 'text',

      hidden: false,
      readOnly: false,
      disabled: false,

      placeholder: '',
      defaultValue: '',

      validation: this.createDefaultValidation(),
      options: [],

      dateFormat: 'MM/DD/YYYY',

      sectionId: null
    };
  }

  /* =======================================================
     CREATE SECTION
     ======================================================= */

  private createSection(): FormSection {
    return {
      id: this.generateId('section'),
      name: '',
      label: '',
      description: ''
    };
  }

  /* =======================================================
     GENERATE ID
     ======================================================= */

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  }

  /* =======================================================
     ADD SECTION
     ======================================================= */

  addSection(): void {
    const section = this.createSection();

    this.form.sections.push(section);

    this.openSectionIndex =
      this.form.sections.length - 1;
  }

  /* =======================================================
     REMOVE SECTION
     ======================================================= */

  removeSection(index: number): void {
    const section = this.form.sections[index];

    if (!section) {
      return;
    }

    /*
     * Fields belonging to the removed section
     * become unsectioned fields.
     */
    this.form.fields.forEach(field => {
      if (field.sectionId === section.id) {
        field.sectionId = null;
      }
    });

    this.form.sections.splice(index, 1);

    if (this.form.sections.length === 0) {
      this.openSectionIndex = null;
      return;
    }

    if (this.openSectionIndex === index) {
      this.openSectionIndex = Math.min(
        index,
        this.form.sections.length - 1
      );
    }

    else if (
      this.openSectionIndex !== null &&
      this.openSectionIndex > index
    ) {
      this.openSectionIndex--;
    }
  }

  /* =======================================================
     TOGGLE SECTION
     ======================================================= */

  toggleSection(index: number): void {
    this.openSectionIndex =
      this.openSectionIndex === index
        ? null
        : index;
  }

  /* =======================================================
     ADD NORMAL FIELD
     ======================================================= */

  addField(sectionId: string | null = null): void {
    const field = this.createField();

    field.sectionId = sectionId;

    this.form.fields.push(field);

    this.openFieldIndex =
      this.form.fields.length - 1;
  }

  /* =======================================================
     REMOVE FIELD
     ======================================================= */

  removeField(index: number): void {
    this.form.fields.splice(index, 1);

    if (this.form.fields.length === 0) {
      this.openFieldIndex = null;
      return;
    }

    if (this.openFieldIndex === index) {
      this.openFieldIndex = Math.min(
        index,
        this.form.fields.length - 1
      );
    }

    else if (
      this.openFieldIndex !== null &&
      this.openFieldIndex > index
    ) {
      this.openFieldIndex--;
    }
  }

  /* =======================================================
     TOGGLE FIELD ACCORDION
     ======================================================= */

  toggleField(index: number): void {
    this.openFieldIndex =
      this.openFieldIndex === index
        ? null
        : index;
  }

  /* =======================================================
     GET SECTION FIELDS
     ======================================================= */

  getSectionFields(sectionId: string): FormField[] {
    return this.form.fields.filter(
      field => field.sectionId === sectionId
    );
  }

  /* =======================================================
     GET UNSECTIONED FIELDS
     ======================================================= */

  getUnsectionedFields(): FormField[] {
    return this.form.fields.filter(
      field => !field.sectionId
    );
  }

  /* =======================================================
     GET ORIGINAL FIELD INDEX
     ======================================================= */

  getFieldIndex(field: FormField): number {
    return this.form.fields.indexOf(field);
  }

  /* =======================================================
     ADD OPTION
     ======================================================= */

  addOption(field: FormField): void {
    field.options.push({
      label: '',
      value: ''
    });
  }

  /* =======================================================
     REMOVE OPTION
     ======================================================= */

  removeOption(
    field: FormField,
    index: number
  ): void {
    field.options.splice(index, 1);
  }

  /* =======================================================
     ADD DYNAMIC TABLE
     ======================================================= */

  addTable(sectionId: string | null = null): void {
    const tableField: FormField = {
      name: '',
      label: '',
      type: 'table',

      hidden: false,
      readOnly: false,
      disabled: false,

      placeholder: '',
      defaultValue: null,

      validation: this.createDefaultValidation(),
      options: [],

      sectionId,

      table: {
        name: '',
        description: '',
        columns: []
      }
    };

    this.form.fields.push(tableField);

    this.openFieldIndex =
      this.form.fields.length - 1;
  }

  /* =======================================================
     ADD TABLE COLUMN
     ======================================================= */

  addTableColumn(field: FormField): void {
    if (field.type !== 'table') {
      return;
    }

    field.table ??= {
      name: '',
      description: '',
      columns: []
    };

    field.table.columns.push({
      name: '',
      label: '',
      type: 'text',

      hidden: false,
      readOnly: false,
      disabled: false,

      placeholder: '',
      defaultValue: '',

      validation: this.createDefaultValidation(),
      options: [],

      dateFormat: 'MM/DD/YYYY',

      sectionId: null
    });
  }

  /* =======================================================
     REMOVE TABLE COLUMN
     ======================================================= */

  removeTableColumn(
    field: FormField,
    columnIndex: number
  ): void {
    if (
      field.type !== 'table' ||
      !field.table
    ) {
      return;
    }

    field.table.columns.splice(
      columnIndex,
      1
    );
  }

  /* =======================================================
     ADD TABLE COLUMN OPTION
     ======================================================= */

  addTableColumnOption(
    column: DynamicTableColumn
  ): void {
    column.options.push({
      label: '',
      value: ''
    });
  }

  /* =======================================================
     REMOVE TABLE COLUMN OPTION
     ======================================================= */

  removeTableColumnOption(
    column: DynamicTableColumn,
    optionIndex: number
  ): void {
    column.options.splice(
      optionIndex,
      1
    );
  }

  /* =======================================================
     GET BEHAVIOR VALUE
     ======================================================= */

  getBehaviorValue(
    field: FormField,
    key: BehaviorKey
  ): boolean {

    switch (key) {

      case 'required':
        return field.validation.required;

      case 'hidden':
        return field.hidden;

      case 'readOnly':
        return field.readOnly;

      case 'disabled':
        return field.disabled;

      default:
        return false;
    }
  }

  /* =======================================================
     SET BEHAVIOR VALUE
     ======================================================= */

  setBehaviorValue(
    field: FormField,
    key: BehaviorKey,
    value: boolean
  ): void {

    switch (key) {

      case 'required':
        field.validation.required = value;
        break;

      case 'hidden':
        field.hidden = value;
        break;

      case 'readOnly':
        field.readOnly = value;
        break;

      case 'disabled':
        field.disabled = value;
        break;
    }
  }

  /* =======================================================
     SWITCH TO CREATE MODE
     ======================================================= */

  createMode(): void {
    this.mode = 'create';
    this.resetForm();
  }

  /* =======================================================
     SWITCH TO EDIT MODE
     ======================================================= */

  editMode(): void {
    this.mode = 'edit';
    this.form.id = '';
    this.openFieldIndex = null;
    this.openSectionIndex = null;
  }

  /* =======================================================
     SWITCH TO DELETE MODE
     ======================================================= */

  deleteMode(): void {
    this.mode = 'delete';
    this.form.id = '';
    this.openFieldIndex = null;
    this.openSectionIndex = null;
  }

  /* =======================================================
     FORM ID FOCUS OUT
     ======================================================= */

  onFormIdBlur(): void {
    if (!this.form.id.trim()) {
      return;
    }

    console.log(
      'Form ID entered:',
      this.form.id
    );
  }

 /* =======================================================
   KEYBOARD NAVIGATION
   ======================================================= */

handleKeyboardNavigation(
  event: KeyboardEvent
): void {

  const target = event.target as HTMLElement;

  const tagName = target.tagName.toLowerCase();

  /*
   * =====================================================
   * TEXTAREA
   * =====================================================
   *
   * Keep normal cursor/selection behavior.
   */
  if (tagName === 'textarea') {
    return;
  }

  /*
   * =====================================================
   * NUMBER / RANGE INPUT
   * =====================================================
   *
   * Keep their normal arrow-key behavior.
   */
  if (
    tagName === 'input' &&
    (
      (target as HTMLInputElement).type === 'number' ||
      (target as HTMLInputElement).type === 'range'
    )
  ) {

    /*
     * Left / Right can still move between controls.
     */
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight'
    ) {
      return;
    }
  }

  /*
   * =====================================================
   * ARROW NAVIGATION
   * =====================================================
   *
   * Up / Left  -> previous control
   * Down / Right -> next control
   *
   * NOTE:
   * For SELECT:
   *
   * Up / Down -> native dropdown selection
   * Left / Right -> move between controls
   */
  if (
    event.key === 'ArrowUp' ||
    event.key === 'ArrowDown' ||
    event.key === 'ArrowLeft' ||
    event.key === 'ArrowRight'
  ) {

    /*
     * SELECT:
     *
     * Up / Down should continue to work normally
     * for changing the selected option.
     *
     * Left / Right should navigate between controls.
     */
    if (
      tagName === 'select' &&
      (
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown'
      )
    ) {
      return;
    }

    event.preventDefault();

    const focusableElements =
      this.getFocusableElements();

    const currentIndex =
      focusableElements.indexOf(target);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number;

    /*
     * ===================================================
     * DOWN / RIGHT
     * ===================================================
     */
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowRight'
    ) {

      nextIndex =
        currentIndex + 1;

      if (
        nextIndex >=
        focusableElements.length
      ) {
        nextIndex = 0;
      }
    }

    /*
     * ===================================================
     * UP / LEFT
     * ===================================================
     */
    else {

      nextIndex =
        currentIndex - 1;

      if (nextIndex < 0) {
        nextIndex =
          focusableElements.length - 1;
      }
    }

    focusableElements[
      nextIndex
    ].focus();

    return;
  }

  /*
   * =====================================================
   * ENTER
   * =====================================================
   */

  if (event.key === 'Enter') {

    /*
     * FORM ID
     *
     * Keep existing HTML behavior:
     *
     * (keydown.enter)="onFormIdBlur()"
     */
    if (
      target.id === 'formId'
    ) {
      return;
    }

    /*
     * BUTTON
     *
     * Activate the button.
     */
    if (
      tagName === 'button'
    ) {

      event.preventDefault();

      (
        target as HTMLButtonElement
      ).click();

      return;
    }

    /*
     * RADIO BUTTON
     *
     * Enter selects the radio button.
     */
    if (
      tagName === 'input' &&
      (target as HTMLInputElement).type === 'radio'
    ) {

      event.preventDefault();

      (
        target as HTMLInputElement
      ).click();

      return;
    }

    /*
     * CHECKBOX
     *
     * Enter toggles the checkbox.
     */
    if (
      tagName === 'input' &&
      (target as HTMLInputElement).type === 'checkbox'
    ) {

      event.preventDefault();

      (
        target as HTMLInputElement
      ).click();

      return;
    }

    /*
     * SELECT
     *
     * The browser already handles the selected
     * option, so we don't interfere.
     */
    if (
      tagName === 'select'
    ) {
      return;
    }
  }
}

/* =======================================================
   GET FOCUSABLE ELEMENTS
   ======================================================= */

private getFocusableElements(): HTMLElement[] {

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(
      'input:not([disabled]), ' +
      'select:not([disabled]), ' +
      'textarea:not([disabled]), ' +
      'button:not([disabled])'
    )
  );

  return elements.filter(element => {

    const input =
      element as HTMLInputElement;

    /*
     * Ignore hidden inputs.
     */
    if (
      input.type === 'hidden'
    ) {
      return false;
    }

    /*
     * Ignore elements that aren't visible.
     */
    if (
      element.offsetParent === null
    ) {
      return false;
    }

    return true;
  });
}

  /* =======================================================
     POP UP DIALOG CONFIG
     ======================================================= */
 popupConfig: PopUpDialogConfig = {
  visible: false,
  title: 'Reset Form?',
  message:
    'All the data you have entered will be lost. Are you sure you want to reset the form?',
  confirmText: 'Yes, Reset',
  cancelText: 'Keep Editing'
};

requestReset(): void {
  this.popupConfig = {
    ...this.popupConfig,
    visible: true
  };
}

confirmReset(): void {
  this.popupConfig = {
    ...this.popupConfig,
    visible: false
  };

  this.resetForm();
}

cancelReset(): void {
  this.popupConfig = {
    ...this.popupConfig,
    visible: false
  };
}

  /* =======================================================
     RESET FORM BUILDER
     ======================================================= */

  resetForm(): void {
    this.form = {
      id: '',
      name: '',
      sections: [],
      fields: []
    };

    this.openFieldIndex = null;
    this.openSectionIndex = null;
  }

  /* =======================================================
     SAVE FORM
     ======================================================= */

  saveForm(): void {
    console.log(
      'Form configuration saved:',
      this.form
    );

    this.api.post('/forms', this.form).subscribe({
      next: (response) => {
        console.log(
          'Form submitted successfully:',
          response
        );
      },
      error: (error) => {
        console.error(
          'Form submission failed:',
          error
        );
      }
    });

    console.log(
      'Form JSON:',
      JSON.stringify(
        this.form,
        null,
        2
      )
    );
  }
}