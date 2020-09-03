import { Component, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-forgot-password-page',
    templateUrl: './forgot-password-page.component.html',
    styleUrls: ['./forgot-password-page.component.scss']
})

export class ForgotPasswordPageComponent implements OnDestroy{
    @ViewChild('f') forgotPasswordForm: NgForm;

    sending: boolean = false;
    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public translate: TranslateService) { }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    submitInvalidForm() {
      if (!this.forgotPasswordForm) { return; }
      const base = this.forgotPasswordForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    // On submit click, reset form fields
    onSubmit() {
      this.sending = true;
      this.subscription.add( this.http.post(environment.api+'/api/recoverpass',this.forgotPasswordForm.value)
      .subscribe( (res : any) => {
          this.sending = false;
          this.forgotPasswordForm.reset();
        Swal.fire('', this.translate.instant("recoverpass.Account recovery email sent"), "success");
       }, (err) => {
         this.sending = false;
         this.forgotPasswordForm.reset();
         //errores de fallos
         var errormsg=err.error.message;
         if(errormsg == 'Fail sending email'){
           Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");
         }else if(errormsg == 'account not activated'){
           Swal.fire(this.translate.instant("generics.Warning"),this.translate.instant("login.The account is not activated"), "error");
         }else if(errormsg == 'user not exists'){
           Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("recoverpass.no account"), "error");
         }else{
           Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");
         }
       }));
    }

    // On login link click
    onLogin() {
        this.router.navigate(['/login']);
    }

    // On registration link click
    onRegister() {
        this.router.navigate(['/register']);
    }
}
