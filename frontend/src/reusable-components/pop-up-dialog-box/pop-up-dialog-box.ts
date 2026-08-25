import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';


/* =========================================================
   POPUP DIALOG CONFIGURATION
   ========================================================= */

export interface PopUpDialogConfig {

  visible: boolean;

  title: string;

  message: string;

  confirmText: string;

  cancelText: string;
}


/* =========================================================
   COMPONENT
   ========================================================= */

@Component({
  selector: 'app-pop-up-dialog-box',
  standalone: true,
  imports: [],
  templateUrl: './pop-up-dialog-box.html',
  styleUrl: './pop-up-dialog-box.css'
})
export class PopUpDialogBox {

  /* =======================================================
     CONFIGURATION
     ======================================================= */

  @Input() config!: PopUpDialogConfig;


  /* =======================================================
     OUTPUTS
     ======================================================= */

  @Output() confirmed =
    new EventEmitter<void>();

  @Output() cancelled =
    new EventEmitter<void>();


  /* =======================================================
     CONFIRM
     ======================================================= */

  onConfirm(): void {
    this.confirmed.emit();
  }


  /* =======================================================
     CANCEL
     ======================================================= */

  onCancel(): void {
    this.cancelled.emit();
  }
}