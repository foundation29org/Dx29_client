import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { SortService} from 'app/shared/services/sort.service';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { EventsService} from 'app/shared/services/events.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-gtp-page',
    templateUrl: './gtp-page.component.html',
    styleUrls: ['./gtp-page.component.scss'],
})

export class GtpPageComponent implements OnInit, OnDestroy{

    @ViewChild('f') gtpRegisterForm: NgForm;
    sending: boolean = false;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
    modalReference: NgbModalRef;
    lang: string = 'en';
    phoneCodes:any=[];
    phoneCodeSelected:String="";
    seleccionado: string = null;
    private subscription: Subscription = new Subscription();

    constructor(private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, public toastr: ToastrService, private eventsService: EventsService, private sortService: SortService) {
      this.loadPhoneCodes();
    }

    ngOnInit(){
      this.lang = sessionStorage.getItem('lang');
      this.eventsService.on('changelang', function(lang) {
        this.lang=lang;
      }.bind(this));
    }


    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    loadPhoneCodes(){
    //cargar la lista mundial de ciudades
    this.subscription.add( this.http.get('assets/jsons/phone_codes.json')
    .subscribe( (res : any) => {
      for (var i=0;i<res.length;i++){
        var phoneCodeList=res[i].phone_code.split(/["]/g)
        var phoneCode="+"+phoneCodeList[1]
        var countryNameCode="";
        var countryNameCodeList=[];
        countryNameCodeList=res[i].name.split(/["]/g)
        countryNameCode=countryNameCodeList[1]
        this.phoneCodes.push({countryCode:countryNameCode,countryPhoneCode:phoneCode})
      }
      this.phoneCodes.sort(this.sortService.GetSortOrder("countryCode"));

    }));

  }

  codePhoneChange(event, value){
      this.phoneCodeSelected=value.countryCode+ ' '+ value.countryPhoneCode;
    }

    submitInvalidForm() {
      if (!this.gtpRegisterForm) { return; }
      const base = this.gtpRegisterForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    keyPress(event: any) {
       const pattern = /[0-9\+\-\(\)\ \ ]/;

       let inputChar = String.fromCharCode(event.charCode);
       if (event.keyCode != 8 && !pattern.test(inputChar)) {
         event.preventDefault();
       }
     }

    onSubmit(){
        this.sending = true;
        //this.gtpRegisterForm.value.email = (this.gtpRegisterForm.value.email).toLowerCase();
        //this.gtpRegisterForm.value.lang=this.translate.store.currentLang;
        this.gtpRegisterForm.value.phone = this.phoneCodeSelected+ ' ' + this.gtpRegisterForm.value.phone;
        delete this.gtpRegisterForm.value.countryselectedPhoneCode;

        var params:any = {}
        params.form= this.gtpRegisterForm.value;
        params.programName = "Genetic Program 1";
        params.lang = sessionStorage.getItem('lang');
        this.subscription.add( this.http.post(environment.api+'/api/programs/externalRequest/', params)
        .subscribe( (res : any) => {
          this.sending = false;
          if(res.message=='You are already registered in the program with that email.'){
            this.toastr.error('', this.translate.instant("gtp.formMsgAlreadyRegistered"));
          }else{
            this.toastr.success('', this.translate.instant("gtp.formMsgRegistered"));
          }

          this.gtpRegisterForm.reset();
         }, (err) => {
           console.log(err);
           this.sending = false;
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));
    }

    showPanelMoreInfo(content){
      let ngbModalOptions: NgbModalOptions = {
            backdrop : 'static',
            keyboard : false,
            windowClass: 'ModalClass-sm',// xl, lg, sm
            centered: true
      };
      this.modalReference = this.modalService.open(content, ngbModalOptions);
    }

}
