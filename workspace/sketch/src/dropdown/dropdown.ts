import { Component, EventEmitter, forwardRef, Input, OnChanges, OnInit, Optional, Output, Self, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, ValidationErrors, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ControlValueAccessorBase } from '../utils/control-value-accessor-base';
@Component({
  selector: 'dropdown',
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './dropdown.html',
  styleUrls: ['./dropdown.scss']
})
export class Dropdown extends ControlValueAccessorBase implements OnInit, OnChanges {
  @Input() items: any[] = [];
  @Input() label: string = '';
  @Input() bindLabel: string = 'label';
  @Input() bindValue: string = '';
  @Input() placeholder: string = 'Select an option';
  @Input() required: boolean = false;
  @Input() validationMessage: string = '';
  @Input() submitted: boolean = false;

  @Output() onValueChange = new EventEmitter<string | Date | [Date, Date] | null>();

  // Make Validators class available to the template
  public readonly Validators = Validators;

  // Inject NgControl to get access to the form control instance
  constructor(@Optional() @Self() public ngControl: NgControl) {
    super();
    if (this.ngControl) {
      // Set this component as the value accessor for the form control
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    // Initialization logic here
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle input changes here
  }

  // The ControlValueAccessor methods (writeValue, registerOnChange, etc.)
  // and properties (value, isDisabled, onChange, onTouched) are now inherited
  // from ControlValueAccessorBase.
  onSelectionChange(event: any) {
    this.value = event && event.id;
    this.onChange(event);
    this.onTouched();
    this.onValueChange.emit(this.value);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    // We use the inherited 'this.value' for validation
    if (this.required && (this.value === null || this.value === undefined)) {
      return { required: true };
    }
    return null;
  }

}
