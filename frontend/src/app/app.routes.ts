import { Routes } from '@angular/router';
import { FormBuilderEngine } from '../platform/form-builder-engine/form-builder-engine';
import { DynamicFormRenderer } from '../platform/dynamic-form-renderer/dynamic-form-renderer';
export const routes: Routes = [
    {path:'',component: FormBuilderEngine},
    {path:'renderer',component:DynamicFormRenderer}
];
