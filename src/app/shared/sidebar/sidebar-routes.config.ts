import { RouteInfo } from './sidebar.metadata';

//Sidebar menu Routes and data
export const ROUTES: RouteInfo[] = [

    {path: '/patient/dashboard/nodiagnosis', title: 'menu.Dashboard', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, isAnchorLink: false, submenu: [] },
];

export const ROUTESHAVEDIAGNOSIS: RouteInfo[] = [

    {path: '/patient/dashboard/withdiagnosis', title: 'menu.Dashboard', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, isAnchorLink: false, submenu: [] },
];

//Sidebar menu Routes and data
export const ROUTESCLINICAL: RouteInfo[] = [

    {path: '/clinical/dashboard/home', title: 'diagnosis.Cases', icon: 'ft-users', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    //{ path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];

//Sidebar menu Routes and data
export const ROUTESSUPERADMIN: RouteInfo[] = [

    {path: '/superadmin/dashboard-superadmin', title: 'menu.Dashboard Super Admin', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/superadmin/langs', title: 'menu.Languages', icon: 'ft-flag', class: '', badge: '', badgeClass: '', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/superadmin/translations', title: 'menu.Translations', icon: 'ft-flag', class: '', badge: '', badgeClass: '', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/superadmin/diagnosis-super-admin', title: 'diagnosis.Diagnosis powered by genes', icon: 'ft-navigation', class: '', badge: '', badgeClass: '', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/superadmin/support', title: 'support.support', icon: 'ft-mail', class: '', badge: '', badgeClass: '', isExternalLink: false, isAnchorLink: false, submenu: [] },
];

export const ROUTESADMINGTP: RouteInfo[] = [
    {path: '/admin/dashboard/admingtp', title: 'menu.Dashboard Super Admin', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
];

//Sidebar menu Routes and data
export const ROUTESHOMEDX: RouteInfo[] = [
    { path: '/.', title: 'Home', icon: 'icon-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/clinician', title: 'homedx.Dx29 for physicians', icon: 'fas fa-diagnoses', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/undiagnosedpatient', title: 'menu.UndiagnosedPatients', icon: 'fas fa-id-card-alt', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/diagnosedpatient', title: 'menu.DiagnosedPatients', icon: 'fas fa-id-card', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/education', title: 'menu.Ed Hub', icon: 'icon-graduation', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: '/attributions', title: 'menu.Attributions', icon: 'icon-badge', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, isAnchorLink: false, submenu: [] },
    { path: 'https://www.foundation29.org/donate/', title: 'homedx.Donate', icon: 'fas fa-donate', class: '', badge: '', badgeClass: '', isExternalLink: true, isAnchorLink: false, submenu: [] },
];
