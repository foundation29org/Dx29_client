import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { GoogleAnalyticsService } from 'app/shared/services/google-analytics.service';

import {jsPDFService} from 'app/shared/services/jsPDF.service'

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';


var $primary = "#975AFF",
    $success = "#40C057",
    $info = "#2F8BE6",
    $warning = "#F77E17",
    $danger = "#F55252",
    $label_color_light = "#E6EAEE";

var themeColors = [$primary, $warning, $success, $danger, $info];


@Component({
    selector: 'timeline-app',
    templateUrl: './timeline-app.component.html',
    styleUrls: ['./timeline-app.component.scss'],
    providers: [jsPDFService]
})


export class TimelineAppComponent implements OnInit, OnDestroy {
    @Input() listSymptoms: any[];
    @Output() openModalSymptomInfo = new EventEmitter();
    @Output() openModalSaveTimeLine = new EventEmitter();
    @Output() openModalTimelineHelp = new EventEmitter();
    @Output() backEvent = new EventEmitter();
    @Output() finishEvent = new EventEmitter();

    private dictionaryTimeline: any;
    private listTimelineNull: any;

    modifyFormSymtoms = false;
    showTimeLine = false;
    selectedInfoSymptom = null;
    actualTemporalSymptomsIndex = 0;

    downloadingTimeline = false;

    constructor(public translate: TranslateService,  public toastr: ToastrService, public googleAnalyticsService: GoogleAnalyticsService, public jsPDFService: jsPDFService) {
        this.modifyFormSymtoms = false;
        this.showTimeLine = false;
        this.actualTemporalSymptomsIndex = 0;
        this.selectedInfoSymptom = null;
        this.downloadingTimeline = false;
    }

    ngOnInit() {
        this.modifyFormSymtoms = false;
        this.showTimeLine = false;
        this.actualTemporalSymptomsIndex = 0;
        this.selectedInfoSymptom = null;
        this.downloadingTimeline = false;
        this.loadingTimeLine();
    }

    ngOnDestroy() {
    }

    loadingTimeLine(){
        for (var i=0; i<this.listSymptoms.length;i++){
            if((this.listSymptoms[i].onsetdate!=null)||(this.listSymptoms[i].onsetdate!=undefined)){
                this.showTimeLine=true;
            }
        }
        if(this.showTimeLine){
            this.updateTimeline();
        }
    }

    showMoreInfoSymptomPopup(symptom){
        this.openModalSymptomInfo.emit(symptom);
    }

    openTimelineAppHelp(){
        this.openModalTimelineHelp.emit(true);
    }

    // Order by ascending property key
    keyAscOrder = ((a, b) => {
        var a_month=a.key.split("-"[0])
        var a_year = a.key.split("-")[1]
        var b_month=b.key.split("-")[0]
        var b_year=b.key.split("-")[1]
        if(new Date(a_year).getTime() > new Date(b_year).getTime()){
            return -1;
        }
        else if(new Date(a_year).getTime() < new Date(b_year).getTime()){
            return 1;
        }
        else{
            if(new Date(a_month).getTime()>new Date(b_month).getTime()){
                return -1;
            }
            else if(new Date(a_month).getTime() < new Date(b_month).getTime()){
                return 1;
            }
            else{
                return 0;
            }
        }
    })

    isEmptyObject(obj){
        if (obj == undefined){
            return true;
        }
        else{
            return (obj && (Object.keys(obj).length === 0));
        }
    }

    goPrevSymptom(){
        this.modifyFormSymtoms = true;
        this.actualTemporalSymptomsIndex--;
        this.modifyFormSymtoms = false;
    }

    goNextSymptom(){
        this.modifyFormSymtoms = true;
        this.actualTemporalSymptomsIndex++;
        this.modifyFormSymtoms = false;
    }

