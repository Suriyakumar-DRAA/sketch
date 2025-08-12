import { Component, EventEmitter, Input, OnChanges, OnInit, Optional, Output, Self, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormsModule, NgControl, ValidationErrors } from '@angular/forms';
import { BsDatepickerModule, BsDatepickerConfig, BsDatepickerDirective } from 'ngx-bootstrap/datepicker';
import { ControlValueAccessorBase } from '@suriya_40/sketch/utils';

/**
 * Datepicker component for selecting single or range of dates.
 * Supports min/max date, custom format, and validation.
 */
/**
 * Datepicker component that wraps the BsDatepicker from ngx-bootstrap, providing
 * integration with Angular forms and additional configuration options.
 *
 * @example
 * <datepicker
 *   [label]="'Select Date'"
 *   [placeholder]="'DD/MM/YYYY'"
 *   [minDate]="min"
 *   [maxDate]="max"
 *   [dateFormat]="'DD/MM/YYYY'"
 *   [isRangePicker]="false"
 *   [required]="true"
 *   [validationMessage]="'Date is required'"
 *   [submitted]="formSubmitted"
 *   (onValueChange)="onDateChange($event)">
 * </datepicker>
 *
 * @export
 * @class Datepicker
 */
@Component({
  selector: 'datepicker',
  imports: [CommonModule, FormsModule, BsDatepickerModule],
  templateUrl: './datepicker.html',
  styleUrl: './datepicker.scss',
})
export class Datepicker extends ControlValueAccessorBase implements OnInit, OnChanges {
  /**
   * Reference to the internal BsDatepicker directive instance.
   */
  @ViewChild(BsDatepickerDirective) datepicker!: BsDatepickerDirective;

  /**
   * The label to display for the datepicker.
   */
  @Input() label: string = '';

  /**
   * Placeholder text for the input field.
   * @default ''
   */
  @Input() placeholder: string = '';

  /**
   * Minimum selectable date.
   */
  @Input() minDate?: Date;

  /**
   * Maximum selectable date.
   */
  @Input() maxDate?: Date;

  /**
   * Date format string (e.g., 'DD/MM/YYYY').
   * @default 'DD/MM/YYYY'
   */
  @Input() dateFormat = 'DD/MM/YYYY';

  /**
   * Enable range picker mode.
   * @default false
   */
  @Input() isRangePicker = false;

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

  /**
   * Emits an event whenever the datepicker's value changes.
   * The emitted value contains the new selected date or value.
   * Subscribe to this event to be notified of user input or programmatic changes.
   */
  @Output() onValueChange = new EventEmitter<any>();

  /**
   * Configuration object for customizing the behavior and appearance of the datepicker.
   * Accepts a partial set of properties from the `BsDatepickerConfig` interface, allowing
   * for flexible and granular control over datepicker options such as date format, theme,
   * min/max dates, and more.
   */
  bsConfig: Partial<BsDatepickerConfig>;

  constructor(
    /**
     * @ignore
     */
    @Optional() @Self() public ngControl: NgControl
  ) {
    super();
    if (this.ngControl) {
      // Set this component as the value accessor for the form control.
      this.ngControl.valueAccessor = this;
    }

    this.bsConfig = {
      containerClass: 'theme-blue',
      isAnimated: false,
      dateInputFormat: this.dateFormat,
    };
  }


  /**
   * @ignore
   */
  ngOnInit(): void {
    this.bsConfig.dateInputFormat = this.dateFormat;
  }

  /**
   * @ignore
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dateFormat']) {
      this.bsConfig = {
        ...this.bsConfig,
        dateInputFormat: this.dateFormat
      }
    }
  }

  /**
   * @ignore
   */
  onPickerChange(newValue: any) {
    this.value = newValue;
    this.onChange(this.value);
    this.onValueChange.emit(this.value);
  }

  /**
   * @ignore
   */
  public toggleDatepicker(): void {
    if (this.datepicker && !this.isDisabled) {
      this.datepicker.toggle();
    }
  }

  /**
   * @ignore
   */
  handleBlur() {
    this.onTouched();
    if (this.datepicker && this.value !== this.datepicker.bsValue) {
      this.value = this.datepicker.bsValue ? this.datepicker.bsValue : null;
      this.onChange(this.value);
    }
  }

  /**
   * @ignore
   */
  validate(control: AbstractControl): ValidationErrors | null {
    this.value = control.value;
    if (this.required && (this.value === null || this.value === undefined)) {
      return { required: true };
    }
    return null;
  }
}
