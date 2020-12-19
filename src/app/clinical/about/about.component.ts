import { Component, OnDestroy, ElementRef } from '@angular/core';
import { HttpClient } from "@angular/common/http";
//import { Object } from 'core-js/library/web/timers';
import { TranslateService } from '@ngx-translate/core';
import { FAQ } from 'app/shared/models/faq.model';
import { LangService } from 'app/shared/services/lang.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';
import * as marked from 'marked';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnDestroy{

  private subscription: Subscription = new Subscription();
  activeTittleMenu: string = 'FlujoTrabajo';
  msgActiveTittleMenu: string = '';
  tittleFlujoTrabajo: string = '';
  tittleResumenHerramientas: string = '';

  constructor(private translate : TranslateService, private authService: AuthService, private elRef: ElementRef) {

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }



  SetActive(event, panelId: string) {
    var hElement: HTMLElement = this.elRef.nativeElement;
    //now you can simply get your elements with their class name
    var allAnchors = hElement.getElementsByClassName('list-group-item');
    //do something with selected elements
    [].forEach.call(allAnchors, function (item: HTMLElement) {
      item.setAttribute('class', 'list-group-item no-border');
    });
    //set active class for selected item
    event.currentTarget.setAttribute('class', 'list-group-item bg-blue-grey bg-lighten-5 border-right-primary border-right-2');


    if (panelId === 'panelFlujoTrabajo') {
      this.activeTittleMenu = "FlujoTrabajo";
      this.msgActiveTittleMenu = this.tittleFlujoTrabajo;
    }else if (panelId === 'panelResumenHerramientas') {
      this.activeTittleMenu = "ResumenHerramientas";
      this.msgActiveTittleMenu = this.tittleResumenHerramientas;
    }



    $('.content-overlay').removeClass('show');
    $('.chat-app-sidebar-toggle').removeClass('ft-x').addClass('ft-align-justify');
    $('.chat-sidebar').removeClass('d-block d-sm-block').addClass('d-none d-sm-none');

  }

  toggleMenu(){
    if($('.chat-app-sidebar-toggle').hasClass('ft-align-justify')){
      $('.chat-app-sidebar-toggle').removeClass('ft-align-justify').addClass('ft-x');
      $('.chat-sidebar').removeClass('d-none d-sm-none').addClass('d-block d-sm-block');
      $('.content-overlay').addClass('show');
    }else{
      $('.content-overlay').removeClass('show');
      $('.chat-app-sidebar-toggle').removeClass('ft-x').addClass('ft-align-justify');
      $('.chat-sidebar').removeClass('d-block d-sm-block').addClass('d-none d-sm-none');
    }
  }


}
