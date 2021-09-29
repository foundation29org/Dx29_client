import { Component, OnInit, Input, OnDestroy, AfterContentChecked, Output, EventEmitter, LOCALE_ID } from '@angular/core';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { DateAdapter } from '@angular/material/core';
import { DatePipe } from '@angular/common';

import { LocalizedDatePipe } from 'app/shared/services/localizedDatePipe.service';
import { GoogleAnalyticsService } from 'app/shared/services/google-analytics.service';
import { SearchService } from 'app/shared/services/search.service';

import { jsPDFService } from 'app/shared/services/jsPDF.service';
import { HostListener } from "@angular/core";

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

var $primary = "#975AFF",
    $success = "#40C057",
    $info = "#2F8BE6",
    $warning = "#F77E17",
    $danger = "#F55252",
    $label_color_light = "#E6EAEE";

var themeColors = [$primary, $warning, $success, $danger, $info];

export function getCulture() {
    return sessionStorage.getItem('culture');
}

@Component({
    selector: 'timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
    providers: [jsPDFService, { provide: LOCALE_ID, useFactory: getCulture }]
})


export class TimelineComponent implements OnInit, OnDestroy, AfterContentChecked {
    @Input() disease: any = {};
    @Input() listSymptoms: any[];
    @Input() topRelatedConditions: any[];
    @Output() openModalSymptomInfo = new EventEmitter();
    @Output() openModalSaveTimeLine = new EventEmitter();
    @Output() openModalTimelineHelp = new EventEmitter();
    @Output() backEvent = new EventEmitter();
    @Output() finishEvent = new EventEmitter();
    @Output() addSymptomsEvent = new EventEmitter();

    private dictionaryTimeline: any;
    private listTimelineNull: any;

    modifyFormSymtoms = false;
    loadingPdf = false;
    showTimeLine = false;
    selectedInfoSymptom = null;
    actualTemporalSymptomsIndex = 0;
    symptomsWithoutDates = 0;

    maxDate = new Date();
    meses: any = {
        "enero": "January",
        "febrero": "February",
        "marzo": "March",
        "abril": "April",
        "mayo": "May",
        "junio": "June",
        "julio": "July",
        "agosto": "August",
        "septiembre": "September",
        "octubre": "October",
        "noviembre": "November",
        "diciembre": "December"
    };

    constructor(public translate: TranslateService, public toastr: ToastrService, public googleAnalyticsService: GoogleAnalyticsService, public jsPDFService: jsPDFService, private dateAdapter: DateAdapter<Date>, private datePipe: DatePipe, private localizedDatePipe: LocalizedDatePipe, private searchService: SearchService) {
        this.modifyFormSymtoms = false;
        this.showTimeLine = false;
        this.actualTemporalSymptomsIndex = 0;
        this.selectedInfoSymptom = null;
        this.dateAdapter.setLocale(sessionStorage.getItem('lang'));
    }

    @HostListener('window:resize', ['$event'])
    getScreenSize(event?) {
        var scrWidth = window.innerWidth;
        if (scrWidth < 575) {
            this.loadingTimeLine();
        }
        else {
        }
    }

    ngOnInit() {
        this.modifyFormSymtoms = false;
        this.showTimeLine = false;
        this.selectedInfoSymptom = null;
        this.actualTemporalSymptomsIndex = 0;
        this.loadingTimeLine();
    }

    ngAfterContentChecked() {
        //this.loadingTimeLine();
    }

    ngOnDestroy() {
    }

    loadingTimeLine() {
        for (var i = 0; i < this.listSymptoms.length; i++) {
            if ((this.listSymptoms[i].onsetdate != null) || (this.listSymptoms[i].onsetdate != undefined)) {
                this.showTimeLine = true;
            }
            if (this.listSymptoms[i].finishdate == undefined) {
                this.listSymptoms[i].isCurrentSymptom = true;
            } else {
                if (this.listSymptoms[i].finishdate == null) {
                    this.listSymptoms[i].isCurrentSymptom = true;
                } else {
                    this.listSymptoms[i].isCurrentSymptom = false;
                }
            }

        }
        /*if (this.showTimeLine) {
            this.updateTimeline();
        }*/
        this.updateTimeline();
    }

    saveSymptomsSession() {
        if(this.listSymptoms.length){
            var info = {
                "Symptoms": []
            }
            for (var index in this.listSymptoms) {
                info.Symptoms.push({"Id":this.listSymptoms[index].id,"StartDate":this.listSymptoms[index].onsetdate,"EndDate":this.listSymptoms[index].finishdate,"IsCurrent":this.listSymptoms[index].isCurrentSymptom, "Notes": this.listSymptoms[index].notes})
            }
            sessionStorage.setItem('symptoms', JSON.stringify(info));
        }
    }

