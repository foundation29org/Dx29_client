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
    selector: 'app-permissions-page',
    templateUrl: './permissions-page.component.html',
    styleUrls: ['./permissions-page.component.scss']
})

export class PermissionsPageComponent implements OnDestroy{
    @ViewChild('f') newPasswordForm: NgForm;
    sending: boolean = false;
    showlink:boolean = false;
    changed: boolean = false;
    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public translate: TranslateService) {
      var param = this.router.parseUrl(this.router.url).queryParams;
      if(param.patient && param.email){
        var paramssend = { patient: param.patient, email: param.email, state: param.state, emailorigen: param.emailorigen, patientEmail: param.patientEmail, lang: param.lang };

        this.subscription.add( this.http.post(environment.api+'/api/updatepermissions',paramssend)
        .subscribe( (res : any) => {
          if(res.message == 'Patient not found'){
            Swal.fire('', 'Patient not found', "success");
          }else if(res.message == 'UserId not found'){
            Swal.fire('', 'The user to whom you give permission, no longer exists.', "success");
          }else{
            if(res.message == 'Accepted'){
              Swal.fire('', this.translate.instant("adminGTP.Accepted"), "success");
            }else{
              Swal.fire('', this.translate.instant("adminGTP.Rejected"), "warning");
            }
          }

         }, (err) => {
           //errores de fallos
           Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "error");
         }));
      }
    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }


    // On login link click
    onLogin() {
        this.router.navigate(['/login']);
    }
}
