import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms';

import testJson from './test-json.json';


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
  | 'file'
  | 'table';


/* =========================================================
   DATE FORMAT
   ========================================================= */

type DateFormat =
  | 'dd/MM/yyyy'
  | 'MM/dd/yyyy'
  | 'yyyy/MM/dd'
  | 'dd-MM-yyyy'
  | 'MM-dd-yyyy'
  | 'yyyy-MM-dd';


/* =========================================================
   OPTION
   ========================================================= */

interface FormOption {
  label: string;
  value: string;
}


/* =========================================================
   VALIDATION
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
   TABLE COLUMN
   ========================================================= */

interface TableColumn {
  name: string;
  label: string;
  type: Exclude<FieldType, 'table'>;

  hidden: boolean;
  readOnly: boolean;
  disabled: boolean;

  placeholder: string;

  defaultValue: string | number | boolean | null;

  validation: FieldValidation;

  options: FormOption[];

  dateFormat?: DateFormat;

  sectionId?: string | null;
}


/* =========================================================
   TABLE CONFIG
   ========================================================= */

interface TableConfig {
  name: string;
  description: string;

  columns: TableColumn[];
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

  defaultValue: string | number | boolean | null;

  validation: FieldValidation;

  options: FormOption[];

  dateFormat?: DateFormat;

  sectionId?: string | null;

  table?: TableConfig;
}


/* =========================================================
   FORM SECTION

   IMPORTANT:
   This matches your ACTUAL JSON.

   Fields are NOT stored inside the section.

   Fields are connected to the section through:
   field.sectionId === section.id
   ========================================================= */

interface FormSection {
  id: string;
  name: string;
  label: string;
  description?: string;
}


/* =========================================================
   FORM CONFIG
   ========================================================= */

interface FormConfig {
  id?: string;
  name: string;

  sections?: FormSection[];

  fields: FormField[];
}


/* =========================================================
   COMPONENT
   ========================================================= */

@Component({
  selector: 'app-dynamic-form-renderer',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  templateUrl: './dynamic-form-renderer.html',
  styleUrl: './dynamic-form-renderer.css'
})
export class DynamicFormRenderer implements OnInit {


  /* =======================================================
     FORM CONFIGURATION
     ======================================================= */

  formConfig: FormConfig = testJson as FormConfig;


  /* =======================================================
     REACTIVE FORM
     ======================================================= */

  dynamicForm!: FormGroup;


  /* =======================================================
     STEPPER
     ======================================================= */

  currentSectionIndex = 0;


  /* =======================================================
     INITIALIZE
     ======================================================= */

  ngOnInit(): void {
    this.buildForm();
  }


  /* =======================================================
     CHECK STEPPER MODE
     ======================================================= */

  isStepperMode(): boolean {

    return !!(
      this.formConfig.sections &&
      this.formConfig.sections.length > 0
    );

  }


  /* =======================================================
     GET SECTIONS
     ======================================================= */

  getSections(): FormSection[] {

    return this.formConfig.sections || [];

  }


  /* =======================================================
     GET CURRENT SECTION
     ======================================================= */

  getCurrentSection(): FormSection | null {

    const sections = this.getSections();

    if (
      sections.length === 0 ||
      this.currentSectionIndex < 0 ||
      this.currentSectionIndex >= sections.length
    ) {

      return null;

    }

    return sections[this.currentSectionIndex];

  }


  /* =======================================================
     GET CURRENT SECTION FIELDS

     Fields belong to a section through sectionId.

     Example:

     section.id = "section_123"

     field.sectionId = "section_123"

     Therefore the field belongs to that section.
     ======================================================= */

  getCurrentSectionFields(): FormField[] {

    const section = this.getCurrentSection();

    if (!section) {
      return [];
    }

    return this.formConfig.fields.filter(
      field => field.sectionId === section.id
    );

  }


  /* =======================================================
     GET DISPLAYED FIELDS
     ======================================================= */

  getDisplayedFields(): FormField[] {

    /*
     * NORMAL FORM MODE
     *
     * No sections means the entire
     * form is rendered.
     */
    if (!this.isStepperMode()) {

      return this.formConfig.fields;

    }


    /*
     * STEPPER MODE
     *
     * Only fields belonging to the
     * current section are rendered.
     */
    return this.getCurrentSectionFields();

  }


