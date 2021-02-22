import { CanActivate, ActivatedRouteSnapshot, Router, ActivatedRoute } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class RoleGuard implements CanActivate {

  constructor(public authService: AuthService, public router: Router, private route: ActivatedRoute,  public toastr: ToastrService, public translate: TranslateService) {}

  canActivate(route: ActivatedRouteSnapshot):boolean {
    const expectedRole = route.data.expectedRole;
    const expectedSubRole = route.data.expectedSubRole;
    if (!this.authService.isAuthenticated() || expectedRole.indexOf(this.authService.getRole()) == -1) {
      this.toastr.error('', this.translate.instant("generics.notpermission"));
      if(this.authService.getRole() == 'SuperAdmin'){
        // is role superadmin
        this.authService.setRedirectUrl('/superadmin/dashboard-superadmin')
      }else if(this.authService.getRole() == 'Clinical'){
        // is role Clinical
        this.authService.setRedirectUrl('/clinical/dashboard/home')
      }else if(this.authService.getRole() == 'Admin'){
        // Admin
        if(this.authService.getSubRole() == 'AdminGTP'){
          // Admin GTP
          this.authService.setRedirectUrl('/admin/dashboard/admingtp')
        }
      }else{

        if(this.authService.getSubRole() != 'HaveDiagnosis'){
          this.authService.setRedirectUrl('/patient/dashboard/nodiagnosis');
        }else{
          this.authService.setRedirectUrl('/patient/dashboard/withdiagnosis');
        }

      }
      this.router.navigate([this.authService.getLoginUrl()]);
      //  this.router.navigate(["/login"]);
        this.authService.logout();
        return false;
    }
    if(expectedSubRole!=undefined){
      if (!this.authService.isAuthenticated() || expectedSubRole.indexOf(this.authService.getSubRole()) == -1) {
        this.toastr.error('', this.translate.instant("generics.notpermission"));

        //De momento solo tenemos subrole en usuarios y admin
        if((this.authService.getSubRole() != 'HaveDiagnosis')&&(this.authService.getSubRole() != 'AdminGTP')){
          this.authService.setRedirectUrl('/patient/dashboard/nodiagnosis');
        }else{
          if(this.authService.getSubRole() != 'AdminGTP'){
            this.authService.setRedirectUrl('/patient/dashboard/withdiagnosis');
          }
          else{
            this.authService.setRedirectUrl('/admin/dashboard/admingtp')
          }
        }
        this.router.navigate([this.authService.getRedirectUrl()]);
        return false;
      }
    }



    return true;
  }
}
