import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Rx';

@Injectable()
export class ExomiserHttpService {
    private cancelPendingRequests$ = new Subject<void>()

    constructor() {}

    cancelPendingRequests(){
        console.log("cancel pending request")
        this.cancelPendingRequests$.next()
        //this.cancelPendingRequests$.complete()
    }
    onCancelPendingRequests() {
        console.log(this.cancelPendingRequests$.asObservable())
        return this.cancelPendingRequests$.asObservable()
    }

}
