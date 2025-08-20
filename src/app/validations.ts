import { AbstractControl, ValidationErrors } from "@angular/forms";

export class Validations {

  static policyNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }
    const pattern = /^LP/;
    const lengthIsValid = value.length >= 8 && value.length <= 12;
    const nonNumeric = /^[0-9]+$/.test(value.slice(2));

    if (!pattern.test(value) || !lengthIsValid || !nonNumeric) {
      return { invalidPolicyNumber: true };
    }
    return null;
  }
}