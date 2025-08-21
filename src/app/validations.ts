import { AbstractControl, ValidationErrors } from "@angular/forms";

export class Validations {

  static policyNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) { return null; }
    const pattern = /^LP/.test(value) && value.length >= 8 && value.length <= 12 && /^[0-9]+$/.test(value.slice(2));
    
    return pattern ? null : { invalidPolicyNumber: true };
  }
}