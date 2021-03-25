import { Directive, forwardRef, Attribute} from "@angular/core";
import { Validator, AbstractControl, NG_VALIDATORS} from "@angular/forms";

@Directive({
  selector: '[validatePassword]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => PasswordValidator), multi: true}
  ]
})

export class PasswordValidator implements Validator {
  constructor (
    @Attribute('validatePassword')
    public invalidPassword: boolean
  ) {}

  validate(ctrl: AbstractControl): {[key: string]: any} {
    let password = ctrl.value;

    let hasLower = false;
    let hasUpper = false;
    let hasNum = false;
    let hasSpecial = false;

    const lowercaseRegex = new RegExp("(?=.*[a-z])");// has at least one lower case letter
    if (lowercaseRegex.test(password)) {
      hasLower = true;
    }

    const uppercaseRegex = new RegExp("(?=.*[A-Z])"); //has at least one upper case letter
    if (uppercaseRegex.test(password)) {
      hasUpper = true;
    }

    const numRegex = new RegExp("(?=.*\\d)"); // has at least one number
    if (numRegex.test(password)) {
      hasNum = true;
    }

    const specialcharRegex = new RegExp("[!@#$%^&*(),.?\":{}|<>]");
    if (specialcharRegex.test(password)) {
      hasSpecial = true;
    }

    let counter = 0;
    let checks = [hasLower, hasUpper, hasNum, hasSpecial];
    for (let i = 0; i < checks.length; i++) {
      if (checks[i]) {
        counter += 1;
      }
    }

    if (counter < 4) {
      return { invalidPassword: true }
    } else {
      return null;
    }



  }

}
