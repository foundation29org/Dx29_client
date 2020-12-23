import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Rx';

@Injectable()
export class ExomiserHttpService {
    private cancelPendingRequests$ = new Subject<void>()

    constructor() {}

    cancelPendingRequests(){
        this.cancelPendingRequests$.next()
        //this.cancelPendingRequests$.complete()
    }
    onCancelPendingRequests() {
        return this.cancelPendingRequests$.asObservable()
    }

}
