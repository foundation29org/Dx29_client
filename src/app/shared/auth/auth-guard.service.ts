import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, ActivatedRoute } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import * as decode from 'jwt-decode';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute, public toastr: ToastrService, public translate: TranslateService, private tokenService: TokenService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    this.authService.getEnvironment()

    let url: string = state.url;

    const expectedRole = route.data.expectedRole;

    const expiresAt = this.authService.getExpToken();

    if (this.authService.isAuthenticated()){
      if(this.tokenService.isTokenValid() && (Date.now()/1000) < expiresAt){
         return true;
      }else{
        this.authService.logout();
        this.router.navigate([this.authService.getLoginUrl()]);
        return false
      }
    }else{
      if(expiresAt!=null){
        if((Date.now()/1000) >= expiresAt){
          this.toastr.error('', this.translate.instant("generics.The session has expired"));
        }
      }
      if(expectedRole == undefined){
        this.authService.logout();
        this.router.navigate([this.authService.getLoginUrl()]);
        return false
      }else{
        if(expectedRole!== undefined && this.authService.getRole()!='' && expectedRole.indexOf(this.authService.getRole()) == -1 ){
          this.authService.setRedirectUrl('/login');
        }else{
          this.authService.setRedirectUrl(url);
        }
        this.authService.logout();
        this.router.navigate([this.authService.getLoginUrl()]);
        return false;
      }
    }

  }

  testtoken(){
    const expiresAt = this.authService.getExpToken();
    if (this.authService.isAuthenticated() && (Date.now()/1000) < expiresAt) {
      return true;
    }
    if(expiresAt!=null){
      if((Date.now()/1000) >= expiresAt){
        this.toastr.error('', this.translate.instant("generics.The session has expired"));
      }
    }
    this.authService.logout();
    this.router.navigate([this.authService.getLoginUrl()]);
    return false;
  }

  inactive(){
    Swal.fire({
      icon: 'warning',
      title: '',
      html: this.translate.instant("generics.sessionClosed")
    })
    //this.toastr.error('', this.translate.instant("generics.sessionClosed"));
    this.authService.logout();
    this.router.navigate([this.authService.getLoginUrl()]);
    //location.reload();
  }

  reload(){
    Swal.fire({
        title: this.translate.instant("InfoSystem.titleReload"),
        html: this.translate.instant("InfoSystem.bodyReload"),
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#33658a',
        cancelButtonColor: '#B0B6BB',
        confirmButtonText: 'Ok',
        showLoaderOnConfirm: true,
        allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        location.reload();
      }
    });

    /*Swal.fire({
      icon: 'warning',
      title: this.translate.instant("InfoSystem.titleReload"),
      html: this.translate.instant("InfoSystem.bodyReload")
    })
    //this.toastr.error('', this.translate.instant("generics.sessionClosed"));
    //this.authService.logout();
    //this.router.navigate([this.authService.getLoginUrl()]);
    location.reload();*/
  }

}
