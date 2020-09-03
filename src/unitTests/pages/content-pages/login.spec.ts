import { async, ComponentFixture, TestBed, inject, fakeAsync, tick} from '@angular/core/testing';

import { LoginPageComponent } from '../../../../src/app/pages/content-pages/login/login-page.component';
import { TranslateService } from '@ngx-translate/core';
import { PatientService } from 'app/shared/services/patient.service';
import { TranslateModule } from "@ngx-translate/core";
import { FormsModule } from '@angular/forms';
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RouterModule, Routes } from '@angular/router';
import { Router, RouterOutlet,ActivatedRoute } from "@angular/router";
import { RouterTestingModule } from '@angular/router/testing';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { TokenService } from 'app/shared/auth/token.service';


//TEST....
describe('Unit test: LoginComponent', () => {
    let component: LoginPageComponent;
    let fixture: ComponentFixture<LoginPageComponent>;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports:[FormsModule,TranslateModule.forRoot(),HttpClientModule,ToastrModule.forRoot(),RouterTestingModule],
            declarations: [LoginPageComponent],
            providers:[PatientService,AuthService,AuthGuard,TokenService]
        })
        .compileComponents();
        router = TestBed.get(Router);
        spyOn(router,'navigate')
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LoginPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    //CHECK COMPONENT CREATE
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    
    // CHECK VARIABLES
    /*it('Variable sending false',()=>{
        expect(component.sending).toBeFalsy();
    })
    it('Variable isBlockedAccount false',()=>{
        expect(component.isBlockedAccount).toBeFalsy();
    })
    it('Variable isLoginFailed false',()=>{
        expect(component.isLoginFailed).toBeFalsy();
    })
    it('Variable errorAccountActivated false',()=>{
        expect(component.errorAccountActivated).toBeFalsy();
    })
    it('Variable emailResent false',()=>{
        expect(component.emailResent).toBeFalsy();
    })
    it('Variable supportContacted false',()=>{
        expect(component.supportContacted).toBeFalsy();
    })
    /*it('Variable isAccountActivated false',()=>{
        expect(component.isAccountActivated).toBeFalsy();
    })
    it('Variable isActivationPending false',()=>{
        expect(component.isActivationPending).toBeFalsy();
    })
    it('Variable isBlocked false',()=>{
        expect(component.isBlocked).toBeFalsy();
    })
    it('Variable email to be undefined',()=>{
        expect(component.email).toBeUndefined();
    })
    it('Variable userEmail to be undefined',()=>{
        expect(component.userEmail).toBeUndefined();
    })
    it('Variable patient to be undefined',()=>{
        expect(component.patient).toBeUndefined();
    })*/

    // CHECK FUNCTIONS
    //Check onsubmit
    it('On submit',()=>{
        component.loginForm.value.email="marta@dx29.dev"
        component.loginForm.value.password="mmmmmmmm"
        component.onSubmit();
        expect(component.authService.getCurrentPatient()).toBeDefined();
    })
    /*it('Launch demo',()=>{
        component.launchDemo();
        expect(component.authService.getCurrentPatient()).toBeDefined();
    })*/
    it('Forgot password',(()=>{
        component.onForgotPassword();
        expect(router.navigate).toHaveBeenCalledWith(['/forgotpassword']);
    }))
    it('onRegister',(()=>{
        component.onRegister();
        expect(router.navigate).toHaveBeenCalledWith(['/register']);
    }))
});