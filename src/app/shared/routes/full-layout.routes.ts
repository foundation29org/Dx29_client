import { Routes, RouterModule } from '@angular/router';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

//Route for content layout with sidebar, navbar and footer
export const Full_ROUTES: Routes = [
  {
    path: 'superadmin',
    loadChildren: () => import('../../superadmin/superadmin.module').then(m => m.SuperAdminModule),
    canActivate: [RoleGuard],
    data: { expectedRole: ['SuperAdmin'] }
  },{
    path: 'admin',
    loadChildren: () => import('../../admin/admin.module').then(m => m.AdminModule),
    canActivate: [RoleGuard],
    data: { expectedRole: ['Admin'] }
  },
  {
    path: 'patient',
    loadChildren: () => import('../../user/user.module').then(m => m.UserModule),
    canActivate: [RoleGuard],
    data: { expectedRole: ['User'] }
  },
  {
    path: 'clinical',
    loadChildren: () => import('../../clinical/clinical.module').then(m => m.ClinicalModule),
    canActivate: [RoleGuard],
    data: { expectedRole: ['Clinical', 'Lab'] }
  },
  {
    path: 'pages',
    loadChildren: () => import('../../pages/full-pages/full-pages.module').then(m => m.FullPagesModule)
  }
];
