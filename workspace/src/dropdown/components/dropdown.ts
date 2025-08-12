import { Component, EventEmitter, forwardRef, Input, OnChanges, OnInit, Optional, Output, Self, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, ValidationErrors, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ControlValueAccessorBase } from '@suriya_40/sketch/utils';

/**
* 
 * This component provides a customizable dropdown/select input, supporting custom label/value bindings,
 * validation, and integration with Angular forms via ControlValueAccessor. It emits value changes and
 * supports displaying validation messages.
 * 
 * @example
 * <dropdown
 *   [items]="countryList"
 *   label="Country"
 *   bindLabel="name"
 *   bindValue="code"
 *   placeholder="Select a country"
 *   [required]="true"
 *   [submitted]="formSubmitted"
 *   validationMessage="Country is required"
 *   (onValueChange)="onCountryChange($event)">
 * </dropdown>
 */
@Component({
  selector: 'dropdown',
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss'
})
export class Dropdown extends ControlValueAccessorBase implements OnInit, OnChanges {
  /**
   * The list of items to display in the dropdown.
   */
  @Input() items: any[] = [];

  /**
   * The label to display for the dropdown.
   */
  @Input() label: string = '';

  /**
   * The property name to use for displaying item labels.
   * @default 'label'
   */
  @Input() bindLabel: string = 'label';

  /**
   * The property name to use for item values.
   * @default ''
   */
  @Input() bindValue: string = '';

  /**
   * Placeholder text for the dropdown input.
   * @default 'Select an option'
   */
  @Input() placeholder: string = 'Select an option';

  /**
   * Whether the field is required.
   * @default false
   */
  @Input() required: boolean = false;

  /**
   * Custom validation message to display when invalid.
   * @default ''
   */
  @Input() validationMessage: string = '';

  /**
   * Whether the form has been submitted (for validation display).
   * @default false
   */
  @Input() submitted: boolean = false;

  @Output() onValueChange = new EventEmitter<string | Date | [Date, Date] | null>();

  // Make Validators class available to the template
  public readonly Validators = Validators;

  // Inject NgControl to get access to the form control instance
  constructor(
    /**
     * @ignore
     */
    @Optional() @Self() public ngControl: NgControl
  ) {
    super();
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  /**
   * @ignore
   */
  ngOnInit(): void {
    // Initialization logic here
  }

  /**
   * @ignore
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Handle input changes here
  }

  onSelectionChange(event: any) {
    this.value = event && event.id;
    this.onChange(event);
    this.onTouched();
    this.onValueChange.emit(this.value);
  }

  /**
   * @ignore
   */
  validate(control: AbstractControl): ValidationErrors | null {
    // We use the inherited 'this.value' for validation
    if (this.required && (this.value === null || this.value === undefined)) {
      return { required: true };
    }
    return null;
  }

}
