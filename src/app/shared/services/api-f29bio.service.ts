import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { AuthService } from 'app/shared/auth/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { OVERLAY_KEYBOARD_DISPATCHER_PROVIDER } from '@angular/cdk/overlay/keyboard/overlay-keyboard-dispatcher';

@Injectable()
export class Apif29BioService {

    constructor(private authService: AuthService, private http: HttpClient) {}

    getSymptomsOfDisease(lang,listIds,depth){
        if(depth==null){
            return this.http.post(environment.f29bio+'/api/BioEntity/disease/phenotypes/'+lang+'/tree', listIds)
            .map( (res : any) => {
                return res;
            }, (err) => {
                console.log(err);
                return err;
            })
        }
        else{
            return this.http.post(environment.f29bio+'/api/BioEntity/disease/phenotypes/'+lang+'/tree?depth='+depth, listIds)
            .map( (res : any) => {
                return res;
            }, (err) => {
                console.log(err);
                return err;
            })
        }

    }
    getInfoSymptomsJSON(listIds,json){
        //var startTime = new Date().getTime();
        return new Observable((observer)=>{
            var listFound=[];
            for(var k=0;k<listIds.length;k++){
                listFound.push(json.filter(function(hpoInfo){
                if( hpoInfo.id == listIds[k]){
                    return hpoInfo;
                }}))
            }
            //var endTime = new Date().getTime();
            //var timeDiff = endTime - startTime; //in ms
            //alert("Time diff JSON: "+timeDiff)
            observer.next(JSON.parse(JSON.stringify(listFound)));
        })

    }

    getInfoOfSymptoms(lang,listIds){
        //var startTime = new Date().getTime();
        return this.http.post(environment.f29bio+'/api/BioEntity/phenotypes/'+lang, listIds)
        .map( (res : any) => {
            //var endTime = new Date().getTime();
            //var timeDiff = endTime - startTime; //in ms
            //alert("Time diff API: "+timeDiff)
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getInfoOfDiseases(listOfDiseases){
        return this.http.post(environment.f29bio+'/api/BioEntity/diseases/en', listOfDiseases)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getGenesOfDiseases(listOfDiseases){
        return this.http.post(environment.f29bio+'/api/BioEntity/disease/genes/tree/', listOfDiseases)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getSuccessorsOfSymptoms(listOfSymptoms){
        return this.http.post(environment.f29bio+'/api/BioEntity/phenotype/successors/',listOfSymptoms)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getLeavesOfSymptoms(listOfSymptoms){
        return this.http.post(environment.f29bio+'/api/BioEntity/phenotype/leaves/',listOfSymptoms)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getOWLSim3Match(listOfSymptoms, limit){
        return this.http.get(environment.f29bio+'/api/OWLSim3/match/naive-bayes-fixed-weight-two-state/'+listOfSymptoms+'&limit='+limit)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getSegmentation(lang,textf){
        return this.http.post(environment.f29bio+'/api/Translation/document/segmentation?lan='+lang, textf)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getTranslationDictionary(lang,segments){
      var body = {lang:lang, segments: segments}
        return this.http.post(environment.api+'/api/Translation/document/translate', body)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }
}
