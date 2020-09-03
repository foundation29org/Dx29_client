import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

declare var AzureStorage: any;

export interface IBlobAccessToken {
  blobAccountUrl: string;
  sasToken: string;
  containerName: string;
  patientId: string;
}

@Injectable()
export class BlobStoragePedService {

  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() changeFilesPedBlob: EventEmitter<any> = new EventEmitter();
  private finishedOrError = false;
  uploaded = false;
  filesPedOnBlob: any = [];

  blobService: any;

  init(accessToken: IBlobAccessToken){
    const blobUri = accessToken.blobAccountUrl;
    //console.log(accessToken);
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());
  }

  uploadToBlobStorage(accessToken: IBlobAccessToken, file: File, filename: string): Observable<number> {
    const progress$ = new Subject<number>();
    const speedSummary = this.uploadFile(accessToken, file, filename, progress$);

    this.refreshProgress(speedSummary, progress$);

    return progress$.asObservable();
  }

  createContainerIfNotExists(accessToken: IBlobAccessToken){
    this.loadFilesPedOnBlob(accessToken.containerName);
  }


  private uploadFile(accessToken: IBlobAccessToken, file: File, filename: string, progress$: Subject<number>): any {
    this.uploaded = false;
    const customBlockSize = file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;
    const blobUri = accessToken.blobAccountUrl;
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());

    this.blobService.singleBlobPutThresholdInBytes = customBlockSize;
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var date='' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
    var fileNameToSave ='vcf/'+date+'/'+filename;
    return this.blobService.createBlockBlobFromBrowserFile(
      accessToken.containerName,
      fileNameToSave,
      file,
      { blockSize: customBlockSize },
      this.callback(progress$, accessToken)
    );
  }

  private refreshProgress(speedSummary: any, progress$: Subject<number>): void {
    setTimeout(() => {
      if (!this.uploaded) {
        const progress = speedSummary.getCompletePercent();
        progress$.next(progress);
        this.refreshProgress(speedSummary, progress$);
      }
    }, 200);
  }

  private callback(progress$: Subject<number>, accessToken: IBlobAccessToken): (error, result, response) => void {
    return (error, result, response) => {
      this.finishedOrError = true;
      if (error) {
        progress$.error('Error uploading to blob storage: ' + JSON.stringify(accessToken));
        this.uploaded = false;
      } else {
        progress$.next(100);
        progress$.complete();
        //call to nodejs for call microsoft genomics
        this.uploaded = true;
        this.change.emit(this.uploaded);
        //this.loadFilesPedOnBlob(accessToken.containerName);
      }
    };
  }


  loadFilesPedOnBlob(containerName){
   this.filesPedOnBlob = [];
    this.blobService.listBlobsSegmented(containerName, null, {
      publicAccessLevel: 'blob'
    }, function(error, result, response) {
      if (!error) {
        //console.log(result.entries);
        var filesPed = [];
        for (var i = 0; i < result.entries.length; i++) {
          if((result.entries[i].name).indexOf('.ped')!=-1){
            filesPed.push(result.entries[i]);
          }

        }
        this.filesPedOnBlob = filesPed;
        this.changeFilesPedBlob.emit(this.filesPedOnBlob);
        // if result = true, container was created.
        // if result = false, container already existed.
      }
    }.bind(this));
  }

  deleteBlob(containerName, blobName){
    this.blobService.deleteBlob(containerName, blobName, {
      publicAccessLevel: 'blob'
    }, function(error, result, response) {
      if (!error) {
      }
    }.bind(this));
  }


}
