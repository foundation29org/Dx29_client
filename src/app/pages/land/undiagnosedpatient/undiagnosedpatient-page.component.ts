import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { sha512 } from "js-sha512";
import { AuthService } from 'app/shared/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-undiagnosedpatient-page',
    templateUrl: './undiagnosedpatient-page.component.html',
    styleUrls: ['./undiagnosedpatient-page.component.scss']
})

export class UndiagnosedPatientPageComponent implements OnInit, OnDestroy{

    urlCarnet: string = 'assets/img/home/patient/carnet_en.png';
    urlImgShare: string = 'assets/img/home/patient/block2_ilus_2.png';
    role: string = 'User';
    subrole: string = 'NoDiagnosis';

    private subscription: Subscription = new Subscription();
    public apiEnvironment;

    constructor(private router: Router, private route: ActivatedRoute, private authService: AuthService, public translate: TranslateService, public toastr: ToastrService) {
      this.apiEnvironment=environment.api;
      console.log(this.apiEnvironment);
      this.subscription.add( this.translate.onLangChange.subscribe((event: { lang: string }) => {
        console.log(event.lang);
        this.urlCarnet = 'assets/img/home/patient/carnet_'+event.lang+'.png';
      }));
    }

     ngOnInit() {
       var lang = sessionStorage.getItem('lang')
       this.urlCarnet = 'assets/img/home/patient/carnet_'+lang+'.png';

       this.subscription.add( this.route.params.subscribe(params => {
         if(params['role']!=undefined){
           this.role = params['role'];
         }
         if(params['subrole']!=undefined){
           this.subrole = params['subrole'];
         }
       }));
     }

     ngOnDestroy() {
       this.subscription.unsubscribe();
     }

    // On Forgot password link click
    onForgotPassword() {
        this.router.navigate(['/forgotpassword']);
    }
    // On registration link click
    onRegister() {
        this.router.navigate(['/register']);
    }

    copy(text){
      let selBox = document.createElement('textarea');
      selBox.style.position = 'fixed';
      selBox.style.left = '0';
      selBox.style.top = '0';
      selBox.style.opacity = '0';
      selBox.value = text;
      document.body.appendChild(selBox);
      selBox.focus();
      selBox.select();
      document.execCommand('copy');
      document.body.removeChild(selBox);
      this.toastr.success('', this.translate.instant("generics.Copied to the clipboard"));
    }

    copyImg(){
    }
}
