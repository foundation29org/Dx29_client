import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import * as decode from 'jwt-decode';
import { AuthService } from './auth.service';

@Injectable()
export class TokenService {
  private token: string;
  private loginUrl: string = '/.';
  private redirectUrl: string = '/patient/dashboard/nodiagnosis';
  private isloggedIn: boolean = false;
  private message: string;
  private iduser: string;
  private role: string;
  private subrole: string;
  private group: string;
  private lang: string;
  private platform: string;
  private expToken: number = null;

  private isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

  constructor(private http: HttpClient, public authService: AuthService) {}


  isTokenValid():boolean{
    if(sessionStorage.getItem('token') && this.authService.getIdUser()!=undefined){
      if((this.authService.getToken() == sessionStorage.getItem('token'))&& this.authService.getIdUser()!=undefined){
        const tokenPayload = decode(sessionStorage.getItem('token'));
        if(tokenPayload.sub ==this.authService.getIdUser()){
          return true;
        }else{
          return false;
        }
      }else{
        return false;
      }
    }else{
      return false;
    }
  }

  //deprecated
  testToken(): Observable<boolean>{
    return this.http.get(environment.api+'/api/testToken')
      .map( (res : any) => {
        console.log(res);
          return res;
       }, (err) => {
         console.log(err);
         return false;
       }
      );
  }

}