    showMoreInfoSymptomPopup(symptom) {
        this.openModalSymptomInfo.emit(symptom);
    }

    openTimelineAppHelp() {
        this.openModalTimelineHelp.emit(true);
    }

    // Order by descending key
    keyDescOrder = ((a, b) => {
        var a_month = a.key.split("-")[0]
        var a_year = a.key.split("-")[1]
        var b_month = b.key.split("-")[0]
        var b_year = b.key.split("-")[1]
        a_month = this.getMonthFromString(a_month);
        b_month = this.getMonthFromString(b_month);
        if (new Date(a_year).getTime() > new Date(b_year).getTime()) {
            return 1;
        }
        else if (new Date(a_year).getTime() < new Date(b_year).getTime()) {
            return -1;
        }
        else {
            if (new Date(a_month).getTime() > new Date(b_month).getTime()) {
                return 1;
            }
            else if (new Date(a_month).getTime() < new Date(b_month).getTime()) {
                return -1;
            }
            else {
                return 0;
            }
        }
    })

    getMonthFromString(mon) {
        var lang = sessionStorage.getItem('lang')
        if (lang != 'es') {
            return new Date(Date.parse(mon + " 1, 2012")).getMonth() + 1
        } else {
            var date = new Date(Date.parse(this.meses[mon] + " 1, 2012")).getMonth() + 1;
            return date;
        }

    }

    // Order by descending value
    valueDateDescOrder = ((a, b) => {
        var lang = sessionStorage.getItem('lang')
        if (lang != 'es') {
            if (new Date(a.key).getTime() > new Date(b.key).getTime()) {
                return -1;
            }
            else if (new Date(a.key).getTime() < new Date(b.key).getTime()) {
                return -1;
            }
            else {
                return 0;
            }
        } else {
            var akey = a.key.split(" ")[0]
            var bkey = b.key.split(" ")[0]

            var par1 = this.meses[akey] + " " + a.key.split(" ")[1] + " " + a.key.split(" ")[2];
            var par2 = this.meses[bkey] + " " + b.key.split(" ")[1] + " " + b.key.split(" ")[2];
            if (new Date(par1).getTime() > new Date(par2).getTime()) {
                return -1;
            }
            else if (new Date(par1).getTime() < new Date(par2).getTime()) {
                return -1;
            }
            else {
                return 0;
            }
        }


    })

    isEmptyObject(obj) {
        if (obj == undefined) {
            return true;
        }
        else {
            return (obj && (Object.keys(obj).length === 0));
        }
    }

    goPrevSymptom() {
        this.modifyFormSymtoms = true;
        this.actualTemporalSymptomsIndex--;
        this.modifyFormSymtoms = false;
    }

    goNextSymptom() {
        this.modifyFormSymtoms = true;
        this.actualTemporalSymptomsIndex++;
        this.modifyFormSymtoms = false;
    }

