import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiServices } from '../../services/api-services/api-services';
import {
  PopUpDialogBox,
  PopUpDialogConfig
} from '../../reusable-components/pop-up-dialog-box/pop-up-dialog-box';

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
  | 'is_primary_key'
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
  is_primary_key: boolean;

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
   DB TABLE ITEM TYPE
   ========================================================= */

type DbTableItemType =
  | 'field'
  | 'section';

/* =========================================================
   DB TABLE ITEM
   ========================================================= */

interface DbTableItem {
  id: string;
  type: DbTableItemType;

  /*
   * For field:
   * stores the original field index.
   *
   * For section:
   * stores the section id.
   */
  reference: string;
}

/* =========================================================
   DB TABLE CONFIGURATION
   ========================================================= */

interface DbTableConfig {
  id: string;
  tableName: string;
  items: DbTableItem[];
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

  /*
   * Database table mappings.
   */
  dbTables: DbTableConfig[];
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
    fields: [],
    dbTables: []
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
    },
    {
      key: 'is_primary_key',
      label: 'Primary Key'
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
      is_primary_key: false,

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

    /*
     * Remove any DB-table mappings that reference
     * this section.
     */
    this.form.dbTables.forEach(dbTable => {
      dbTable.items = dbTable.items.filter(
        item =>
          !(
            item.type === 'section' &&
            item.reference === section.id
          )
      );
    });

    /*
     * Remove empty DB-table mappings.
     */
    this.form.dbTables =
      this.form.dbTables.filter(
        dbTable => dbTable.items.length > 0
      );

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

    /*
     * Remove DB-table references to this field.
     */
    const fieldReference = String(index);

    this.form.dbTables.forEach(dbTable => {
      dbTable.items = dbTable.items.filter(
        item =>
          !(
            item.type === 'field' &&
            item.reference === fieldReference
          )
      );
    });

    /*
     * Remove empty DB-table mappings.
     */
    this.form.dbTables =
      this.form.dbTables.filter(
        dbTable => dbTable.items.length > 0
      );

    this.form.fields.splice(index, 1);

    /*
     * Because field references use array indexes,
     * update references after deletion.
     */
    this.form.dbTables.forEach(dbTable => {

      dbTable.items.forEach(item => {

        if (item.type !== 'field') {
          return;
        }

        const currentIndex =
          Number(item.reference);

        if (currentIndex > index) {
          item.reference =
            String(currentIndex - 1);
        }

      });

    });

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
      is_primary_key: false,

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
      is_primary_key: false,

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

      case 'is_primary_key':
        return field.is_primary_key;

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

      case 'is_primary_key':
        field.is_primary_key = value;
        break;
    }
  }

  /* =======================================================
     ADD DB TABLE
     ======================================================= */

  addDbTable(): void {

    const dbTable: DbTableConfig = {
      id: this.generateId('dbtable'),
      tableName: '',
      items: []
    };

    this.form.dbTables.push(dbTable);
  }

  /* =======================================================
     REMOVE DB TABLE
     ======================================================= */

  removeDbTable(index: number): void {

    if (
      index < 0 ||
      index >= this.form.dbTables.length
    ) {
      return;
    }

    this.form.dbTables.splice(index, 1);
  }

  /* =======================================================
     GET AVAILABLE GENERAL FIELDS
     ======================================================= */

  getAvailableDbTableFields(
    currentDbTable: DbTableConfig
  ): FormField[] {

    return this.form.fields.filter(
      field => {

        /*
         * Only normal fields without a section
         * are available for DB-table assignment.
         */
        if (
          field.type === 'table' ||
          field.sectionId !== null
        ) {
          return false;
        }

        const fieldIndex =
          this.getFieldIndex(field);

        return !this.isFieldAssignedToAnotherDbTable(
          fieldIndex,
          currentDbTable
        );
      }
    );
  }

  /* =======================================================
     GET AVAILABLE SECTIONS
     ======================================================= */

  getAvailableDbTableSections(
    currentDbTable: DbTableConfig
  ): FormSection[] {

    return this.form.sections.filter(
      section =>
        !this.isSectionAssignedToAnotherDbTable(
          section.id,
          currentDbTable
        )
    );
  }

  /* =======================================================
     CHECK FIELD ASSIGNMENT
     ======================================================= */

  private isFieldAssignedToAnotherDbTable(
    fieldIndex: number,
    currentDbTable: DbTableConfig
  ): boolean {

    return this.form.dbTables.some(
      dbTable => {

        /*
         * Ignore the current DB table because
         * its own selected items should not disappear
         * from its own list.
         */
        if (
          dbTable.id === currentDbTable.id
        ) {
          return false;
        }

        return dbTable.items.some(
          item =>
            item.type === 'field' &&
            item.reference === String(fieldIndex)
        );
      }
    );
  }

  /* =======================================================
     CHECK SECTION ASSIGNMENT
     ======================================================= */

  private isSectionAssignedToAnotherDbTable(
    sectionId: string,
    currentDbTable: DbTableConfig
  ): boolean {

    return this.form.dbTables.some(
      dbTable => {

        if (
          dbTable.id === currentDbTable.id
        ) {
          return false;
        }

        return dbTable.items.some(
          item =>
            item.type === 'section' &&
            item.reference === sectionId
        );
      }
    );
  }

  /* =======================================================
     GET DB TABLE CURRENT SELECTION
     ======================================================= */

  getDbTableSelectionValue(
    dbTable: DbTableConfig
  ): string {

    /*
     * V1 allows one selection at a time
     * from the dropdown.
     *
     * Multiple items can still be assigned
     * to the same DB table.
     *
     * The dropdown itself resets after selection.
     */
    return '';
  }

  /* =======================================================
     SET DB TABLE SELECTION
     ======================================================= */

  setDbTableSelection(
    dbTable: DbTableConfig,
    value: string
  ): void {

    if (!value) {
      return;
    }

    const separatorIndex =
      value.indexOf(':');

    if (separatorIndex === -1) {
      return;
    }

    const type =
      value.substring(
        0,
        separatorIndex
      ) as DbTableItemType;

    const reference =
      value.substring(
        separatorIndex + 1
      );

    if (!reference) {
      return;
    }

    /*
     * Prevent duplicate assignment inside
     * the same DB table.
     */
    const alreadyExists =
      dbTable.items.some(
        item =>
          item.type === type &&
          item.reference === reference
      );

    if (alreadyExists) {
      return;
    }

    /*
     * Add the selected item.
     */
    dbTable.items.push({
      id: this.generateId('dbitem'),
      type,
      reference
    });
  }

  /* =======================================================
     REMOVE DB TABLE ITEM
     ======================================================= */

  removeDbTableItem(
    dbTable: DbTableConfig,
    itemId: string
  ): void {

    dbTable.items =
      dbTable.items.filter(
        item => item.id !== itemId
      );
  }

  /* =======================================================
     GET DB TABLE ITEM DISPLAY NAME
     ======================================================= */

  getDbTableItemDisplayName(
    item: DbTableItem
  ): string {

    if (item.type === 'field') {

      const fieldIndex =
        Number(item.reference);

      const field =
        this.form.fields[fieldIndex];

      if (!field) {
        return 'Unknown Field';
      }

      return (
        field.label ||
        field.name ||
        'Untitled Field'
      );
    }

    const section =
      this.form.sections.find(
        currentSection =>
          currentSection.id === item.reference
      );

    if (!section) {
      return 'Unknown Section';
    }

    return (
      section.label ||
      section.name ||
      'Untitled Section'
    );
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

    const target =
      event.target as HTMLElement;

    const tagName =
      target.tagName.toLowerCase();

    /*
     * =====================================================
     * TEXTAREA
     * =====================================================
     */

    if (tagName === 'textarea') {
      return;
    }

    /*
     * =====================================================
     * NUMBER / RANGE INPUT
     * =====================================================
     */

    if (
      tagName === 'input' &&
      (
        (target as HTMLInputElement).type === 'number' ||
        (target as HTMLInputElement).type === 'range'
      )
    ) {

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
     */

    if (
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight'
    ) {

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
       * DOWN / RIGHT
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
       * UP / LEFT
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
       */

      if (
        target.id === 'formId'
      ) {
        return;
      }

      /*
       * BUTTON
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
       * Ignore invisible elements.
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
      fields: [],
      dbTables: []
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

    // this.api.post('/forms', this.form).subscribe({
    //   next: (response) => {
    //     console.log(
    //       'Form submitted successfully:',
    //       response
    //     );
    //   },
    //   error: (error) => {
    //     console.error(
    //       'Form submission failed:',
    //       error
    //     );
    //   }
    // });

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