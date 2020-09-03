import { Component, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { sha512 } from "js-sha512";
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-new-password-page',
    templateUrl: './new-password-page.component.html',
    styleUrls: ['./new-password-page.component.scss']
})

export class NewPasswordPageComponent implements OnDestroy{
    @ViewChild('f') newPasswordForm: NgForm;
    sending: boolean = false;
    showlink:boolean = false;
    changed: boolean = false;
    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public translate: TranslateService) { }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    submitInvalidForm() {
      if (!this.newPasswordForm) { return; }
      const base = this.newPasswordForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched();
        }
      }
    }

    // On submit click, reset form fields
    onSubmit() {
      this.sending = true;
      this.showlink = false;
      //var param = router.parseUrl(router.url).queryParams["email","key"];
      var param = this.router.parseUrl(this.router.url).queryParams;
      if(param.email && param.key){
        this.newPasswordForm.value.password=sha512(this.newPasswordForm.value.password);
        var paramssend = { email: param.email, password: this.newPasswordForm.value.password, randomCodeRecoverPass: param.key};

        this.subscription.add( this.http.post(environment.api+'/api/updatepass',paramssend)
        .subscribe( (res : any) => {
          Swal.fire('', this.translate.instant("recoverpass.Password changed"), "success");
          this.changed = true;
          this.sending = false;
          this.newPasswordForm.reset();
         }, (err) => {
           //errores de fallos
           var errormsg=err.error.message;
           if(errormsg == 'invalid link'){
             Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("recoverpass.invalidLink"), "error");
           }else if(errormsg == 'link expired'){
             Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("recoverpass.expiredLink"), "error");
             this.showlink = true;
           }else{
             Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");
           }
           this.sending = false;
           this.newPasswordForm.reset();
         }));

      }
    }

    // On Forgot password link click
    onForgotPassword() {
        this.router.navigate(['/forgotpassword']);
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