  /* =======================================================
     GET FIELDS NOT BELONGING TO ANY SECTION
     ======================================================= */

  getUnsectionedFields(): FormField[] {

    return this.formConfig.fields.filter(
      field =>
        !field.sectionId
    );

  }


  /* =======================================================
     CHECK FIRST SECTION
     ======================================================= */

  isFirstSection(): boolean {

    return this.currentSectionIndex === 0;

  }


  /* =======================================================
     CHECK LAST SECTION
     ======================================================= */

  isLastSection(): boolean {

    return (
      this.currentSectionIndex ===
      this.getSections().length - 1
    );

  }


  /* =======================================================
     NEXT SECTION
     * ======================================================= */

  nextSection(): void {

    /*
     * Validate current section
     * before moving forward.
     */
    if (!this.validateCurrentSection()) {
      return;
    }


    if (!this.isLastSection()) {

      this.currentSectionIndex++;

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

    }

  }


  /* =======================================================
     PREVIOUS SECTION
     ======================================================= */

  previousSection(): void {

    if (!this.isFirstSection()) {

      this.currentSectionIndex--;

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

    }

  }


  /* =======================================================
     GO TO SECTION
     ======================================================= */

  goToSection(index: number): void {

    if (
      index < 0 ||
      index >= this.getSections().length
    ) {

      return;

    }


    /*
     * Allow going backward freely.
     *
     * For forward navigation,
     * validate sections one by one.
     */
    if (index > this.currentSectionIndex) {

      for (
        let i = this.currentSectionIndex;
        i < index;
        i++
      ) {

        if (
          !this.validateSection(
            this.getSections()[i]
          )
        ) {

          return;

        }

      }

    }


    this.currentSectionIndex = index;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  /* =======================================================
     VALIDATE CURRENT SECTION
     ======================================================= */

  validateCurrentSection(): boolean {

    const section =
      this.getCurrentSection();

    if (!section) {
      return true;
    }

    return this.validateSection(section);

  }


  /* =======================================================
     VALIDATE SECTION

     IMPORTANT:
     Section fields are now found using sectionId.
     ======================================================= */

  validateSection(
    section: FormSection
  ): boolean {

    let valid = true;


    /*
     * Get all fields belonging to this section.
     */
    const sectionFields =
      this.formConfig.fields.filter(
        field =>
          field.sectionId === section.id
      );


    for (
      const field of sectionFields
    ) {


      /* ---------------------------------------------------
         HIDDEN FIELDS
         --------------------------------------------------- */

      if (field.hidden) {
        continue;
      }


      /* ---------------------------------------------------
         TABLE
         --------------------------------------------------- */

      if (field.type === 'table') {

        const table =
          this.getTableArray(field);


        /*
         * Validate existing table rows.
         */
        table.controls.forEach(row => {

          Object.values(
            row.controls
          ).forEach(control => {

            control.markAsTouched();
            control.updateValueAndValidity();

            if (control.invalid) {
              valid = false;
            }

          });

        });

        continue;

      }


      /* ---------------------------------------------------
         NORMAL FIELD
         --------------------------------------------------- */

      /*
       * Empty field names are ignored.
       *
       * Your current JSON contains table fields
       * with an empty name, so this prevents
       * accidental FormGroup lookup problems.
       */
      if (!field.name) {
        continue;
      }

      const control =
        this.dynamicForm.get(
          field.name
        );

      if (!control) {
        continue;
      }

      control.markAsTouched();
      control.updateValueAndValidity();

      if (control.invalid) {
        valid = false;
      }

    }


    return valid;

  }


  /* =======================================================
     GET FIELD BY NAME
     ======================================================= */

  getFieldByName(
    fieldName: string
  ): FormField | undefined {

    return this.formConfig.fields.find(
      field =>
        field.name === fieldName
    );

  }


  /* =======================================================
     GET NORMAL FORM FIELDS
     ======================================================= */

  getNormalFields(): FormField[] {

    return this.formConfig.fields;

  }


  /* =======================================================
     BUILD MAIN FORM
     ======================================================= */

  buildForm(): void {

    const controls: {
      [key: string]: AbstractControl
    } = {};


    for (
      const field of this.formConfig.fields
    ) {


      /* ---------------------------------------------------
         TABLE
         --------------------------------------------------- */

      if (field.type === 'table') {

        const tableName =
          field.name ||
          this.generateTableName(field);

        controls[tableName] =
          new FormArray<FormGroup>([]);

        continue;

      }


      /* ---------------------------------------------------
         IGNORE EMPTY FIELD NAME
         --------------------------------------------------- */

      if (!field.name) {
        continue;
      }


      /* ---------------------------------------------------
         NORMAL FIELD
         --------------------------------------------------- */

      const validators =
        this.buildValidators(field);

      let initialValue =
        field.defaultValue ??
        this.getDefaultValue(field);


      /* ---------------------------------------------------
         DATE DEFAULT VALUE
         --------------------------------------------------- */

      if (
        field.type === 'date' &&
        field.defaultValue
      ) {

        initialValue =
          this.normalizeDateForInputWithFormat(
            String(field.defaultValue),
            field.dateFormat
          );

      }


      const control =
        new FormControl(
          {
            value: initialValue,
            disabled: field.disabled
          },
          validators
        );

      controls[field.name] = control;

    }


    this.dynamicForm =
      new FormGroup(controls);

  }


  /* =======================================================
     DEFAULT VALUE
     ======================================================= */

  getDefaultValue(
    field: FormField | TableColumn
  ): string | number | boolean {

    if (field.type === 'checkbox') {
      return false;
    }

    return '';

  }


  /* =======================================================
     BUILD VALIDATORS
     ======================================================= */

  buildValidators(
    field: FormField | TableColumn
  ): ValidatorFn[] {

    const validators: ValidatorFn[] = [];

    const validation =
      field.validation;


    /* ---------------------------------------------------
       REQUIRED
       --------------------------------------------------- */

    if (validation?.required) {

      if (field.type === 'checkbox') {

        validators.push(
          Validators.requiredTrue
        );

      } else {

        validators.push(
          Validators.required
        );

      }

    }


    /* ---------------------------------------------------
       MIN LENGTH
       --------------------------------------------------- */

    if (
      validation?.minLength !== null &&
      validation?.minLength !== undefined
    ) {

      validators.push(
        Validators.minLength(
          validation.minLength
        )
      );

    }


    /* ---------------------------------------------------
       MAX LENGTH
       --------------------------------------------------- */

    if (
      validation?.maxLength !== null &&
      validation?.maxLength !== undefined
    ) {

      validators.push(
        Validators.maxLength(
          validation.maxLength
        )
      );

    }


    /* ---------------------------------------------------
       MIN VALUE
       --------------------------------------------------- */

    if (
      validation?.min !== null &&
      validation?.min !== undefined
    ) {

      validators.push(
        Validators.min(
          validation.min
        )
      );

    }


    /* ---------------------------------------------------
       MAX VALUE
       --------------------------------------------------- */

    if (
      validation?.max !== null &&
      validation?.max !== undefined
    ) {

      validators.push(
        Validators.max(
          validation.max
        )
      );

    }


    /* ---------------------------------------------------
       EMAIL
       --------------------------------------------------- */

    if (field.type === 'email') {

      validators.push(
        Validators.email
      );

    }


    /* ---------------------------------------------------
       PATTERN
       --------------------------------------------------- */

    if (
      validation?.pattern &&
      validation.pattern !== ''
    ) {

      const pattern =
        this.getPattern(
          validation.pattern
        );

      if (pattern) {

        validators.push(
          Validators.pattern(pattern)
        );

      }

    }


    return validators;

  }


  /* =======================================================
     PATTERN CONFIGURATION
     ======================================================= */

  getPattern(
    pattern: string
  ): string | null {

    switch (pattern) {

      case 'TEXT_ONLY':
        return '^[a-zA-Z ]+$';

      case 'NUMBER_ONLY':
        return '^[0-9]+$';

      case 'ALPHANUMERIC':
        return '^[a-zA-Z0-9]+$';

      case 'ALPHANUMERIC_SPECIAL':
        return `^[a-zA-Z0-9\\s!@#$%^&*()_+\\-=\\[\\]{};:'",.<>/?]+$`;

      case 'ALL':
        return '^[\\s\\S]*$';

      default:
        return null;

    }

  }


  /* =======================================================
     NORMAL FIELD CONTROL
     ======================================================= */

  getControl(
    field: FormField | TableColumn
  ): FormControl {

    return this.dynamicForm.get(
      field.name
    ) as FormControl;

  }


  /* =======================================================
     DATE FORMAT
     ======================================================= */

  getDateFormat(
    field: FormField | TableColumn
  ): DateFormat {

    return field.dateFormat ||
      'dd/MM/yyyy';

  }


  /* =======================================================
     DATE PLACEHOLDER
     ======================================================= */

  getDatePlaceholder(
    field: FormField | TableColumn
  ): string {

    return this.getDateFormat(field)
      .replace('yyyy', 'YYYY');

  }


  /* =======================================================
     FORMAT DATE FOR DISPLAY
     ======================================================= */

  formatDateForDisplay(
    value: string | null | undefined,
    format?: DateFormat
  ): string {

    if (!value) {
      return '';
    }

    const isoValue =
      String(value);


    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(isoValue)
    ) {

      return isoValue;

    }


    const [
      year,
      month,
      day
    ] = isoValue.split('-');


    const dateFormat =
      format || 'dd/MM/yyyy';


    switch (dateFormat) {

      case 'dd/MM/yyyy':
        return `${day}/${month}/${year}`;

      case 'MM/dd/yyyy':
        return `${month}/${day}/${year}`;

      case 'yyyy/MM/dd':
        return `${year}/${month}/${day}`;

      case 'dd-MM-yyyy':
        return `${day}-${month}-${year}`;

      case 'MM-dd-yyyy':
        return `${month}-${day}-${year}`;

      case 'yyyy-MM-dd':
        return `${year}-${month}-${day}`;

      default:
        return isoValue;

    }

  }


