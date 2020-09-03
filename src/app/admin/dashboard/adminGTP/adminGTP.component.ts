import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import * as FileSaver from 'file-saver';

@Component({
    selector: 'app-adminGTP',
    templateUrl: './adminGTP.component.html',
    styleUrls: ['./adminGTP.component.scss'],
    providers: []
})

export class AdminGTPComponent implements OnInit, OnDestroy{
    private subscription: Subscription = new Subscription();
    loading:boolean=false;
    programsInfo=[];
    programsInfoNotPatient=[];
    alertsettingsProgramsInfo: any = {};
    alertSourceProgramsInfo: LocalDataSource;
    alertsettingsProgramsInfoNotPatient: any = {};
    alertSourceProgramsInfoNotPatient: LocalDataSource;
    appStatusList=[]
    initiatedByList=[];
    moreInfoCaseEvent: any = {};
    modalReference: NgbModalRef;

    constructor(private http: HttpClient,public authService: AuthService,public translate: TranslateService,private modalService: NgbModal){
    }
    ngOnInit(){
        this.loading=true;
        this.loadGTPData();
    }
    ngOnDestroy(){
        this.subscription.unsubscribe();
    }

    getAppStatus(cell){
      for(var i=0;i<this.appStatusList.length;i++){
        if(cell==this.appStatusList[i].title){
          return this.appStatusList[i].title;
        }
      }
    }

    openLinkMonarch(url){
      window.open('https://monarchinitiative.org/phenotype/'+url, '_blank');
    }
    openLink(url){
      window.open(url, '_blank');
    }

    onEditConfirm(e){
      console.log("Confirm edit")
      console.log(e)
      var data={userId:this.authService.getIdUser(),programName:"Genetic Program 1",idRequest:e.newData.applicationId}
      var action="";
      switch(e.newData.applicationStatus){
        case this.translate.instant('adminGTP.Requested'):
          action="setRequested"
          break;
        case this.translate.instant('adminGTP.Accepted'):
          action="setAccepted"
          break;
        case this.translate.instant('adminGTP.Rejected'):
          action="setRejected"
          break;
      }
     if(action!=""){
        this.subscription.add( this.http.post(environment.api+'/api/programs/'+action+'/',data)
        .subscribe( (res : any) => {
          console.log(res)
          e.confirm.resolve(e.newData);
        }, (err) => {
          console.log(err);
          this.loading=false;
          e.confirm.resolve(e.data);
        }));
        
      }
    }

