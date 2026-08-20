import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


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

  /*
   * Used only when type === 'date'
   */
  dateFormat?: string;

  /*
   * Used only when type === 'table'
   */
  table?: DynamicTableConfig;

}


/* =========================================================
   DYNAMIC TABLE COLUMN
   ========================================================= */

interface DynamicTableColumn extends FormField {
}


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

  name: string;

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
    FormsModule
  ],

  templateUrl: './form-builder-engine.html',

  styleUrl: './form-builder-engine.css'

})


export class FormBuilderEngine {


  /* =======================================================
     FORM MODEL
     ======================================================= */

  form: FormConfig = {

    name: '',

    fields: []

  };


  /* =======================================================
     ACCORDION STATE
     ======================================================= */

  openFieldIndex: number | null = null;


  /* =======================================================
     CREATE DEFAULT VALIDATION
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

      dateFormat: 'MM/DD/YYYY'

    };

  }


  /* =======================================================
     ADD NORMAL FIELD
     ======================================================= */

  addField(): void {

    const newField = this.createField();

    this.form.fields.push(newField);

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

      this.openFieldIndex =
        Math.min(
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

    if (this.openFieldIndex === index) {

      this.openFieldIndex = null;

    }

    else {

      this.openFieldIndex = index;

    }

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

  addTable(): void {

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


    if (!field.table) {

      field.table = {

        name: '',

        description: '',

        columns: []

      };

    }


    const column: DynamicTableColumn = {

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

      dateFormat: 'MM/DD/YYYY'

    };


    field.table.columns.push(column);

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
     ADD OPTION TO TABLE COLUMN
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
     REMOVE OPTION FROM TABLE COLUMN
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
     RESET FORM BUILDER
     ======================================================= */

  resetForm(): void {

    this.form = {

      name: '',

      fields: []

    };

    this.openFieldIndex = null;

  }


  /* =======================================================
     SAVE FORM
     ======================================================= */

  saveForm(): void {

    console.log(
      'Form configuration saved:',
      this.form
    );

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