import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

declare var AzureStorage: any;

export interface IBlobAccessToken {
  blobAccountUrl: string;
  sasToken: string;
  containerName: string;
}

@Injectable()
export class BlobStorageSupportService {
  @Output() change: EventEmitter<any> = new EventEmitter();
  private finishedOrError = false;
  uploaded = false;
  filesOnBlob: any = [];
  vcfFilesOnBlob: any = [];

  blobService: any;
  uploadToBlobStorage(accessToken: IBlobAccessToken, file: File, filename: string): Observable<number> {
    const progress$ = new Subject<number>();
    const speedSummary = this.uploadFile(accessToken, file, filename, progress$);

    this.refreshProgress(speedSummary, progress$);

    return progress$.asObservable();
  }

  private uploadFile(accessToken: IBlobAccessToken, file: File, filename: string, progress$: Subject<number>): any {
    this.uploaded = false;
    const customBlockSize = file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;
    const blobUri = accessToken.blobAccountUrl;
    this.blobService = AzureStorage
      .createBlobServiceWithSas(blobUri, accessToken.sasToken)
      .withFilter(new AzureStorage.ExponentialRetryPolicyFilter());

    this.blobService.singleBlobPutThresholdInBytes = customBlockSize;

    return this.blobService.createBlockBlobFromBrowserFile(
      accessToken.containerName,
      filename,
      file,
      { blockSize: customBlockSize },
      this.callback(filename, progress$, accessToken)
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

  private callback(filename: string, progress$: Subject<number>, accessToken: IBlobAccessToken): (error, result, response) => void {
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
        var params = {uploaded: this.uploaded, filename: filename};
        this.change.emit(params);
      }
    };
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
