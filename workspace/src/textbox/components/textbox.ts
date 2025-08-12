// libs/textbox/src/lib/textbox.component.ts
import { Component, EventEmitter, forwardRef, Input, OnChanges, OnInit, Optional, Output, Self, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, NgControl, ValidationErrors, ValidatorFn } from '@angular/forms'; // Import FormsModule for ngModel
import { ControlValueAccessorBase } from '@suriya_40/sketch/utils';

export type AllowedChars = 'alpha' | 'alpha-dot' | 'numeric' | 'alphanumeric' | 'alphanumeric-hyphen' | 'alphanumeric-slash';

/**
 * A flexible textbox component that supports various input validations and formatting options.
 * @example
 * <textbox [label]="'Name'" [(ngModel)]="name"></textbox>
 */
@Component({
  selector: 'textbox', // Your component's selector
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textbox.html',
  styleUrls: ['./textbox.scss'],
})
export class Textbox extends ControlValueAccessorBase implements OnInit, OnChanges {
  /**
   * The label to display for the textbox.
   */
  @Input() label: string = '';

  /**
   * Orientation of the label: 'horizontal' or 'vertical'.
   * @default 'vertical'
   */
  @Input() labelOrientation: 'horizontal' | 'vertical' = 'vertical';

  /**
   * Placeholder text for the input field.
   * @default 'Enter value'
   */
  @Input() placeholder: string = 'Enter value';

  /**
   * Whether the field is required.
   * @default false
   */
  @Input() required: boolean = false;

  /**
   * Minimum length of the input value.
   * @default null
   */
  @Input() minLength: number | null = null;

  /**
   * Maximum length of the input value.
   * @default null
   */
  @Input() maxLength: number | null = null;

  /**
   * Maximum number of decimal digits allowed (if applicable).
   * @default null
   */
  @Input({ transform: (value: string | number) => (value === null || value === undefined) ? null : parseInt(String(value), 10) })
  @Input() digit: number | null = null;

  /**
   * Restrict allowed characters in the input. E.g., 'alpha', 'numeric', etc.
   */
  @Input() allowedChars?: AllowedChars = undefined;

  /**
   * Enable email validation for the input.
   * @default false
   */
  @Input() isEmail: boolean = false;

  /**
   * Optional help text to display below the input.
   * @default ''
   */
  @Input() helpText: string = '';

  /**
   * Show character count indicator.
   * @default true
   */
  @Input() showCount: boolean = true;

  /**
   * Whether the form has been submitted (for validation display).
   * @default false
   */
  @Input() submitted: boolean = false;

  @Output() onValueChange = new EventEmitter<string | null>();

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
    this.updateValidators();
  }

  /**
   * @ignore
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.updateValidators();
  }

  /**
   * @ignore
   */
  onBlur(): void {
    this.onTouched();
  }

  /**
   * @ignore
   */
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.onTouched();
    this.onValueChange.emit(this.value);
  }

  /**
   * @ignore
   */
  private updateValidators(): void {
    if (!this.ngControl || !this.ngControl.control) {
      return;
    }

    const validators: ValidatorFn[] = [this.commonValidator()];

    if (this.isEmail) {
      validators.push(this.emailValidator());
    }
    if (this.digit !== null) {
      validators.push(this.decimalValidator());
    }

    this.ngControl.control.setValidators(validators);
    this.ngControl.control.updateValueAndValidity();
  }

  /**
   * @ignore
   */
  private commonValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors: ValidationErrors = {};
      const value = control.value;

      if (this.required && (value === null || value === undefined || String(value).trim() === '')) {
        errors['required'] = true;
      }
      if (this.minLength && value && String(value).length < this.minLength) {
        errors['minlength'] = true;
      }
      if (this.maxLength && value && String(value).length > this.maxLength) {
        errors['maxlength'] = true;
      }
      if (typeof value === 'string' && value.length > 0 && value.startsWith(' ')) {
        errors['whitespace'] = true;
      }

      const patterns: Record<AllowedChars, RegExp> = {
        'alpha': /^[a-zA-Z]*$/,
        'alpha-dot': /^[a-zA-Z.]*$/,
        'numeric': /^[0-9]*$/,
        'alphanumeric': /^[a-zA-Z0-9]*$/,
        'alphanumeric-hyphen': /^[a-zA-Z0-9-]*$/,
        'alphanumeric-slash': /^[a-zA-Z0-9/]*$/,
      };

      if (this.allowedChars && patterns[this.allowedChars] && !patterns[this.allowedChars].test(value)) {
        errors['notAllowedCharacter'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    }
  }

  /**
   * @ignore
   */
  private emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(control.value)) {
        return { email: true };
      }
      return null;
    }
  }

  /**
   * @ignore
   */
  private decimalValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const stringValue = String(control.value);
      if (!/^-?\d*\.?\d*$/.test(stringValue)) {
        return { number: true };
      }
      if (this.digit !== null && stringValue.includes('.')) {
        const decimalPart = stringValue.split('.')[1];
        if (decimalPart && decimalPart.length > this.digit) {
          return { maxdigits: true };
        }
      }
      return null;
    }
  }

  /**
   * @ignore
   */
  get firstErrorMessage(): string | null {
    if (!this.ngControl?.errors) {
      return null;
    }
    const errors = this.ngControl.errors;

    // Define the order of priority for errors
    if (errors['whitespace']) {
      return 'Leading whitespace is not allowed.';
    }
    if (errors['number']) {
      return 'Please enter a valid number.';
    }
    if (errors['maxdigits']) {
      return `Maximum ${this.digit} decimal places allowed.`;
    }
    if (errors['required']) {
      return `${this.label || 'This field'} is required.`;
    }
    if (errors['minlength']) {
      return `Minimum length is ${this.minLength}.`;
    }
    if (errors['maxlength']) {
      return `Maximum length is ${this.maxLength}.`;
    }
    if (errors['email']) {
      return 'Please enter a valid email address.';
    }
    if (errors['notAllowedCharacter']) {
      return 'Entered character not allowed.';
    }

    // Fallback for any other error
    const firstKey = Object.keys(errors)[0];
    return `Validation error: ${firstKey}`;
  }
}