    onDeleteConfirm(e){
      console.log("Confirm delete")
      console.log(e)
      Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        text:  this.translate.instant("adminGTP.Delete application to GTP")+': '+ e.data.applicationId,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0CC27E',
        cancelButtonColor: '#f9423a',
        confirmButtonText: this.translate.instant("generics.Delete"),
        cancelButtonText: this.translate.instant("generics.No, cancel"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false
      }).then((result) => {
        if (result.value) {
          this.delete(e);
        }
      });
    }
    delete(e){
      var data={userId:this.authService.getIdUser(),programName:"Genetic Program 1",idRequest:e.data.applicationId}
      this.subscription.add( this.http.post(environment.api+'/api/programs/deleteApplication/',data)
      .subscribe( (res : any) => {
        console.log(res)
        e.confirm.resolve(e.newData);
      }, (err) => {
        console.log(err);
        this.loading=false;
        e.confirm.resolve(e.data);
      }));
    }

    openMoreInfo(e){
      console.log(e)
      console.log(e.data);
      this.moreInfoCaseEvent = JSON.parse(JSON.stringify(e.data));
      document.getElementById("openModalMoreInfo").click();
    }

    showPanelMoreInfo(contentTemplate){
      this.modalReference = this.modalService.open(contentTemplate);
    }

    createTable(){
      this.appStatusList=[{title:this.translate.instant('adminGTP.Accepted'), value:this.translate.instant('adminGTP.Accepted')},{title:this.translate.instant('adminGTP.Rejected'),value:this.translate.instant('adminGTP.Rejected')},{title:this.translate.instant('adminGTP.Requested'),value:this.translate.instant('adminGTP.Requested')}]
      this.initiatedByList=[{title:this.translate.instant('adminGTP.Clinician case'), value:this.translate.instant('adminGTP.Clinician case')},{title:this.translate.instant('adminGTP.Shared case'),value:this.translate.instant('adminGTP.Shared case')}]

      var table = {
        actions: { 
        columnTitle: this.translate.instant("generics.Options"), 
        add: false, 
        edit: true , 
        delete: true, 
        position:'right', 
        },
        edit:{
          confirmSave: true,
          editButtonContent: '<i class="fa fa-pencil fa-1_5x primary mr-3"></i>'
        },
        delete: {
          confirmDelete: true,
          deleteButtonContent: '<i title='+this.translate.instant("generics.Delete")+' class="fa fa-trash fa-1_5x danger"></i>'
        },
        columns: {
          applicationId: {
            title: this.translate.instant("adminGTP.Application ID"),
            placeholder: this.translate.instant("adminGTP.Application ID"),
            type: "html",
            editable:false
          },
          initiatedBy:{
            title: this.translate.instant("adminGTP.Initiated by"),
            placeholder: this.translate.instant("adminGTP.Initiated by"),
            type: "html",
            editable:false,
            filter: {
              type: 'list',
              config: {
                selectText: this.translate.instant("adminGTP.All"),
                list: this.initiatedByList,
              },
            }
          },
          date:{
            title: this.translate.instant("adminGTP.Request date"),
            placeholder: this.translate.instant("adminGTP.Request date"),
            type: 'date',
            valuePrepareFunction: (date) => {
                if (date) {
                  if(date!="-"){
                    var dateRequest=new Date(date);
                    var l = (dateRequest.toString()).split(' ').splice(0, 5).join(' ')
                    return l;
                  }
                  else{
                    return date;
                  }
                }
                else{
                    return null;
                }
            },
            editable:false
          },
          clinicianName:{
            title: this.translate.instant("adminGTP.Clinician name"),
            placeholder: this.translate.instant("adminGTP.Clinician name"),
            type: "html",
            editable:false
          },
          patientName:{
            title: this.translate.instant("adminGTP.Patient name"),
            placeholder: this.translate.instant("adminGTP.Patient name"),
            type: "html",
            editable:false
          },
          applicationStatus:{
            title: this.translate.instant("adminGTP.Application status"),
            placeholder: this.translate.instant("adminGTP.Application status"),
            type: 'list',
            editable:true,
            editor:{
              type: 'list',
              valuePrepareFunction: (cell) => {
                return this.getAppStatus(cell)
              },
              config: {
                list: this.appStatusList
              }
            },
            filter: {
              type: 'list',
              config: {
                selectText: this.translate.instant("adminGTP.All"),
                list: this.appStatusList,
              },
            }
          }
        },
        pager : {
            display : false
        },
        attr: {
          class: "table table-responsive"
        }
      }
      return table;
    }

    translateTextsProgramInfo(programsInfo){
      for( var i=0;i<programsInfo.length;i++){
        if(programsInfo[i].applicationStatus=="accepted"){
          programsInfo[i].applicationStatus=this.translate.instant('adminGTP.Accepted');
        }
        if(programsInfo[i].applicationStatus=="rejected"){
          programsInfo[i].applicationStatus=this.translate.instant('adminGTP.Rejected');
        }
        if(programsInfo[i].applicationStatus=="requests"){
          programsInfo[i].applicationStatus=this.translate.instant('adminGTP.Requested');
        }
        if(programsInfo[i].initiatedBy=="Clinician case"){
          programsInfo[i].initiatedBy=this.translate.instant('adminGTP.Clinician case');
        }
        if(programsInfo[i].initiatedBy=="Shared case"){
          programsInfo[i].initiatedBy=this.translate.instant('adminGTP.Shared case');
        }
        if(programsInfo[i].geneticDataStatus==true){
          programsInfo[i].geneticDataStatus=this.translate.instant('adminGTP.Uploaded');
        }
        if(programsInfo[i].geneticDataStatus==false){
          programsInfo[i].geneticDataStatus=this.translate.instant('adminGTP.Not uploaded');
        }
        if(programsInfo[i].dataAnalysisStatus==true){
          programsInfo[i].dataAnalysisStatus=this.translate.instant('adminGTP.Analysed');
        }
        if(programsInfo[i].dataAnalysisStatus==false){
          programsInfo[i].dataAnalysisStatus=this.translate.instant('adminGTP.Not analysed');
        }
      }
      for( var i=0;i<programsInfo.length;i++){
        Object.keys(programsInfo[i]).forEach(key => {
          if(programsInfo[i][key]==null){
            programsInfo[i][key]="-"
          }
        });
      }
      return programsInfo;
    }

    loadGTPData(){
        var data={userId:this.authService.getIdUser(),programName:"Genetic Program 1"}
        this.programsInfo=[];
        this.programsInfoNotPatient=[];

        this.subscription.add( this.http.post(environment.api+'/api/programs/getProgramRequestsAndStatus/',data)
        .subscribe( (res : any) => {
            console.log(res)
            for(var i=0;i<res.length;i++){
              if(res[i].patientFound==true){
                this.programsInfo.push(res[i].data)
              }
              else{
                this.programsInfoNotPatient.push(res[i].data)
              }
            }
            this.programsInfo=this.translateTextsProgramInfo(this.programsInfo)
            this.programsInfoNotPatient=this.translateTextsProgramInfo(this.programsInfoNotPatient)

            this.alertSourceProgramsInfo = new LocalDataSource(this.programsInfo)
            this.alertSourceProgramsInfoNotPatient = new LocalDataSource(this.programsInfoNotPatient)

            this.alertsettingsProgramsInfo = this.createTable();
            this.alertsettingsProgramsInfoNotPatient = this.createTable();
            this.loading=false;
        }, (err) => {
            console.log(err);
            this.programsInfo=[];
            this.loading=false;
        }));
    }

    downloadFile(patientFound:boolean,data: any, filename:string) {
      var dataCopyToDownload=JSON.parse(JSON.stringify(data));
      console.log("Download")
      var replacer = (key, value) => value === null ? '' : value;
      for(var i=0;i<dataCopyToDownload.length;i++){
        var listSymptomsId="";
        if(dataCopyToDownload[i].listSymptoms.length>0){
          for(var j=0;j<dataCopyToDownload[i].listSymptoms.length;j++){
            listSymptomsId += (dataCopyToDownload[i].listSymptoms[j].id)+ "-";
          }
          dataCopyToDownload[i].listSymptoms=[];
          dataCopyToDownload[i].listSymptoms=listSymptomsId;
        }
        var dateRequest=new Date(dataCopyToDownload[i].date);
        var l = (dateRequest.toString()).split(' ').splice(0, 5).join(' ')
        dataCopyToDownload[i].date=l;
        if(dataCopyToDownload[i].medicalRecords.result==true){
          //var medicalRecordsStrings=dataCopyToDownload[i].medicalRecords.reason[j].url;
          var medicalRecordsStrings=""
          for(var j=0;j<dataCopyToDownload[i].medicalRecords.reason.length;j++){
            var url = (dataCopyToDownload[i].medicalRecords.reason[j].url)
            //var urlSplit=url.split(environment.blobAccessToken.sasToken2)
            if(j==dataCopyToDownload[i].medicalRecords.reason.length-1){
              medicalRecordsStrings=medicalRecordsStrings+url
            }
            else{
              medicalRecordsStrings=medicalRecordsStrings+url+", "
            }
          }
          dataCopyToDownload[i].medicalRecords=medicalRecordsStrings;
        }
        else{
          if(patientFound==true){
            dataCopyToDownload[i].medicalRecords= dataCopyToDownload[i].medicalRecords.reason[0]
          }
        }
      }
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth() + 1;
      var d = now.getDate();
      var date='' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
      var filenameWithDate=filename+"_"+date;
      //console.log(data)
      //console.log(dataCopyToDownload)
      const header = Object.keys(dataCopyToDownload[0]);
      let csv = dataCopyToDownload.map(row => header.map(fieldName => JSON.stringify(row[fieldName],replacer)).join(','));
      csv.unshift(header.join(','));
      let csvArray = csv.join('\r\n');
      var blob = new Blob([csvArray], {type: 'text/csv' })
      FileSaver.saveAs(blob, filenameWithDate + ".csv");
    }


}