    updateTimeline(){
        this.showTimeLine = false;
        this.dictionaryTimeline = {}
        this.listTimelineNull = []

        for (var i = 0; i< this.listSymptoms.length;i++){
            if((this.listSymptoms[i].onsetdate==NaN)||(this.listSymptoms[i].onsetdate==undefined)){
                this.listSymptoms[i].onsetdate = null
            }
            else if(this.listSymptoms[i].onsetdate.length==0){
                this.listSymptoms[i].onsetdate = null
            }
            if ((this.listSymptoms[i].finishdate==NaN)||(this.listSymptoms[i].finishdate==undefined)){
                this.listSymptoms[i].finishdate = null
            }
            else if(this.listSymptoms[i].finishdate.length==0){
                this.listSymptoms[i].finishdate = null
            }
            if((this.listSymptoms[i].isCurrentSymptom!=null)||(this.listSymptoms[i].isCurrentSymptom!=undefined)){
                this.modifyFormSymtoms = true;
                this.listSymptoms[i].finishdate=null;
                this.listSymptoms[i].selectEndOrCurrent = false;
                this.modifyFormSymtoms = false;
            }
            else{
                if((this.listSymptoms[i].finishdate!=null)&&(this.listSymptoms[i].finishdate!=undefined)){
                    this.checkFinishDate(i);
                }
            }
        }
        for (var i = 0; i< this.listSymptoms.length;i++){
            var newDate = this.listSymptoms[i].onsetdate
            if(newDate!= null){
                var newYear = new Date(newDate).getFullYear()
                var newMonth = new Date(newDate).getUTCMonth()+1;
                var newKey=newMonth+"-"+newYear
                if(this.dictionaryTimeline[newKey]==undefined){
                    this.dictionaryTimeline[newKey] = {}
                }
                if(this.dictionaryTimeline[newKey][newDate]==undefined){
                    this.dictionaryTimeline[newKey][newDate] = []
                }
                this.dictionaryTimeline[newKey][newDate].push(this.listSymptoms[i])
                for (var j = 0; j< this.listSymptoms.length;j++){
                    if (i!=j){
                        var compareOnsetDate = this.listSymptoms[j].onsetdate;
                        var compareFinishDate = this.listSymptoms[j].finishdate;
                        var isCurrentSymptom = this.listSymptoms[j].isCurrentSymptom;
                        if(isCurrentSymptom){
                            if(compareOnsetDate!=null){
                                if(new Date(newDate).getTime()>new Date(compareOnsetDate).getTime()){
                                    this.dictionaryTimeline[newKey][newDate].push(this.listSymptoms[j])
                                }
                            }
                        }
                        else{
                            if(compareOnsetDate!=null){
                                if(compareFinishDate!=null){
                                    if((new Date(newDate).getTime()>new Date(compareOnsetDate).getTime())&&(new Date(newDate).getTime()<new Date(compareFinishDate).getTime())){
                                        this.dictionaryTimeline[newKey][newDate].push(this.listSymptoms[j])
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else{
                this.listTimelineNull.push(this.listSymptoms[i])
            }
        }
        this.getFirstDate();
        this.showTimeLine = true;
    }

    getFirstDate(){
        var firstDate = new Date();
        var symptomOnsetDateString = "";
        for(var i=0; i<this.listSymptoms.length;i++){
            if((this.listSymptoms[i].onsetdate==NaN)||(this.listSymptoms[i].onsetdate==undefined)){
                this.listSymptoms[i].onsetdate = null
            }
            else if(this.listSymptoms[i].onsetdate.length==0){
                this.listSymptoms[i].onsetdate = null
            }
            if(this.listSymptoms[i].onsetdate!=null){
                var symptomOnsetDate = new Date(this.listSymptoms[i].onsetdate);
                if(symptomOnsetDate.getTime()<firstDate.getTime()){
                    firstDate=symptomOnsetDate;
                    symptomOnsetDateString = this.listSymptoms[i].onsetdate;
                }
            }
            
        }
        if(symptomOnsetDateString!=""){
            this.dictionaryTimeline[symptomOnsetDateString]={}
        }
    }

    checkFinishDate(symptomIndex){
        if((this.listSymptoms[symptomIndex].onsetdate!=null)&&(this.listSymptoms[symptomIndex].onsetdate!=undefined)){
            if((this.listSymptoms[symptomIndex].finishdate!=null)&&(this.listSymptoms[symptomIndex].finishdate!=undefined)){
                if(new Date(this.listSymptoms[symptomIndex].onsetdate).getTime() > new Date(this.listSymptoms[symptomIndex].finishdate).getTime()){
                    this.modifyFormSymtoms = true;
                    this.listSymptoms[symptomIndex].finishdate = null;
                    this.listSymptoms[symptomIndex].invalidFinishdate = true;
                    this.modifyFormSymtoms = false;
                }
                else{
                    this.listSymptoms[symptomIndex].invalidFinishdate = false;
                    this.listSymptoms[symptomIndex].selectEndOrCurrent = false;
                }
            }
        }
    }

    backTimeline(exit){
        Swal.fire({
            title: this.translate.instant("generics.Are you sure?"),
            text: this.translate.instant("land.diagnosed.timeline.ExitDiscard"),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0CC27E',
            cancelButtonColor: '#f9423a',
            confirmButtonText: this.translate.instant("generics.Yes"),
            cancelButtonText: this.translate.instant("generics.No"),
            showLoaderOnConfirm: true,
            allowOutsideClick: false,
            reverseButtons: true
        }).then((result) => {
            if (result.value) {
                this.modifyFormSymtoms = true;
                this.resetTimeline();
                this.dictionaryTimeline = {}
                this.listTimelineNull = []
                this.showTimeLine = false;
                this.selectedInfoSymptom = null;
                this.modifyFormSymtoms = false;

                if (exit=='true'){
                    // Send event Form deleted
                    this.backEvent.emit(true);
                }
                
            }
        })
    }

    resetTimeline(){
        for(var index =0; index < this.listSymptoms.length;index++){
            if((this.listSymptoms[index].onsetdate!=undefined)&&(this.listSymptoms[index].onsetdate!=null)){
                this.listSymptoms[index].onsetdate=null;
            }
            if((this.listSymptoms[index].finishdate!=undefined)&&(this.listSymptoms[index].finishdate!=null)){
                this.listSymptoms[index].finishdate=null;
            }
            if((this.listSymptoms[index].isCurrentSymptom!=undefined)&&(this.listSymptoms[index].isCurrentSymptom!=null)){
                this.listSymptoms[index].isCurrentSymptom=null;
            }
            if((this.listSymptoms[index].notes!=undefined)&&(this.listSymptoms[index].notes!=null)){
                this.listSymptoms[index].notes=null;
            }
        }
    }
    
    exportTimeline()
    {
        var isValid= this.validateTimeline();
        // Download and send event 
        if(isValid){
            this.downloadingTimeline = true;
            this.jsPDFService.generateTimelinePDF('mytimeline-app', sessionStorage.getItem('lang'),this.dictionaryTimeline,this.listTimelineNull).then(()=>{
                this.downloadingTimeline = false;
                this.finishEvent.emit(true);
            })
        }
        else{
            Swal.fire('', this.translate.instant("land.diagnosed.timeline.errorExportPDF"), "error");
        }
    }

    validateTimeline(){
        var isValid = true;
        this.modifyFormSymtoms=true;
        for(var i=0; i<this.listSymptoms.length;i++){
            if((this.listSymptoms[i].onsetdate!=undefined)&&(this.listSymptoms[i].onsetdate!=null)){
                if((this.listSymptoms[i].finishdate==null)||(this.listSymptoms[i].finishdate==undefined)){
                    if((this.listSymptoms[i].isCurrentSymptom==undefined)||(this.listSymptoms[i].isCurrentSymptom==null)){
                        this.listSymptoms[i].selectEndOrCurrent = true;
                        isValid = false;
                    }
                }
            }
        }
        this.modifyFormSymtoms=false;
        return isValid;
    }
    

    saveTimeline()
    {
        this.openModalSaveTimeLine.emit(true);
    }
   
}
