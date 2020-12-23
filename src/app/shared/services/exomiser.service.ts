import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { AuthService } from 'app/shared/auth/auth.service';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Rx';

@Injectable()
export class ExomiserService {
    actualToken;
    constructor(private authService: AuthService,private http: HttpClient) {}
    getActualToken(){
        return this.actualToken;
    }
    setActualToken(token){
        this.actualToken=token;
    }

    // Analyze
    analyzeExomiser(settingExomizer){
        //return this.http.post(environment.exomiserUrl,settingExomizer)
        return this.http.post(environment.f29svc+'/api/exomiser/analyse',settingExomizer)
        .map( (res : any) => {
            // Set actualToken
            this.actualToken=res.token;
            return res;
        }, (err) => {
            console.log(err);
            // Errores me los da por aqui
            return err;
        })
    }

    // Status
    checkExomiserStatus(patientId){
        //return this.http.get(environment.api+'/api/exomizerservices/'+patientId)
        return this.http.get(environment.f29svc+'/api/exomiser/status?token='+this.actualToken)
        .map( (res : any) => {
            var resultMessage={message:"",res:{}};
            if(res.status=="Running"){
                resultMessage.message="something pending";
            }
            else if(res.status=="Succeeded"){
                resultMessage.message="nothing pending";
            }
            else if(res.status=="Failed"){
                resultMessage.message="Error";
                // res.code y con esto y el lang llamo a la descripcion del error
            }
            else{
                resultMessage.message="something pending";
            }
            resultMessage.res=res;
            return resultMessage;
            //return res;
        }, (err) => {
            // 404 token not found
            // token mal construido
            // 500 otros errores
            console.log(err);
            return err;
        })
    }

    checkExomiserStatusNavBar(patientId, actualToken){
        //return this.http.get(environment.api+'/api/exomizerservices/'+patientId)
        return this.http.get(environment.f29svc+'/api/exomiser/status?token='+actualToken)
        .map( (res : any) => {
            var resultMessage={message:"",res:{}};
            if(res.status=="Running"){
                resultMessage.message="something pending";
            }
            else if(res.status=="Succeeded"){
                resultMessage.message="nothing pending";
            }
            else if(res.status=="Failed"){
                resultMessage.message="Error";
                // res.code y con esto y el lang llamo a la descripcion del error
            }
            else{
                resultMessage.message="something pending";
            }
            resultMessage.res=res;
            return resultMessage;
            //return res;
        }, (err) => {
            // 404 token not found
            // token mal construido
            // 500 otros errores
            console.log(err);
            return err;
        })
    }

    // Results
    getExomiserResults(){
        //return this.http.get(environment.api+'/api/exomizerservice/'+patientId)
        return this.http.get(environment.f29svc+'/api/exomiser/results?token='+this.actualToken)
        .map( (res : any) => {
            return res;
        }, (err) => {
            // 404 token not found
            // token mal construido
            // 500 otros errores
            console.log(err);
            return err;
        })
    }

    // De momento no está
    /*cancelSubscription(patientId){
        return this.http.get(environment.api+'/api/exomizerservices/cancel/'+patientId)
        .map( (res : any) => {
            console.log(res)
            return res;
        }, (err) => {
            console.log(err);
        })
    }*/

}
