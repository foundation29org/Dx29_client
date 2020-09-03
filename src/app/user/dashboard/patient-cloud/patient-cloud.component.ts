import { Component, Input, OnInit, AfterContentInit,  OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as d3 from 'd3';
import { environment } from 'environments/environment';
import { AuthService } from 'app/shared/auth/auth.service';
import { map, image } from 'd3';
import { EventEmitter } from 'events';
import { EmitterVisitorContext } from '@angular/compiler';
import { Subscription } from 'rxjs/Subscription';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs';
//import { detectChanges } from '@angular/core/src/render3';
import { IBlobAccessToken, BlobStorageService } from 'app/shared/services/blob-storage.service';


@Component({
  selector: 'app-patient-cloud',
  templateUrl: './patient-cloud.component.html',
  styleUrls: ['./patient-cloud.component.scss']
})
export class PatientCloudComponent implements OnInit, AfterContentInit, OnChanges {

  @Input() width: number;
  @Input() height: number;
  @Input() dataset: any;
  @Input() similarPatients: any;

  private margin = { top: 20, right: 20, bottom: 20, left: 20 };
  private radius = 6;
  public svg: any;
  private xScale: any;
  private yScale: any;
  private colorHash = {};
  private msgCondition: string ='';
  private msgThisIsYou: string ='';

  dataLoaded = false;
  data: any;
  fileMap: any;

  screenHeight:any = (window.innerWidth);
  screenWidth:any = (window.innerWidth);
  legend:any;

  imagenUrl: string ='';
  private subscription: Subscription = new Subscription();
  uploadProgress: Observable<number>;
  byteArrays: Uint8Array;


  accessMapToken: IBlobAccessToken = {
    // tslint:disable-next-line:max-line-length
    sasToken: environment.blobAccessToken.sasToken,
    blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
    containerName: '',
    patientId: ''
 };

  constructor(public translate: TranslateService, private authService: AuthService,private blob: BlobStorageService,private http: HttpClient ) {
    /*if(this.screenWidth>=768){
      this.screenWidth = this.screenWidth/2.2
    }*/
    this.subscription.add( this.blob.changeFilesMapBlob.subscribe(filesMapOnBlob => {
      if(filesMapOnBlob.length>0){
        console.log(filesMapOnBlob[0].name);
        this.setImageUrl();
      }else{
       console.log('no tiene!');
      }
    }));

    /*this.subscription.add( this.blob.change.subscribe(uploaded => {
       this.setImageUrl();
     }));*/
  }

  ngOnInit() {
    this.loadTranslations();
  }

  loadTranslations(){
    this.translate.get('dashboardpatient.Condition').subscribe((res: string) => {
      this.msgCondition = res;
    });
    this.translate.get('dashboardpatient.This is you').subscribe((res: string) => {
      this.msgThisIsYou = res;
    });
  }
/*
  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
        this.screenHeight = window.innerWidth;
        this.screenWidth = window.innerWidth;
        console.log(this.screenHeight, this.screenWidth);
        if(this.screenWidth>=768){
          this.screenWidth = this.screenWidth/2.2
        }
        d3.selectAll('.cloud-patient').remove();
        d3.selectAll('.patient').remove();
        this.updateViz();
  }*/

  ngOnChanges(changes: SimpleChanges) {
      // this will be called each time userInput changes
      this.dataLoaded = false;
      if(this.data!=undefined){
        console.log('in ngOnChanges');
        d3.selectAll('.cloud-patient').remove();
        d3.selectAll('.patient').remove();
        this.initEnvironment();
      }

  }

  ngAfterContentInit() {
    this.initEnvironment();
  }

  initEnvironment(){
    const that = this;
    that.svg = d3.select('svg');
    /*that.svg.call(d3.zoom().on('zoom', () => {
      that.svg.attr('transform', d3.event.transform);
    }));*/


    this.similarPatients.subscribe((res) => {
      that.dataLoaded = true;
      that.data = res;
      that.updateViz();
      that.accessMapToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
      that.accessMapToken.patientId = this.authService.getCurrentPatient().sub;
    //  that.blob.createContainerIfNotExists('map');
    //  that.getImageUrl();


    });
  }

  updateViz() {
    if(this.data!=undefined){
      const values = this.data.patients.map(p => p.embedding);
      var p1: number = parseFloat(d3.min(values, (p) => p[0]));
      var p2: number = parseFloat(d3.max(values, (p) => p[0]));
      var p3: number = parseFloat(d3.min(values, (p) => p[1]));
      var p4: number = parseFloat(d3.max(values, (p) => p[1]));
      this.xScale = d3.scaleLinear()
        .domain([p1, p2])
        //.domain([d3.min(values, (p) => p[0]), d3.max(values, (p) => p[0])])
        .range([this.margin.left, this.width - this.margin.right]);

      this.yScale = d3.scaleLinear()
        .domain([p3, p4])
        //.domain([d3.min(values, (p) => p[1]), d3.max(values, (p) => p[1])])
        .range([this.margin.top, this.width - this.margin.bottom]);

      console.log(d3.select('svg'));

      this.svg.append('g').selectAll('circle')
        .data(this.data.patients)
        .enter()
        .append('circle')
        .style('fill', c => this.getColorForCondition(c.condition.id))
        .style('fill-opacity', '0.5')
        .attr('class', 'cloud-patient')
        .attr('cx', c => this.xScale(c.embedding[0]))
        .attr('cy', c => this.yScale(c.embedding[1]))
        .attr('r', this.radius)
        .on('mouseover', (d, i, nodes) => this.handleMouseOver(d, i, nodes, this))
        .on('mouseout', (d, i, nodes) => this.handleMouseOut(d, i, nodes, this))
        .on('mouseup', (d) => this.handleMouseUp(d))
        .append("svg:title")
            .text(function(d, i) { return d.condition.name; });

      this.svg.append('circle')
        .style('fill', 'rgba(255,0,0,.5)')
        .style('stroke', 'black')
        .style('stroke-width', '3')
        .attr('class', 'patient')
        .attr('cx', c => this.xScale(this.data.proband.embedding[0]))
        .attr('cy', c => this.yScale(this.data.proband.embedding[1]))
        .attr('r', 20)
        .on('mouseover', () => this.handleMouseOver2())
        .on('mouseout', () => this.handleMouseOut2())
        .append("svg:title")
            .text(this.msgThisIsYou);

    }else{
      console.log('h29patientmap call fail');
      setTimeout(() =>
      {
          this.initEnvironment();
      },
      5000);
    }

}

  handleMouseOver(d, i, nodes, component) {
    this.legend = this.msgCondition+": "+d.condition.name;
    d3.select(nodes[i]).style('stroke', 'black');
    d3.select(nodes[i]).style('stroke-width', '3')
    d3.select(nodes[i]).style('fill-opacity', '1.0')
    d3.select(nodes[i]).attr('r', 10)

    /*
    d3.select(nodes[i]).style('fill', 'red');
    d3.select(nodes[i]).attr('r', component.radius * 2);

    d3.select('svg').selectAll('.cloud-patient')
      .data(this.getPatients(d))
      .enter()
      .append('circle')
      .style('fill', 'rgba(0,255,0,1)')
      .attr('class', 'cloud-patient')
      .attr('cx', p => this.xScale(p.embedding[0]))
      .attr('cy', p => this.yScale(p.embedding[1]))
      .attr('r', 2);
    */

  }

  handleMouseOut(d, i, nodes, component) {
    d3.select(nodes[i]).style('stroke', 'none');
    d3.select(nodes[i]).attr('r', 6)
    d3.select(nodes[i]).style('fill-opacity', '0.5')
    this.legend = '';

    /*
    d3.select(nodes[i]).style('fill', 'rgba(0,0,0,.2)');
    d3.select(nodes[i]).attr('r', this.radius);

    d3.selectAll('.cloud-patient').remove();  // Remove text location
    */
  }

  handleMouseUp(d) {
    var newUrl = d.condition.url;
    var win = window.open(newUrl, '_blank');
    win.focus();
  }

  handleMouseOver2() {
    this.legend = this.msgThisIsYou;
  }

  handleMouseOut2() {
    this.legend = '';
  }

  private getPatients(condition) {
    return this.dataset &&
           this.dataset.patients &&
           this.dataset.patients.filter(patient =>
            patient.conditionId === condition.id
           );
  }

  private getColorForCondition(conditionName) {
    if (!this.colorHash[conditionName]) {
      this.colorHash[conditionName] = this.randomColor()();
    }
    return this.colorHash[conditionName];
  }

  private randomColor() {
    const golden_ratio_conjugate = 0.618033988749895;
    let h = Math.random();

    const hslToRgb = (h, s, l) => {
        var r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = this.hue2rgb(p, q, h + 1/3);
            g = this.hue2rgb(p, q, h);
            b = this.hue2rgb(p, q, h - 1/3);
        }

        return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
    };

    return () => {
      h += golden_ratio_conjugate;
      h %= 1;
      return hslToRgb(h, 0.5, 0.60);
    };
  }

 hue2rgb(p, q, t){
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
  }

  downloadImage(){
    /*var svgData = document.getElementById('svgData');
    var svgXML = new XMLSerializer().serializeToString(svgData);

    d3.select('#download')
    .attr("href", 'data:application/octet-stream;base64,' + btoa(svgXML))
    .attr("download", "dx29MyMap.svg") */

    console.log(this.fileMap)

    var a = document.createElement("a")
    var rightNow = new Date();
    var res = rightNow.toISOString().slice(0,10).replace(/-/g,"");
    a.download = "myMapdx29-"+res+".png";
    a.href = window.URL.createObjectURL(this.fileMap)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)




  }

  imageToBlobPart(imageObj,canvas,callback){
    console.log("imageToBlobPart()")
    var ctx = canvas.getContext('2d');
    imageObj.onload = function(){
      console.log("imageOnLoad()")
      ctx.strokeStyle = "#FFF";
			ctx.fillStyle = "#FFF";
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.drawImage(imageObj, 0, 0);
      var data = canvas.toDataURL("image/png");

      //try {
        // Decode the dataURL
        var binary = atob(data.split(',')[1]);
        // Create 8-bit unsigned array
        var array = [];
        for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        // Return our Blob object
        //return new Blob([new Uint8Array(array)], { type: 'image/png' });
        var byteArrays = new Uint8Array(array);
        return callback(byteArrays)

      //} catch (e) {
          //console.log(e);
      //}

    };
  }

  uploadandGetImageUrl(file){
    console.log(this.accessMapToken.containerName)
    this.blob.uploadToBlobStorage(this.accessMapToken,file, 'myMapdx29.png', 'map');
    //this.blob.loadMapOnBlob(this.accessMapToken);
    console.log("uploaded");
  }

  setImageUrl(){
    console.log("set image url")
    this.imagenUrl=this.accessMapToken.blobAccountUrl+this.accessMapToken.containerName+'/myMapdx29.png'+this.accessMapToken.sasToken;
    console.log(this.imagenUrl)
  }


  getImageUrl(){
    //this.accessMapToken.containerName = this.authService.getCurrentPatient().sub.substr(1);
    //this.accessMapToken.patientId = this.authService.getCurrentPatient().sub;
    //this.blob.createContainerIfNotExists();

    this.imagenUrl='';
    var svgData = document.getElementById('svgData');
    var svgXML = new XMLSerializer().serializeToString(svgData);

    // make it base64
    var svg64 = btoa(svgXML);
    var b64Start = 'data:image/svg+xml;base64,';

    // prepend a "header"
    var image64 = b64Start + svg64;
    //console.log(image64);

    //canvas convert
    var canvas = document.createElement("canvas");
    canvas.width=1000;
    canvas.height=1000;

    //var img = document.createElement('img');
    var imageObj = new Image();
    imageObj.width=1000;
    imageObj.height=1000;
    imageObj.src=image64;

    var file;

    this.imageToBlobPart(imageObj,canvas, (byteArrays: Uint8Array) =>{
      this.byteArrays = byteArrays;
      console.log("Byte arrays change")
      console.log([this.byteArrays]);
      file = new File([this.byteArrays],"myMapdx29.png",{type:'image/png'});
      this.fileMap = file
      console.log(this.fileMap)
      this.uploadandGetImageUrl(file);

    });

  }

}
