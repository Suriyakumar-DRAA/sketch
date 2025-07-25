// libs/textbox/src/lib/textbox.component.ts
import { Component, EventEmitter, forwardRef, Input, OnChanges, OnInit, Optional, Output, Self, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, NgControl, ValidationErrors, ValidatorFn } from '@angular/forms'; // Import FormsModule for ngModel
import { ControlValueAccessorBase } from '@suriya_40/sketch/utils';

export type AllowedChars = 'alpha' | 'alpha-dot' | 'numeric' | 'alphanumeric' | 'alphanumeric-hyphen'  | 'alphanumeric-slash';

@Component({
  selector: 'lightning-textbox', // Your component's selector
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textbox.html',
  styleUrls: ['./textbox.scss'],
})
export class TextboxComponent extends ControlValueAccessorBase implements OnInit, OnChanges {
  @Input() label: string = '';
  @Input() labelOrientation: 'horizontal' | 'vertical' = 'vertical';
  @Input() placeholder: string = 'Enter value';
  @Input() required: boolean = false;
  @Input() minLength: number | null = null;
  @Input() maxLength: number | null = null;
  @Input({ transform: (value: string | number) => (value === null || value === undefined) ? null : parseInt(String(value), 10) })
  @Input() digit: number | null = null;
  @Input() allowedChars?: AllowedChars = undefined;
  @Input() isEmail: boolean = false; // For email validation
  @Input() helpText: string = ''; // Optional help text for the input
  @Input() showCount: boolean = true; // Show character count
  @Input() submitted: boolean = false;

  @Output() onValueChange = new EventEmitter<string | null>();

  constructor(@Optional() @Self() public ngControl: NgControl) {
    super();
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.updateValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateValidators();
  }

  onBlur(): void {
    this.onTouched();
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.onTouched();
    this.onValueChange.emit(this.value);
  }

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