  /* =======================================================
     NORMALIZE DATE FOR HTML/FORM VALUE
     ======================================================= */

  normalizeDateForInput(
    value: string
  ): string {

    return this.normalizeDateForInputWithFormat(
      value,
      'dd/MM/yyyy'
    );

  }


  /* =======================================================
     NORMALIZE DATE USING CONFIGURED FORMAT
     ======================================================= */

  normalizeDateForInputWithFormat(
    value: string,
    format?: DateFormat
  ): string {

    if (!value) {
      return '';
    }


    if (
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

      return value;

    }


    const dateFormat =
      format || 'dd/MM/yyyy';


    const separator =
      dateFormat.includes('/')
        ? '/'
        : '-';


    const parts =
      value.split(separator);


    if (parts.length !== 3) {
      return value;
    }


    let day: string;
    let month: string;
    let year: string;


    switch (dateFormat) {

      case 'dd/MM/yyyy':
      case 'dd-MM-yyyy':

        day = parts[0];
        month = parts[1];
        year = parts[2];

        break;


      case 'MM/dd/yyyy':
      case 'MM-dd-yyyy':

        month = parts[0];
        day = parts[1];
        year = parts[2];

        break;


      case 'yyyy/MM/dd':
      case 'yyyy-MM-dd':

        year = parts[0];
        month = parts[1];
        day = parts[2];

        break;


      default:
        return value;

    }


    return `${year}-${month}-${day}`;

  }


