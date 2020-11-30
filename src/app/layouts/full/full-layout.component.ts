import { Component, OnInit, ElementRef, Inject, Renderer2, AfterViewInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from 'app/shared/services/config.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';

@Component({
    selector: 'app-full-layout',
    templateUrl: './full-layout.component.html',
    styleUrls: ['./full-layout.component.scss']
})

@Injectable()
export class FullLayoutComponent implements OnInit, AfterViewInit {
    @ViewChild('sidebarBgImage') sidebarBgImage: ElementRef;
    @ViewChild('appSidebar') appSidebar: ElementRef;
    @ViewChild('wrapper') wrapper: ElementRef;

    options = {
        direction: 'ltr',
        bgColor: 'black',
        bgImage: 'assets/img/sidebar-bg/01.jpg'
    };
    hideSidebar: boolean;
    iscollapsed = false;
    isSidebar_sm = false;
    isSidebar_lg = false;
    bgColor = 'black';
    bgImage = 'assets/img/sidebar-bg/01.jpg';

    public config: any = {};

    isIeOrEdge = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) || /Edge/.test(navigator.userAgent);
    role: string;
    isApp: boolean = false;
    actualStep: string = "0.0";
    maxStep: string = "0.0";
    isHomePage: boolean = false;
    eventsService: any = null;

    constructor(private elementRef: ElementRef, private configService: ConfigService, @Inject(DOCUMENT) private document: Document, private renderer: Renderer2, private authService: AuthService, private eventsService: EventsService,  private router: Router, private inj: Injector) {
      this.eventsService = this.inj.get(EventsService);
          this.isApp = this.document.URL.indexOf( 'http://' ) === -1 && this.document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
          this.role = this.authService.getRole();

          this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(
            event => {
              var tempUrl= (event.url).toString().split('?');
              var tempUrl1 = (tempUrl[0]).toString();
              if(tempUrl1.indexOf('/dashboard')!=-1){
                this.isHomePage = true;
              }else{
                this.isHomePage = false;
              }

            }
          );
    }

    ngOnInit() {
      this.config = this.configService.templateConf;
      this.bgColor = this.config.layout.sidebar.backgroundColor;

      if (!this.config.layout.sidebar.backgroundImage) {
        this.bgImage = '';
      }
      else {
        this.bgImage = this.config.layout.sidebar.backgroundImageURL;
      }

      if (this.config.layout.variant === "Transparent") {
        if(this.config.layout.sidebar.backgroundColor.toString().trim() === '') {
          this.bgColor = 'bg-glass-1';
        }
      }
      else {
        if(this.config.layout.sidebar.backgroundColor.toString().trim() === '') {
          this.bgColor = 'black';
        }
      }

      setTimeout(() => {
        if (this.config.layout.sidebar.size === 'sidebar-lg') {
          this.isSidebar_sm = false;
          this.isSidebar_lg = true;
        }
        else if (this.config.layout.sidebar.size === 'sidebar-sm') {
          this.isSidebar_sm = true;
          this.isSidebar_lg = false;
        }
        else {
          this.isSidebar_sm = false;
          this.isSidebar_lg = false;
        }
        this.iscollapsed = this.config.layout.sidebar.collapsed;
      }, 0);

      this.eventsService.on('actualStep', function(actualStep) {
        this.actualStep= actualStep;
        console.log(this.actualStep);
      }.bind(this));

      this.eventsService.on('maxStep', function(maxStep) {
        this.maxStep= maxStep;
        console.log(this.maxStep);
      }.bind(this));

    }

    ngAfterViewInit() {
      setTimeout(() => {
        if (this.config.layout.dir) {
          this.options.direction = this.config.layout.dir;
        }


        if (this.config.layout.variant === "Dark") {
          this.renderer.addClass(this.document.body, 'layout-dark');
        }
        else if (this.config.layout.variant === "Transparent") {
          this.renderer.addClass(this.document.body, 'layout-dark');
          this.renderer.addClass(this.document.body, 'layout-transparent');
          if (this.config.layout.sidebar.backgroundColor) {
            this.renderer.addClass(this.document.body, this.config.layout.sidebar.backgroundColor);
          }
          else {
            this.renderer.addClass(this.document.body, 'bg-glass-1');
          }
          this.bgColor = 'black';
          this.options.bgColor = 'black';
          this.bgImage = '';
          this.options.bgImage = '';
          this.bgImage = '';
          this.renderer.setAttribute(this.sidebarBgImage.nativeElement, 'style', 'display: none');

        }


      }, 0);

    }


    toggleHideSidebar($event: boolean): void {
        setTimeout(() => {
            this.hideSidebar = $event;
        }, 0);
    }

    getOptions($event): void {
        this.options = $event;
    }

}
