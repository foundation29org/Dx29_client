import { Component, HostBinding, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { sha512 } from "js-sha512";
import { AuthService } from 'app/shared/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-footer-land',
    templateUrl: './footer-land.component.html',
    styleUrls: ['./footer-land.component.scss']
})

export class FooterLandComponent implements OnDestroy{
    //Variables
    currentDate : Date = new Date();

    @ViewChild('f') mainForm: NgForm;
    sending: boolean = false;
    email: string;
    role: string = 'User';
    subrole: string = 'NoDiagnosis';
    isGTPPage: boolean = false;

    private subscription: Subscription = new Subscription();


    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private authService: AuthService, public translate: TranslateService, public toastr: ToastrService) {
      this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(
        event => {
          var tempUrl = (event.url).toString();
          if(tempUrl.indexOf('/gtp')!=-1){
            this.isGTPPage = true;
          }else{
            this.isGTPPage = false;
          }
        }
      );

    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    submitInvalidForm() {
      if (!this.mainForm) { return; }
      const base = this.mainForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    sendMsg(){
        this.sending = true;

        //this.mainForm.value.email = (this.mainForm.value.email).toLowerCase();
        //this.mainForm.value.lang=this.translate.store.currentLang;

        var params = this.mainForm.value;
        this.subscription.add( this.http.post(environment.api+'/api/homesupport/', params)
        .subscribe( (res : any) => {
          this.sending = false;
          this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
          this.mainForm.reset();
         }, (err) => {
           console.log(err);
           this.sending = false;
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));
    }

   resizeTextArea(){

    setTimeout(() =>
    {
      $('.autoajustable').each(function () {
        document.getElementById("textarea1").setAttribute( "style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden; width: 100%;");

     }).on('input', function () {
         this.style.height = 'auto';
         this.style.height = (this.scrollHeight) + 'px';
     });

    },
    100);
  }

}
