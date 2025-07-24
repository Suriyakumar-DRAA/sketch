import { ControlValueAccessor } from "@angular/forms";

export class ControlValueAccessorBase implements ControlValueAccessor {
  value: string | Date | [Date, Date] | null = null;
  isDisabled: boolean = false;

  onChange = (_: any) => { };
  onTouched = () => { };

  writeValue(obj: any): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}