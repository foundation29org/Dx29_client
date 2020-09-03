import { Component, OnInit, ElementRef, Renderer2, ViewChild, OnDestroy } from '@angular/core';
import { LayoutService } from '../services/layout.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-sidebar',
  templateUrl: './notification-sidebar.component.html',
  styleUrls: ['./notification-sidebar.component.scss']
})
export class NotificationSidebarComponent implements OnInit, OnDestroy {

  layoutSub: Subscription;
  isOpen = false;

  @ViewChild('sidebar') sidebar: ElementRef;

  ngOnInit() {

  }

  constructor(private elRef: ElementRef,
    private renderer: Renderer2,
    private layoutService: LayoutService) {

    this.layoutSub = layoutService.notiSidebarChangeEmitted$.subscribe(
      value => {
        if (this.isOpen) {
          this.renderer.removeClass(this.sidebar.nativeElement, 'open');
          this.isOpen = false;
        }
        else {
          this.renderer.addClass(this.sidebar.nativeElement, 'open');
          this.isOpen = true;
        }
      });
  }

  ngOnDestroy() {
    if(this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }



  onClose() {
    this.renderer.removeClass(this.sidebar.nativeElement, 'open');
    this.isOpen = false;
  }

}