  /* =======================================================
     DATE VALIDATION
     ======================================================= */

  isValidDateValue(
    value: string,
    format?: DateFormat
  ): boolean {

    if (!value) {
      return true;
    }


    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

      return false;

    }


    const [
      year,
      month,
      day
    ] = value
      .split('-')
      .map(Number);


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );

  }


  /* =======================================================
     DATE TO ISO
     ======================================================= */

  dateToIso(
    value: string
  ): string | null {

    if (!value) {
      return null;
    }


    if (
      !this.isValidDateValue(value)
    ) {

      return null;

    }


    return value;

  }


  /* =======================================================
     NORMAL DATE INPUT
     ======================================================= */

  onDateInput(
    event: Event,
    field: FormField
  ): void {

    const input =
      event.target as HTMLInputElement;

    const displayValue =
      input.value;

    const control =
      this.getControl(field);


    if (!displayValue) {

      control.setValue(
        '',
        {
          emitEvent: false
        }
      );

      return;

    }


    const isoValue =
      this.normalizeDateForInputWithFormat(
        displayValue,
        field.dateFormat
      );


    if (
      this.isValidDateValue(
        isoValue
      )
    ) {

      control.setValue(
        isoValue,
        {
          emitEvent: false
        }
      );

    } else {

      control.setValue(
        displayValue,
        {
          emitEvent: false
        }
      );

    }


    control.markAsDirty();
    control.updateValueAndValidity();

  }


  /* =======================================================
     TABLE DATE INPUT
     ======================================================= */

  onTableDateInput(
    event: Event,
    field: FormField,
    rowIndex: number,
    column: TableColumn
  ): void {

    const input =
      event.target as HTMLInputElement;

    const displayValue =
      input.value;

    const control =
      this.getTableCell(
        field,
        rowIndex,
        column
      );


    if (!displayValue) {

      control.setValue(
        '',
        {
          emitEvent: false
        }
      );

      return;

    }


    const isoValue =
      this.normalizeDateForInputWithFormat(
        displayValue,
        column.dateFormat
      );


    if (
      this.isValidDateValue(
        isoValue
      )
    ) {

      control.setValue(
        isoValue,
        {
          emitEvent: false
        }
      );

    } else {

      control.setValue(
        displayValue,
        {
          emitEvent: false
        }
      );

    }


    control.markAsDirty();
    control.updateValueAndValidity();

  }


  /* =======================================================
     GET NORMALIZED FORM VALUE
     ======================================================= */

  getNormalizedFormValue(): any {

    const value =
      this.dynamicForm.getRawValue();


    for (
      const field of this.formConfig.fields
    ) {

      if (
        field.type === 'date' &&
        field.name
      ) {

        value[field.name] =
          this.dateToIso(
            value[field.name]
          );

      }


      if (
        field.type === 'table' &&
        field.table
      ) {

        const tableName =
          field.name ||
          this.generateTableName(field);

        const rows =
          value[tableName] || [];


        rows.forEach(
          (row: any) => {

            field.table!.columns.forEach(
              column => {

                if (
                  column.type === 'date' &&
                  column.name
                ) {

                  row[column.name] =
                    this.dateToIso(
                      row[column.name]
                    );

                }

              }
            );

          }
        );

      }

    }


    return value;

  }


  /* =======================================================
     GET TABLE FORM ARRAY
     ======================================================= */

  getTableArray(
    field: FormField
  ): FormArray<FormGroup> {

    const tableName =
      field.name ||
      this.generateTableName(field);

    return this.dynamicForm.get(
      tableName
    ) as FormArray<FormGroup>;

  }


  /* =======================================================
     GENERATE TABLE NAME
     ======================================================= */

  generateTableName(
    field: FormField
  ): string {

    if (field.table?.name) {

      return field.table.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

    }


    return `table_${this.formConfig.fields.indexOf(field)}`;

  }


  /* =======================================================
     ADD TABLE ROW
     ======================================================= */

  addTableRow(
    field: FormField
  ): void {

    if (
      field.type !== 'table' ||
      !field.table
    ) {

      return;

    }


    const rowControls: {
      [key: string]: FormControl
    } = {};


    for (
      const column of field.table.columns
    ) {

      /*
       * Ignore invalid/empty column names.
       */
      if (!column.name) {
        continue;
      }


      const validators =
        this.buildValidators(column);

      let initialValue =
        column.defaultValue ??
        this.getDefaultValue(column);


      if (
        column.type === 'date' &&
        column.defaultValue
      ) {

        initialValue =
          this.normalizeDateForInputWithFormat(
            String(column.defaultValue),
            column.dateFormat
          );

      }


      rowControls[column.name] =
        new FormControl(
          {
            value: initialValue,
            disabled: column.disabled
          },
          validators
        );

    }


    const row =
      new FormGroup(rowControls);


    this.getTableArray(field)
      .push(row);

  }


  /* =======================================================
     REMOVE TABLE ROW
     ======================================================= */

  removeTableRow(
    field: FormField,
    rowIndex: number
  ): void {

    this.getTableArray(field)
      .removeAt(rowIndex);

  }


  /* =======================================================
     GET TABLE ROW
     ======================================================= */

  getTableRow(
    field: FormField,
    rowIndex: number
  ): FormGroup {

    return this.getTableArray(field)
      .at(rowIndex) as FormGroup;

  }


  /* =======================================================
     GET TABLE CELL
     ======================================================= */

  getTableCell(
    field: FormField,
    rowIndex: number,
    column: TableColumn
  ): FormControl {

    const row =
      this.getTableRow(
        field,
        rowIndex
      );

    return row.get(
      column.name
    ) as FormControl;

  }


  /* =======================================================
     TABLE COLUMN ERROR
     ======================================================= */

  hasTableCellError(
    field: FormField,
    rowIndex: number,
    column: TableColumn,
    error: string
  ): boolean {

    const control =
      this.getTableCell(
        field,
        rowIndex,
        column
      );

    return (
      control.touched &&
      control.hasError(error)
    );

  }


  /* =======================================================
     TABLE CELL VALIDATION MESSAGE
     ======================================================= */

  getTableCellErrorMessage(
    field: FormField,
    rowIndex: number,
    column: TableColumn
  ): string {

    const control =
      this.getTableCell(
        field,
        rowIndex,
        column
      );


    if (control.hasError('required')) {
      return 'This field is required.';
    }


    if (control.hasError('requiredTrue')) {
      return 'This field is required.';
    }


    if (control.hasError('minlength')) {
      return `Minimum length is ${column.validation.minLength}.`;
    }


    if (control.hasError('maxlength')) {
      return `Maximum length is ${column.validation.maxLength}.`;
    }


    if (control.hasError('min')) {
      return `Minimum value is ${column.validation.min}.`;
    }


    if (control.hasError('max')) {
      return `Maximum value is ${column.validation.max}.`;
    }


    if (control.hasError('email')) {
      return 'Please enter a valid email.';
    }


    if (control.hasError('pattern')) {
      return 'Invalid format.';
    }


    return '';

  }


  /* =======================================================
     TABLE ROW COUNT
     ======================================================= */

  getTableRowCount(
    field: FormField
  ): number {

    return this.getTableArray(field)
      .length;

  }


  /* =======================================================
     TABLE VALIDATION
     ======================================================= */

  validateTableRows(
    field: FormField
  ): void {

    const table =
      this.getTableArray(field);


    table.controls.forEach(
      row => {

        Object.values(
          row.controls
        ).forEach(
          control => {

            control.markAsTouched();
            control.updateValueAndValidity();

          }
        );

      }
    );

  }


  /* =======================================================
     SUBMIT
     ======================================================= */

  submitForm(): void {

    /*
     * In stepper mode, only the final
     * section can submit the form.
     */
    if (
      this.isStepperMode() &&
      !this.isLastSection()
    ) {

      return;

    }


    if (this.dynamicForm.invalid) {

      this.dynamicForm.markAllAsTouched();


      for (
        const field of this.formConfig.fields
      ) {

        if (field.type === 'table') {

          this.validateTableRows(field);

        }

      }


      console.log(
        'Form is invalid'
      );


      console.log(
        this.dynamicForm
      );


      return;

    }


    console.log(
      'FORM SUBMITTED'
    );


    console.log(
      this.getNormalizedFormValue()
    );

  }


  /* =======================================================
     GET COMPLETE FORM VALUE
     ======================================================= */

  getFormValue(): any {

    return this.dynamicForm.getRawValue();

  }


  /* =======================================================
     GET TABLE VALUE
     ======================================================= */

  getTableValue(
    field: FormField
  ): any[] {

    return this.getTableArray(field)
      .getRawValue();

  }


  /* =======================================================
     CHECK IF FIELD IS TABLE
     ======================================================= */

  isTable(
    field: FormField
  ): boolean {

    return field.type === 'table';

  }


  /* =======================================================
     CHECK IF TABLE HAS ROWS
     ======================================================= */

  hasTableRows(
    field: FormField
  ): boolean {

    return this.getTableArray(field)
      .length > 0;

  }

}