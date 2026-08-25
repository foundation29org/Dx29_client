import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class Apif29BioService {

    constructor(private http: HttpClient) {}

    getSymptomsOfDisease(lang,listIds,depth){
        return this.http.post(environment.api+'/api/dx29web/F29Bio/disease/phenotypes/'+lang, listIds);
    }
    getInfoSymptomsJSON(listIds,json){
        return new Observable((observer)=>{
            var listFound=[];
            for(var k=0;k<listIds.length;k++){
                listFound.push(json.filter(function(hpoInfo){
                if( hpoInfo.id == listIds[k]){
                    return hpoInfo;
                }}))
            }
            observer.next(JSON.parse(JSON.stringify(listFound)));
        })

    }

    getInfoOfSymptoms(lang,listIds){
        return this.http.post(environment.api+'/api/dx29web/F29Bio/phenotypes/'+lang, listIds);
    }

    getInfoOfDiseasesLang(listOfDiseases, lang){
        return this.http.post(environment.api+'/api/dx29web/F29Bio/diseases/'+lang, listOfDiseases);
    }

    callTextAnalytics(textf){
        return this.http.post(environment.api+'/api/callTextAnalytics', textf).pipe(
            map((res: any) => {
                // Production currently returns HTTP 200 with an Unauthorized body.
                // A valid extractor payload is an array whose second item has segments.
                if (!Array.isArray(res) || !res[1] || !res[1].segments) {
                    throw res;
                }
                return res;
            })
        );
    }

    getSegmentation(lang,textf){
        return this.http.post(environment.f29bio+'/api/Translation/document/segmentation?lan='+lang, textf);
    }

    getTranslationDictionary(lang,segments){
      var body = {lang:lang, segments: segments}
        return this.http.post(environment.api+'/api/Translation/document/translate', body);
    }
}
