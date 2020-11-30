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
    showintrowizard: boolean = true;
    eventsService: any = null;

    constructor(private eventsService: EventsService, private data: Data, private inj: Injector)
      {
        this.eventsService = this.inj.get(EventsService);
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
        this.showintrowizard= showintrowizard;
      }.bind(this));

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
