import { Component, HostBinding, OnInit } from '@angular/core';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { Data } from 'app/shared/services/data.service';

@Component({
    selector: 'app-footerwizard',
    templateUrl: './footer-wizard.component.html',
    styleUrls: ['./footer-wizard.component.scss']
})

@Injectable()
export class FooterWizardComponent implements OnInit{
    //Variables
    currentDate : Date = new Date();
    actualStep: string = "0.0";
    maxStep: string = "0.0";
    showIntroWizard: boolean = true;
    eventsService: any = null;

    constructor(private data: Data, private inj: Injector, private http: HttpClient, private authService: AuthService)
      {
        this.eventsService = this.inj.get(EventsService);
      }


      loadShowIntroWizard(){
        this.http.get(environment.api+'/api/users/showintrowizard/'+this.authService.getIdUser())
          .subscribe( (res : any) => {
            console.log(res);
            this.showIntroWizard = res.showIntroWizard
            this.getActualStep();
          }, (err) => {
            console.log(err);
          });
      }

      getActualStep(){
        if(this.authService.getCurrentPatient().sub!=null){
          this.http.get(environment.api+'/api/case/stepclinic/'+this.authService.getCurrentPatient().sub)
            .subscribe( (res : any) => {
              this.actualStep = res
              if(!this.showIntroWizard && this.actualStep=='0.0'){
                this.actualStep = '1.0';
                this.maxStep = '1.0';
              }else{
                this.actualStep = res;
                this.maxStep = res;
              }
            }, (err) => {
              console.log(err);
            });
        }

      }


    ngOnInit() {

      this.eventsService.on('actualStep', function(actualStep) {
        this.actualStep= actualStep;
        console.log(this.actualStep);
      }.bind(this));

      this.eventsService.on('maxStep', function(maxStep) {
        this.maxStep= maxStep;
        console.log(this.maxStep);
      }.bind(this));

      this.eventsService.on('showIntroWizard', function(showintrowizard) {
        this.showIntroWizard= showintrowizard;
      }.bind(this));

      this.loadShowIntroWizard();

    }

    goNextStep(){
      this.data.storage = {option: 'next', actualStep: this.actualStep, maxStep:this.maxStep};
      this.eventsService.broadcast('setStepWizard', 'next');
    }

    goPrevStep(){
      this.data.storage = {option: 'prev', actualStep: this.actualStep, maxStep:this.maxStep};
      this.eventsService.broadcast('setStepWizard', 'prev');
    }
}
