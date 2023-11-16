import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/throw'
import 'rxjs/add/operator/catch';

import { environment } from 'environments/environment';

import { EventsService } from 'app/shared/services/events.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private inj: Injector) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    var eventsService = this.inj.get(EventsService);
    // Clone the request to add the new header.

    var isExternalReq = false;
    var authReq = req.clone({});

    if (req.url.indexOf(environment.f29bio) !== -1 || req.url.indexOf(environment.f29api) !== -1 || req.url.indexOf('logic.azure.com') !== -1 || req.url.indexOf(environment.urlDxv2) !== -1 || req.url.indexOf('ipinfo.io') !== -1) {
      isExternalReq = true;
    }

    if (req.url.indexOf('https://classic.clinicaltrials') !== -1 ) {
      isExternalReq = true;
      return next.handle(authReq)
    }
    

    if (req.url.indexOf('/api/Document/Parse') !== -1) {
      isExternalReq = true;
      const headers = new HttpHeaders({
        'Content-Type': 'application/octet-stream'
      });
      authReq = req.clone({ headers });
    }

    // Pass on the cloned request instead of the original request.
    return next.handle(authReq)
      .catch((error, caught) => {

        if (error.status === 401) {
          return Observable.throw(error);
        }

        if (error.status === 404 || error.status === 0) {
          if (!isExternalReq) {
            var returnMessage = error.message;
            if (error.error.message) {
              returnMessage = error.error;
            }
            eventsService.broadcast('http-error', returnMessage);
          } else {
            eventsService.broadcast('http-error-external', 'no external conexion');

          }
          return Observable.throw(error);
        }

        if (error.status === 419) {
          return Observable.throw(error);
        }

        //return all others errors
        return Observable.throw(error);
      }) as any;
  }
}
