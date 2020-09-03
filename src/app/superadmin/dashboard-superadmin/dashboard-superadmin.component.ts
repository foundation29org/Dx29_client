import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
@Component({
    selector: 'app-dashboard-superadmin',
    templateUrl: './dashboard-superadmin.component.html',
    styleUrls: ['./dashboard-superadmin.component.scss']
})

export class DashboardSuperAdminComponent{
  constructor(public translate: TranslateService){}

}
