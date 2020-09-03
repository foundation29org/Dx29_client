import { Component, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { sha512 } from "js-sha512";
import { AuthService } from 'app/shared/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-clinician-page',
    templateUrl: './clinician-page.component.html',
    styleUrls: ['./clinician-page.component.scss']
})

export class ClinicianPageComponent implements OnDestroy{

    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private route: ActivatedRoute, private authService: AuthService, public translate: TranslateService, public toastr: ToastrService) {
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
}