    updateTimeline() {
        this.showTimeLine = false;
        this.modifyFormSymtoms = true;
        this.dictionaryTimeline = {}
        this.listTimelineNull = []
        this.symptomsWithoutDates = 0;
        for (var i = 0; i < this.listSymptoms.length; i++) {
            if ((this.listSymptoms[i].onsetdate == NaN) || (this.listSymptoms[i].onsetdate == undefined)) {
                this.listSymptoms[i].onsetdate = null;
                this.symptomsWithoutDates++
            }
            else if (this.listSymptoms[i].onsetdate.length == 0) {
                this.listSymptoms[i].onsetdate = null
                this.symptomsWithoutDates++
            }
            if ((this.listSymptoms[i].finishdate == NaN) || (this.listSymptoms[i].finishdate == undefined)) {
                this.listSymptoms[i].finishdate = null;
                this.listSymptoms[i].isCurrentSymptom == true;
            }
            else if (this.listSymptoms[i].finishdate.length == 0) {
                this.listSymptoms[i].finishdate = null;
                this.listSymptoms[i].isCurrentSymptom == true;
            } else if (this.listSymptoms[i].finishdate.length > 0) {
                this.listSymptoms[i].isCurrentSymptom == false;
            }

            if (this.listSymptoms[i].isCurrentSymptom == true) {
                this.listSymptoms[i].finishdate = undefined;
                this.listSymptoms[i].selectEndOrCurrent = false;
                this.listSymptoms[i].invalidFinishdate = false;
            }
            else {
                if ((this.listSymptoms[i].finishdate != null) && (this.listSymptoms[i].finishdate != undefined)) {
                    this.checkFinishDate(i);
                }
            }
        }

        for (var i = 0; i < this.listSymptoms.length; i++) {
            if (this.listSymptoms[i].onsetdate != null) {
                var newDate = this.listSymptoms[i].onsetdate;
                var newYear = newDate.getFullYear()
                var lang = sessionStorage.getItem('lang')
                var localeLang = 'en-US';
                if (lang == 'es') {
                    localeLang = 'es-ES'
                }
                var newMonth = newDate.toLocaleString(localeLang, { month: 'long' });
                var newKey = newMonth + "-" + newYear
                var key2temp = this.localizedDatePipe.transform(newDate, 'MMMM d, y', sessionStorage.getItem('lang'))
                //var key2temp = this.datePipe.transform(newDate, 'longDate');
                if (this.dictionaryTimeline[newKey] == undefined) {
                    this.dictionaryTimeline[newKey] = {}
                }
                if (this.dictionaryTimeline[newKey][key2temp] == undefined) {
                    this.dictionaryTimeline[newKey][key2temp] = []
                }
                var foundElement = this.searchService.search(this.dictionaryTimeline[newKey][key2temp], 'id', this.listSymptoms[i].id);
                if(!foundElement){
                    this.dictionaryTimeline[newKey][key2temp].push(this.listSymptoms[i])
                }
                
                for (var j = 0; j < this.listSymptoms.length; j++) {
                    if (i != j) {
                        var isCurrentSymptom = this.listSymptoms[j].isCurrentSymptom;
                        if (isCurrentSymptom) {
                            if (this.listSymptoms[j].onsetdate != null) {
                                var compareOnsetDate = this.listSymptoms[j].onsetdate;

                                if (newDate.getTime() > compareOnsetDate.getTime()) {
                                    var foundElement2 = this.searchService.search(this.dictionaryTimeline[newKey][key2temp], 'id', this.listSymptoms[j].id);
                                    if(!foundElement2){
                                        this.dictionaryTimeline[newKey][key2temp].push(this.listSymptoms[j])
                                    }
                                }
                            }
                        }
                        else {
                            if (this.listSymptoms[j].onsetdate != null) {
                                var compareOnsetDate = this.listSymptoms[j].onsetdate;
                                var compareFinishDate = this.listSymptoms[j].finishdate;

                                if (compareFinishDate != null) {
                                    if ((newDate.getTime() > compareOnsetDate.getTime()) && (newDate.getTime() < compareFinishDate.getTime())) {
                                        var foundElement2 = this.searchService.search(this.dictionaryTimeline[newKey][key2temp], 'id', this.listSymptoms[j].id);
                                        if(!foundElement2){
                                            this.dictionaryTimeline[newKey][key2temp].push(this.listSymptoms[j])
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                this.listTimelineNull.push(this.listSymptoms[i])
            }
        }

        for (var key in this.dictionaryTimeline) {
            var ordered = {};
            Object.keys(this.dictionaryTimeline[key]).sort(function (a, b) {
                var lang = sessionStorage.getItem('lang')
                if (lang != 'es') {
                    return (this.dateConverter(a) - this.dateConverter(b));
                } else {
                    var akey = a.split(" ")[0]
                    var bkey = b.split(" ")[0]
                    var par1 = this.meses[akey] + " " + a.split(" ")[1] + " " + a.split(" ")[2];
                    var par2 = this.meses[bkey] + " " + b.split(" ")[1] + " " + b.split(" ")[2];
                    return (this.dateConverter(par1) - this.dateConverter(par2));
                }

            }.bind(this)).forEach(function (key2) {
                ordered[key2] = this.dictionaryTimeline[key][key2];
            }.bind(this));
            this.dictionaryTimeline[key] = ordered;
        }

        this.showTimeLine = true;
        this.modifyFormSymtoms = false;
        this.saveSymptomsSession();
    }

    dateConverter(date) {
        return (new Date(date).getTime());
    }

    updateIsCurrentSymptom(index, value) {
        this.listSymptoms[index].finishdate = value;
        if (value != null) {
            this.checkFinishDate(index);
            if (this.listSymptoms[index].invalidFinishdate) {
                this.listSymptoms[index].isCurrentSymptom = true;
                this.listSymptoms[index].finishdate = null;
            } else {
                this.listSymptoms[index].isCurrentSymptom = false;
            }
        } else {
            this.listSymptoms[index].isCurrentSymptom = true;
        }
    }


    checkFinishDate(symptomIndex) {
        if ((this.listSymptoms[symptomIndex].onsetdate != null) && (this.listSymptoms[symptomIndex].onsetdate != undefined)) {
            var symptomOnsetDate = this.listSymptoms[symptomIndex].onsetdate;
            var symptomFinishDate = this.listSymptoms[symptomIndex].finishdate;
            if (symptomOnsetDate.getTime() > symptomFinishDate.getTime()) {
                this.listSymptoms[symptomIndex].finishdate = null;
                this.listSymptoms[symptomIndex].invalidFinishdate = true;
            }
            else {
                this.listSymptoms[symptomIndex].invalidFinishdate = false;
                this.listSymptoms[symptomIndex].selectEndOrCurrent = false;
            }
        }
    }

    backTimeline(exit) {
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

                if (exit == 'true') {
                    // Send event Form deleted
                    this.backEvent.emit(true);
                }

            }
        })
    }

    resetTimeline() {
        for (var index = 0; index < this.listSymptoms.length; index++) {
            if ((this.listSymptoms[index].onsetdate != undefined) && (this.listSymptoms[index].onsetdate != null)) {
                this.listSymptoms[index].onsetdate = null;
            }
            if ((this.listSymptoms[index].finishdate != undefined) && (this.listSymptoms[index].finishdate != null)) {
                this.listSymptoms[index].finishdate = null;
            }
            if ((this.listSymptoms[index].isCurrentSymptom != undefined) && (this.listSymptoms[index].isCurrentSymptom != null)) {
                this.listSymptoms[index].isCurrentSymptom = null;
            }
            if ((this.listSymptoms[index].notes != undefined) && (this.listSymptoms[index].notes != null)) {
                this.listSymptoms[index].notes = null;
            }
        }
    }

    exportTimeline() {
        if(!this.loadingPdf){
            var isValid = this.validateTimeline();
            // Download and send event 
            if (isValid) {
                this.loadingPdf = true;
                Swal.fire({
                    title: this.translate.instant("land.diagnosed.timeline.Download"),
                    html: '<div class="col-md-12"><span><i class="fa fa-spinner fa-spin fa-3x fa-fw pink"></i></span></div><div class="col-md-12 mt-2"> <p> ' + this.translate.instant("land.diagnosed.timeline.WaitDownload") + '</p></div>',
                    allowEscapeKey: false,
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: function () {
                        this.jsPDFService.generateTimelinePDF(sessionStorage.getItem('lang'), this.dictionaryTimeline, this.listTimelineNull, this.disease, this.topRelatedConditions);
                        Swal.close();
                        this.loadingPdf = false;
                        this.finishEvent.emit(true);
                    }.bind(this)
                });
    
            }
            else {
                Swal.fire('', this.translate.instant("land.diagnosed.timeline.errorExportPDF"), "error");
            }
        }
    }

    validateTimeline() {
        var isValid = true;
        this.modifyFormSymtoms = true;
        for (var i = 0; i < this.listSymptoms.length; i++) {
            if ((this.listSymptoms[i].onsetdate != undefined) && (this.listSymptoms[i].onsetdate != null)) {
                if ((this.listSymptoms[i].finishdate == null) || (this.listSymptoms[i].finishdate == undefined)) {
                    if ((this.listSymptoms[i].isCurrentSymptom == false) || (this.listSymptoms[i].isCurrentSymptom == undefined) || (this.listSymptoms[i].isCurrentSymptom == null)) {
                        this.listSymptoms[i].selectEndOrCurrent = true;
                        isValid = false;
                    }
                }
            }
        }
        this.modifyFormSymtoms = false;
        return isValid;
    }

    saveTimeline() {
        this.openModalSaveTimeLine.emit(true);
    }

    deleteSymptomTimeLine(index) {
        this.listSymptoms.splice(index, 1);
        this.updateTimeline();
        if (this.listSymptoms.length == 0) {
            this.addSymptomsEvent.emit({ listSymptoms: this.listSymptoms });
        }
    }

    showNotes(index) {
        this.listSymptoms[index].showNotes = true;
    }

    hideNotes(index) {
        this.listSymptoms[index].showNotes = false;
    }

    clearDates(index) {
        this.listSymptoms[index].onsetdate = null;
        this.listSymptoms[index].finishdate = null;
        this.updateTimeline();
    }

    addSymptomTimeLine() {
        this.addSymptomsEvent.emit({ listSymptoms: this.listSymptoms });
    }

}
