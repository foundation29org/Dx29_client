import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { AuthService } from 'app/shared/auth/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { TranslateService } from '@ngx-translate/core';


import Swal from 'sweetalert2';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { observable } from 'rxjs';


@Injectable()
export class Apif29SrvControlErrors {
    
    constructor(private authService: AuthService, private http: HttpClient,private apiDx29ServerService: ApiDx29ServerService, private translate: TranslateService) {}

    getDescriptionErrorAndNotify(type,error,lang,token){
        console.log("getDescriptionErrorAndNotify")
        console.log(type)
        console.log(error.status)
        // Me falta comprobar que tiene contenido el error, si no tiene se lanzaría el error genérico
        if(error.status==500){
            var message = this.translate.instant("generics.errorSrvMsg")
            if(token!=undefined){
                message = message + "<br><br>" + "IssueId: "+token;
            }
            else{
                var IssueId=new Date().toISOString();
                message = message + "<br><br>" + "IssueId: "+IssueId;
            }
            // swal generic message
            Swal.fire({ title: this.translate.instant("generics.errorServTitle") +" "+error.status.toString(), html: message,icon:"error" })
            //return (null)
            return new Observable(observable=>{
                console.log("return null")
                //return (null);
                observable.next(null)
            })
        }
        else{
            console.log("NOT 500")
            if(type=="type 2"){
                console.log("TYPE 2")
                    return this.http.post(environment.f29svc+'/api/exomiser/StatusDescription?lan='+lang,error)
                    .map(  (res:any)=>{
                        console.log(res)
                        var description = res.description
                        if(token!=undefined){
                            description = description + "<br><br>" + "IssueId: "+token;
                        }
                        else{
                            var IssueId=new Date().toISOString();
                            description = description + "<br><br>" + "IssueId: "+IssueId;
                        }
                        Swal.fire({ title: res.message, html: description,icon:res.severity.toLowerCase() })
                        return res;
                    }, (err) => {
                        console.log(err);
                        return (err)
                    })
                
            }
            else{
                return this.http.post(environment.f29svc+'/api/exomiser/ErrorDescription?lan='+lang,error)
                .map( async (res : any) => {
                    var description = res.description
                    if(token!=undefined){
                        description = description + "<br><br>" + "IssueId: "+token;
                    }
                    else{
                        var IssueId=new Date().toISOString();
                        description = description + "<br><br>" + "IssueId: "+IssueId;
                    }
                    Swal.fire({ title: res.message, html: description,icon:res.severity.toLowerCase() })
                    return res;
                }, (err) => {
                    console.log(err);
                    return err;
                })
            }
        }
    }
}