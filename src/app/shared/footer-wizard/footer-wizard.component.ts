import { Component, HostBinding, OnInit } from '@angular/core';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';
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

    constructor(private dataservice: Data, private inj: Injector)
      {
        this.eventsService = this.inj.get(EventsService);
      }

    ngOnInit() {

      this.eventsService.on('actualStep', function(actualStep) {
        if(this.dataservice.steps!=undefined){
          this.actualStep= this.dataservice.steps.actualStep;
        }

      }.bind(this));

      this.eventsService.on('maxStep', function(maxStep) {
        if(this.dataservice.steps!=undefined){
          this.maxStep= this.dataservice.steps.maxStep;
        }
      }.bind(this));

      this.eventsService.on('showIntroWizard', function(showintrowizard) {
        this.showIntroWizard= showintrowizard;
      }.bind(this));

    }

    goNextStep2(){
      this.eventsService.broadcast('setStepWizard', 'next');
    }

    goPrevStep2(){
      this.eventsService.broadcast('setStepWizard', 'prev');
    }
}
