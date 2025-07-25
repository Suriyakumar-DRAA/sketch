import { Component, EventEmitter, Input, OnChanges, OnInit, Optional, Output, Self, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormsModule, NgControl, ValidationErrors } from '@angular/forms';
import { BsDatepickerModule, BsDatepickerConfig, BsDatepickerDirective } from 'ngx-bootstrap/datepicker';
import { ControlValueAccessorBase } from '@org/sketch/utils';

@Component({
  selector: 'lightning-datepicker',
  imports: [CommonModule, FormsModule, BsDatepickerModule],
  templateUrl: './datepicker.html',
  styleUrl: './datepicker.scss',
})
export class DatepickerComponent extends ControlValueAccessorBase implements OnInit, OnChanges {

  @ViewChild(BsDatepickerDirective) datepicker!: BsDatepickerDirective;

  // --- Component Inputs ---
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Input() dateFormat = 'DD/MM/YYYY';
  @Input() isRangePicker = false;
  @Input() required: boolean = false;
  @Input() validationMessage: string = '';
  @Input() submitted: boolean = false;

  @Output() onValueChange = new EventEmitter<any>();

  // --- Component State ---
  bsConfig: Partial<BsDatepickerConfig>;

  constructor(
    // Inject NgControl to get access to the form control instance.
    // @Self() ensures we get the control for this component.
    // @Optional() ensures it works even if not in a form.
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

  ngOnInit(): void {
    this.bsConfig.dateInputFormat = this.dateFormat;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dateFormat']) {
      this.bsConfig = {
        ...this.bsConfig,
        dateInputFormat: this.dateFormat
      }
    }
  }

  // --- Event Handling ---
  onPickerChange(newValue: any) {
    this.value = newValue;
    this.onChange(this.value);
    this.onValueChange.emit(this.value);
  }

   public toggleDatepicker(): void {
    if (this.datepicker && !this.isDisabled) {
      this.datepicker.toggle();
    }
  }

  // This is called when the input is blurred
  handleBlur() {
    this.onTouched();
    // After a blur, the directive's internal value is the source of truth.
    // Sync the form model with this value. This handles typed-in dates.
    // This check prevents an unnecessary update if the value hasn't changed.
    if (this.datepicker && this.value !== this.datepicker.bsValue) {
      this.value = this.datepicker.bsValue ? this.datepicker.bsValue : null;
      this.onChange(this.value);
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    this.value = control.value;
    // We use the inherited 'this.value' for validation
    if (this.required && (this.value === null || this.value === undefined)) {
      return { required: true };
    }
    return null;
  }
}
