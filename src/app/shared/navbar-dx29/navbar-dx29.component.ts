import { Component, Output, EventEmitter, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { Subscription } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { LangService } from 'app/shared/services/lang.service';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';

@Component({
    selector: 'app-navbar-dx29',
    templateUrl: './navbar-dx29.component.html',
    styleUrls: ['./navbar-dx29.component.scss'],
    providers: [LangService]
})

@Injectable()
export class NavbarD29Component implements OnInit, AfterViewInit, OnDestroy{
    currentLang = 'en';
    toggleClass = 'ft-maximize';
    placement = "bottom-right";
    public isCollapsed = true;
    layoutSub: Subscription;
    @Output()
    toggleHideSidebar = new EventEmitter<Object>();

    public config: any = {};
    langs: any;
    isHomePage: boolean = false;
    isClinicianPage: boolean = false;
    isPatientPage: boolean = false;
    isUndiagnosedPatientPage: boolean = false;
    isEdHubPage: boolean = false;
    isAttributionsPage: boolean = false;
    role: string = 'Clinical';
    subrole: string = 'null';
    private subscription: Subscription = new Subscription();

    constructor(public translate: TranslateService, private layoutService: LayoutService, private configService:ConfigService, private langService:LangService, private router: Router, private route: ActivatedRoute, private inj: Injector) {
      this.translate.use('en');
      this.loadLanguages();

      /*this.subscription.add( this.route.params.subscribe(params => {
        console.log(params);
        if(params['role']!=undefined){
          this.role = params['role'];
        }
        if(params['subrole']!=undefined){
          this.subrole = params['subrole'];
        }
      }));*/


      this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(

        event => {
          var tempUrl = (event.url).toString();
          console.log(tempUrl);
          if(tempUrl.indexOf('/.')!=-1){
            this.isHomePage = true;
            this.isClinicianPage = false;
            this.isPatientPage = false;
            this.isEdHubPage = false;
            this.isAttributionsPage = false;
            this.isUndiagnosedPatientPage = false;
            this.role = 'Clinical';
            this.subrole = 'null';
          }else if(tempUrl.indexOf('/clinician')!=-1){
            this.isHomePage = false;
            this.isClinicianPage = true;
            this.isPatientPage = false;
            this.isEdHubPage = false;
            this.isAttributionsPage = false;
            this.isUndiagnosedPatientPage = false;
            this.role = 'Clinical';
            this.subrole = 'null';
          }else if(tempUrl.indexOf('/diagnosedpatient')!=-1){
            this.isHomePage = false;
            this.isPatientPage = true;
            this.isClinicianPage = false;
            this.isEdHubPage = false;
            this.isAttributionsPage = false;
            this.isUndiagnosedPatientPage = false;
            this.role = 'User';
            this.subrole = 'HaveDiagnosis';
          }else if(tempUrl.indexOf('/undiagnosedpatient')!=-1){
            this.isHomePage = false;
            this.isPatientPage = false;
            this.isClinicianPage = false;
            this.isEdHubPage = false;
            this.isAttributionsPage = false;
            this.isUndiagnosedPatientPage = true;
            this.role = 'User';
            this.subrole = 'NoDiagnosis';
          }else if(tempUrl.indexOf('/education')!=-1){
            this.isHomePage = false;
            this.isPatientPage = false;
            this.isClinicianPage = false;
            this.isEdHubPage = true;
            this.isAttributionsPage = false;
            this.isUndiagnosedPatientPage = false;
          }else if(tempUrl.indexOf('/attributions')!=-1){
            this.isHomePage = false;
            this.isPatientPage = false;
            this.isClinicianPage = false;
            this.isEdHubPage = false;
            this.isAttributionsPage = true;
            this.isUndiagnosedPatientPage = false;
          }else{
            this.isHomePage = false;
            this.isClinicianPage = false;
            this.isPatientPage = false;
            this.isEdHubPage = false;
            this.isAttributionsPage = false;
            this.isUndiagnosedPatientPage = false;
          }

          if(tempUrl.indexOf('patient')!=-1){
            if(tempUrl.indexOf('role=User')!=-1){///patient;role=User;subrole=HaveDiagnosis
              this.role = 'User'
            }
            if(tempUrl.indexOf('subrole=HaveDiagnosis')!=-1){///patient;role=User;subrole=HaveDiagnosis
              this.subrole = 'HaveDiagnosis'
            }
          }
        }
      );
      console.log(this.router.url);
      if((this.router.url).indexOf('/.')!=-1){
            this.isHomePage = true;
            this.isClinicianPage = false;
            this.isPatientPage = false;
            this.isEdHubPage = false;
            this.isAttributionsPage = false;
            this.isUndiagnosedPatientPage = false;
            this.role = 'Clinical';
            this.subrole = 'null';
      }else if((this.router.url).indexOf('/clinician')!=-1){
            this.isHomePage = false;
            this.isClinicianPage = true;
            this.isPatientPage = false;
            this.isEdHubPage = false;
            this.isAttributionsPage = false;
            this.isUndiagnosedPatientPage = false;
            this.role = 'Clinical';
            this.subrole = 'null';
      }else if((this.router.url).indexOf('/diagnosedpatient')!=-1){
          this.isHomePage = false;
          this.isPatientPage = true;
          this.isClinicianPage = false;
          this.isEdHubPage = false;
          this.isAttributionsPage = false;
          this.isUndiagnosedPatientPage = false;
          this.role = 'User';
          this.subrole = 'HaveDiagnosis';
      }else if((this.router.url).indexOf('/undiagnosedpatient')!=-1){
          this.isHomePage = false;
          this.isPatientPage = false;
          this.isClinicianPage = false;
          this.isEdHubPage = false;
          this.isAttributionsPage = false;
          this.isUndiagnosedPatientPage = true;
          this.role = 'User';
          this.subrole = 'NoDiagnosis';
      }else if((this.router.url).indexOf('/education')!=-1){
          this.isHomePage = false;
          this.isPatientPage = false;
          this.isClinicianPage = false;
          this.isEdHubPage = true;
          this.isAttributionsPage = false;
          this.isUndiagnosedPatientPage = false;
      }else if((this.router.url).indexOf('/attributions')!=-1){
          this.isHomePage = false;
          this.isPatientPage = false;
          this.isClinicianPage = false;
          this.isEdHubPage = false;
          this.isAttributionsPage = true;
          this.isUndiagnosedPatientPage = false;
      }else{
        this.isHomePage = false;
        this.isClinicianPage = false;
        this.isPatientPage = false;
        this.isEdHubPage = false;
        this.isAttributionsPage = false;
        this.isUndiagnosedPatientPage = false;
      }

      this.layoutSub = layoutService.changeEmitted$.subscribe(
      direction => {
        const dir = direction.direction;
        if (dir === "rtl") {
          this.placement = "bottom-left";
        } else if (dir === "ltr") {
          this.placement = "bottom-right";
        }
      });
    }

    ngOnInit() {
      this.config = this.configService.templateConf;
    }

    ngAfterViewInit() {
      if(this.config.layout.dir) {
        setTimeout(() => {
          const dir = this.config.layout.dir;
          if (dir === "rtl") {
            this.placement = "bottom-left";
          } else if (dir === "ltr") {
            this.placement = "bottom-right";
          }
        }, 0);

      }
    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
      if (this.layoutSub) {
        this.layoutSub.unsubscribe();
      }
    }

    ToggleClass() {
      if (this.toggleClass === "ft-maximize") {
        this.toggleClass = "ft-minimize";
      } else {
        this.toggleClass = "ft-maximize";
      }
    }

    toggleNotificationSidebar() {
      this.layoutService.emitNotiSidebarChange(true);
    }

    toggleSidebar() {
      const appSidebar = document.getElementsByClassName("app-sidebar")[0];
      if (appSidebar.classList.contains("hide-sidebar")) {
        this.toggleHideSidebar.emit(false);
      } else {
        this.toggleHideSidebar.emit(true);
      }
    }

    loadLanguages() {
        this.subscription.add( this.langService.getLangs()
        .subscribe( (res : any) => {
          console.log(res);
          this.langs=res;
          if(sessionStorage.getItem('lang')){
            this.translate.use(sessionStorage.getItem('lang'));
            this.searchLangName(sessionStorage.getItem('lang'));
          }else{
            const browserLang: string = this.translate.getBrowserLang();
            var foundlang = false;
            for(let lang of this.langs) {
              if(browserLang.match(lang.code)){
                this.translate.use(lang.code);
                foundlang = true;
                sessionStorage.setItem('lang', this.translate.store.currentLang);
                this.searchLangName(lang.name);
              }
            }
          }
          sessionStorage.setItem('lang', this.translate.store.currentLang);
         }, (err) => {
           console.log(err);
         }));
    }

    searchLangName(code: string) {
      for(let lang of this.langs) {
        var actualLang = sessionStorage.getItem('lang');
        if(actualLang == lang.code){
          this.currentLang = lang.name;
        }
      }
    }

    ChangeLanguage(language: string) {
        this.translate.use(language);
        sessionStorage.setItem('lang', language);
        this.searchLangName(language);
        var eventsLang = this.inj.get(EventsService);
        eventsLang.broadcast('changelang', language);
    }


}
