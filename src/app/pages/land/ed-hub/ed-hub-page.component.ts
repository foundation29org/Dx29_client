import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-ed-hub-page',
    templateUrl: './ed-hub-page.component.html',
    styleUrls: ['./ed-hub-page.component.scss']
})

export class EdHubPageComponent implements OnInit, OnDestroy{

    urlimg: string = 'assets/img/pages/dna_tests_es.svg';
    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private route: ActivatedRoute, public translate: TranslateService, public toastr: ToastrService) {
      this.subscription.add( this.translate.onLangChange.subscribe((event: { lang: string }) => {
        console.log(event.lang);
        this.urlimg = 'assets/img/pages/dna_tests_'+event.lang+'.svg';
      }));
    }

    ngOnInit() {
      var lang = sessionStorage.getItem('lang')
      this.urlimg = 'assets/img/pages/dna_tests_'+lang+'.svg';
    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }
}
