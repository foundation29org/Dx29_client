import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/throw'
import 'rxjs/add/operator/catch';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { environment } from 'environments/environment';

import { EventsService} from 'app/shared/services/events.service';
import { ExomiserHttpService } from '../services/exomiserHttp.service';
import { takeUntil } from 'rxjs/operators';
import * as decode from 'jwt-decode';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private exomiserHttpService: ExomiserHttpService;
  constructor(private inj: Injector, private router: Router) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        var eventsService = this.inj.get(EventsService);
        this.exomiserHttpService=this.inj.get(ExomiserHttpService)
        let authService = this.inj.get(AuthService); //authservice is an angular service
        // Get the auth header from the service.
        const Authorization = authService.getToken();
        if(authService.getToken()==undefined){
          const authReq = req.clone({ headers: req.headers});
          return next.handle(authReq)
        }
        // Clone the request to add the new header.
        var token =  authService.getToken();
        var type = 'Bearer'

        var isExternalReq = false;

        var authReq = req.clone({});
        if(req.url.indexOf(environment.api)!==-1){
          /*const headers = new HttpHeaders({
            'authorization': `${type} ${token}`,
            'Cache-Control':  'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          authReq = req.clone({ headers});*/
          authReq = req.clone({ headers: req.headers.set('authorization',  `${type} ${token}`) });
          let tokenService = this.inj.get(TokenService);
          if(!tokenService.isTokenValid()){
            authService.logout();
            this.router.navigate([authService.getLoginUrl()]);
          }
        }

        if(req.url.indexOf('h29patientmap')!==-1){
          authReq = req.clone({});
        }

        if(req.url.indexOf('https://api.microsofttranslator.com')!==-1){
          isExternalReq = true;
          authReq = req.clone({ responseType: 'text' });
        }
        /*if(req.url.indexOf('https://api.cognitive.microsofttranslator.com')!==-1){
          isExternalReq = true;
          authReq = req.clone({ headers: req.headers.set('Ocp-Apim-Subscription-Key',  '7174b790ef59409280f77dd94c34a9d2' ) });
        }*/

        //use exomizer service
        if(req.url.indexOf('https://genomicservices.azurewebsites.net/api/exomize')!==-1){
          isExternalReq = true;
          const headers = new HttpHeaders({
            'Access-Control-Allow-Origin':'*'
          });
          authReq = req.clone({ headers});//'Content-Type',  'application/json'
          //authReq = authReq.clone({ headers: req.headers.set('Content-Type',  'application/json' )});
        }
        
        if(req.url.indexOf('https://api.monarchinitiative.org/api/')!==-1){
          isExternalReq = true;
        }
        if(req.url.indexOf(environment.f29bio)!==-1 || req.url.indexOf(environment.f29api)!==-1){
          isExternalReq = true;
        }
        if(req.url.indexOf(environment.f29svc+'/api/exomiser/')!=-1){
          isExternalReq = true;
          authReq = req.clone({})
          return next.handle(req).pipe(takeUntil(this.exomiserHttpService.onCancelPendingRequests()))
        }

        if(req.url.indexOf('/api/Document/Parse')!==-1){
          isExternalReq = true;
          console.log('entra');
          const headers = new HttpHeaders({
            'Content-Type': 'application/octet-stream'
          });
          authReq = req.clone({ headers});//'Content-Type',  'application/json'
          //authReq = authReq.clone({ headers: req.headers.set('Content-Type',  'application/json' )});
        }

        if(req.url.indexOf('://h29patientmap')!==-1){
          isExternalReq = true;
          authReq = req.clone({})
        /*  const headers = new HttpHeaders({
            'Access-Control-Allow-Origin':'*'
          });
          authReq = req.clone({ headers});//'Content-Type',  'application/json'*/
          //authReq = authReq.clone({ headers: req.headers.set('Content-Type',  'application/json' )});
        }
        if(req.url.indexOf('dx29settings')!==-1){
          isExternalReq = true;
          const headers = new HttpHeaders({
            'Access-Control-Allow-Origin':'*',
          });
          authReq = req.clone({ headers});//'Content-Type',  'application/json'
          //authReq = authReq.clone({ headers: req.headers.set('Content-Type',  'application/json' )});
        }

        // se podría controlar antes sin realizar la petición por si no hay conexión a internet con esto: navigator.onLine
        // Pass on the cloned request instead of the original request.
        return next.handle(authReq)
            .catch((error, caught) => {

                if (error.status === 401) {
                  if(!isExternalReq){
                    //logout users, redirect to login page
                    authService.logout();
                    this.router.navigate(['/login']);
                  }

                  return Observable.throw(error);

                }

                if (error.status === 404 || error.status === 0) {
                  if(!isExternalReq){
                    var returnMessage = error.message;
                    if(error.error.message){
                      returnMessage = error.error;
                    }
                    eventsService.broadcast('http-error', returnMessage);
                  }else{
                      eventsService.broadcast('http-error-external', 'no external conexion');

                  }
                  return Observable.throw(error);

                }

                if (error.status === 419) {

                  /*  return authService.refreshToken().flatMap(t => {
                      const authReq = req.clone({ headers: req.headers.set('authorization', t) });
                      return next.handle(authReq);
                  });*/
                  if(!isExternalReq){
                    authService.logout();
                    this.router.navigate(['/login']);
                  }
                  return Observable.throw(error);

                }

                //return all others errors
                return Observable.throw(error);

            }) as any;
    }
}
