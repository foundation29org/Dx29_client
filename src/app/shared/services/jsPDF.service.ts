import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import * as htmlToImage from 'html-to-image';

import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

@Injectable()
export class jsPDFService {
    constructor(public translate: TranslateService) { }
    lang: string = '';

    generateTimelinePDF(timeLineElementId: string, listSymptoms): Promise<void>{
        document.getElementById(timeLineElementId).style.backgroundColor="white";

        return htmlToImage.toJpeg(document.getElementById(timeLineElementId), { quality: 0.95 })
        .then(function (dataUrl) {

            var doc = new jsPDF('portrait', 'px', 'a4') as jsPDFWithPlugin;
            var positionY = 0;
            const marginX = 5;
            
            const pdfPageWidth = doc.internal.pageSize.getWidth() - 2 * marginX;
            const pdfPageHeight = doc.internal.pageSize.getHeight()

            // Cabecera inicial
            var img_logo = new Image();
            img_logo.src = "https://dx29.ai/assets/img/logo-Dx29.png"
            doc.addImage(img_logo, 'png', 20, 10, 29, 17);
            doc.setFont(undefined, 'bold');
            doc.setFontSize(15);
            doc.text(this.translate.instant("land.diagnosed.timeline.Report"),(pdfPageWidth/2)-50, 17);

            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);

            this.writeHeader(doc, (pdfPageWidth/2)-20, 6, this.translate.instant("land.diagnosed.timeline.RegDate"));

            var actualDate = new Date();
            var dateHeader = this.getFormatDate(actualDate);
            this.writeDataHeader(doc, (pdfPageWidth/2)-23, 16, dateHeader);

           //Add QR
            var img_qr = new Image();
            img_qr.src = "https://dx29.ai/assets/img/elements/qr.png"
            doc.addImage(img_qr, 'png', pdfPageWidth-50, 5, 32, 30);

            positionY += 55

            // Doc image
            // this.timeLineImg(doc,dataUrl,timeLineElementId,positionY)

            // Doc table
            
            //doc.addPage();
            this.newHeatherAndFooter(doc);
            //positionY=40;
            //positionY = this.newSectionDoc(doc,this.translate.instant("land.diagnosed.timeline.Appendix1"), this.translate.instant("land.diagnosed.timeline.Symptoms"),this.translate.instant("land.diagnosed.timeline.Appendix1Desc"),positionY)
            this.timelineTable(doc,positionY,listSymptoms);
            
            var date = this.getDate();
            doc.save('Dx29_Timeline_' + date +'.pdf');
            
            return;

        }.bind(this));
    }

    private timeLineImg(doc,dataUrl,timeLineElementId,positionY){
        const marginX = 5;
            
        const pdfPageWidth = doc.internal.pageSize.getWidth() - 2 * marginX;
        const pdfPageHeight = doc.internal.pageSize.getHeight()

        var actualDate = new Date();

        // Generate timeline image
        var link = document.createElement('a');
        link.download = 'Dx29_Timeline_' + actualDate + '.jpeg';
        link.href = dataUrl;
        document.getElementById(timeLineElementId).style.removeProperty("background-color");

        // Doc image
        var img = new Image()
        img.src = dataUrl;
        const imgProps = (<any>doc).getImageProperties(img);
        
        
        var marginXimgDoc = 30;

        positionY = this.newSectionDoc(doc,null, this.translate.instant("land.diagnosed.timeline.title"),null, positionY)
        var marginheader = positionY;

        var imgWidth = pdfPageWidth-marginXimgDoc;
        var imgHeight = imgProps.height;
        
        if((imgHeight-pdfPageHeight)>0){
            imgWidth = pdfPageWidth/2;
            imgHeight = (imgProps.height/2);
            marginXimgDoc = (pdfPageWidth/2)-(pdfPageWidth/4);
        }

        var heightLeft = imgHeight;

        doc.addImage(img, 'JPG', marginXimgDoc, positionY, imgWidth, imgHeight, undefined, 'FAST');
        this.newHeatherAndFooter(doc);

        heightLeft -= (pdfPageHeight-marginheader);
        while (heightLeft >= 0) {
            positionY = (heightLeft - imgHeight); // top padding for other pages
            heightLeft -= (pdfPageHeight);
            doc.addPage();
            doc.addImage(img, 'JPG', marginXimgDoc, positionY, imgWidth, imgHeight, undefined, 'FAST');
            this.newHeatherAndFooter(doc);
        }
    }

    private timelineTable(doc,positionY,listSymptoms){
        var bodyTable = []
        //Order symptoms by onsetdate
        var listSymptomsSorted=listSymptoms.sort(this.keyAscOrder)
        for (var i = 0; i< listSymptomsSorted.length;i++){
            var name = listSymptomsSorted[i].name
            if(name==undefined){
                name = listSymptomsSorted[i].id + "-" + this.translate.instant("phenotype.Deprecated")
            }
            var id = listSymptomsSorted[i].id
            var onsetdate = listSymptomsSorted[i].onsetdate
            if((onsetdate==undefined)||(onsetdate==null)){
                onsetdate="-"
            }
            var finishdate = listSymptomsSorted[i].finishdate
            if((finishdate==undefined)||(finishdate==null)){
                finishdate="-"
            }
            var notes = listSymptomsSorted[i].notes
            if((notes==undefined)||(notes==null)){
                notes="-"
            }
            bodyTable.push([name,id,onsetdate,finishdate,notes])
            
        }
        doc.autoTable({
            head: [[this.translate.instant("generics.Name"), "ID", this.translate.instant("generics.Start Date"), this.translate.instant("generics.End Date"), this.translate.instant("generics.notes")]],
            body: bodyTable,
            startY: positionY,
            didDrawPage: (data)=>{
                this.newHeatherAndFooter(doc);
            }
        }); 
    }

    private keyAscOrder = ((a, b) => {
        return new Date(a.onsetdate).getTime() > new Date(b.onsetdate).getTime() ? -1 : (new Date(b.onsetdate).getTime() > new Date(a.onsetdate).getTime() ? 1 : 0);
    })


    private newSectionDoc(doc,sectionNumber,sectionTitle,sectionSubtitle,line){
        var title = sectionTitle;
        if(sectionNumber!=null){
            title=sectionNumber+".- "+sectionTitle;
        }
        var marginX = 30;
        //doc.rect(5, doc.internal.pageSize.getWidth()-80, line, line+30); // empty square
        doc.setTextColor(117, 120, 125)
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text(marginX, line, title);
        
        doc.setTextColor(0, 0, 0)
        if(sectionSubtitle!=null){
            var subtitle = sectionSubtitle;
            doc.setFont(undefined, 'italic');
            doc.setFontSize(12);
            doc.text(marginX, line+10, subtitle);
        }
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        return line + 20
    }

    private newHeatherAndFooter(doc){
        // Footer
        var logoHealth = new Image();
        logoHealth.src = "https://dx29.ai/assets/img/logo-foundation-twentynine-footer.png"
        doc.addImage(logoHealth, 'png', 20, 280, 25, 10);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 133, 133)
        doc.textWithLink("www.dx29.ai", 148, 286, { url: 'https://app.dx29.ai/Identity/Account/Register' });

    }

    private getFormatDate(date) {
        return date.getUTCFullYear() +
            '-' + this.pad(date.getUTCMonth() + 1) +
            '-' + this.pad(date.getUTCDate());
    }

    private pad(number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    }
    private checkIfNewPage(doc, lineText) {
        if (lineText < 274) {
            return lineText
        }
        else {
            doc.addPage()
            this.newHeatherAndFooter(doc)
            lineText = 20;
            return lineText;
        }
    }

    private writeTitleSection(doc, pos, lineText, text) {
        lineText = this.checkIfNewPage(doc, lineText);
        doc.setTextColor(117, 120, 125)
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text(text, pos, lineText);
        return lineText;
    }
    
    
    private writeHeaderText(doc, pos, lineText, text) {
        lineText = this.checkIfNewPage(doc, lineText);
        doc.setTextColor(117, 120, 125)
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(text, pos, lineText);
        return lineText;
    }
    
    private writeText(doc, pos, lineText, text) {
        lineText = this.checkIfNewPage(doc, lineText);
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(text, pos, lineText);
        return lineText;
    }
    
    private writeLinkHP(doc, pos, lineText, text) {
        lineText = this.checkIfNewPage(doc, lineText);
        doc.setTextColor(0, 133, 133)
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        var url = "https://hpo.jax.org/app/browse/term/" + text;
        doc.textWithLink(text, pos, lineText, { url: url });
        return lineText;
    }
    
    private writeLinkOrpha(doc, pos, lineText, text) {
        lineText = this.checkIfNewPage(doc, lineText);
        doc.setTextColor(0, 133, 133)
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        var param = text.split(':');
        var url = "https://www.orpha.net/consor/cgi-bin/OC_Exp.php?Expert=" + param[1] + "&lng=" + this.lang;
        doc.textWithLink(text, pos, lineText, { url: url });
        return lineText;
    }

    private writeHeader(doc, pos, lineText, text) {
        doc.setTextColor(117, 120, 125)
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(text, pos, lineText += 20);
    }

    private writeDataHeader(doc, pos, lineText, text) {
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.text(text, pos, lineText += 20);
    }

    private getDate() {
        var date = new Date()
        return date.getUTCFullYear() + this.pad(date.getUTCMonth() + 1) + this.pad(date.getUTCDate()) + this.pad(date.getUTCHours()) + this.pad(date.getUTCMinutes()) + this.pad(date.getUTCSeconds());
    };

    generateResultsPDF(infoSymptoms, infoDiseases, lang){
        this.lang = lang;
        const doc = new jsPDF();
        var lineText = 0;
        const marginX = 5;
        
        const pdfPageWidth = doc.internal.pageSize.getWidth() - 2 * marginX;
        const pdfPageHeight = doc.internal.pageSize.getHeight()

        // Cabecera inicial
        var img_logo = new Image();
        img_logo.src = "https://dx29.ai/assets/img/logo-Dx29.png"
        doc.addImage(img_logo, 'png', 20, 10, 29, 17);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(15);
        if(lang!='es'){
            doc.text(this.translate.instant("land.diagnosed.timeline.Report"), 83, 17);
        }else{
            doc.text(this.translate.instant("land.diagnosed.timeline.Report"), 80, 17);
        }
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        this.writeHeader(doc, 95, 2, this.translate.instant("land.diagnosed.timeline.RegDate"));

        var actualDate = new Date();
        var dateHeader = this.getFormatDate(actualDate);
        this.writeDataHeader(doc, 93, 7, dateHeader);

       //Add QR
        var img_qr = new Image();
        img_qr.src = "https://dx29.ai/assets/img/elements/qr.png"
        doc.addImage(img_qr, 'png', 160, 5, 32, 30);

        this.newHeatherAndFooter(doc);

        lineText += 35;

        //Symptoms
        const obj = infoSymptoms;
        lineText = this.writeTitleSection(doc, 10, lineText += 10, this.translate.instant("diagnosis.Symptoms"));
        this.writeHeaderText(doc, 10, lineText += 7, this.translate.instant("generics.Name"));
        this.writeHeaderText(doc, 175, lineText, "Id");
        lineText += 5;
        for (var i = 0; i < obj.length; i++) {
            lineText = this.writeText(doc, 10, lineText, obj[i].name);
            lineText = this.writeLinkHP(doc, 175, lineText, (obj[i].id).toUpperCase());
            lineText += 7;
        }

        //Diseases
        if(infoDiseases.length>0){
            lineText = this.writeTitleSection(doc, 10, lineText += 10, this.translate.instant("land.Diseases"));
            this.writeHeaderText(doc, 10, lineText += 7, this.translate.instant("generics.Name"));
            this.writeHeaderText(doc, 175, lineText, "Id");
            lineText += 5;
            for (var i = 0; i < infoDiseases.length; i++) {
                if(infoDiseases[i].name.length>99){
                    lineText = this.writeText(doc, 10, lineText, infoDiseases[i].name.substr(0,99));
                    lineText = this.writeLinkOrpha(doc, 175, lineText, (infoDiseases[i].id).toUpperCase());
                    lineText = lineText+5;
                    lineText = this.writeText(doc, 10, lineText, infoDiseases[i].name.substr(100));
                }else{
                    lineText = this.writeText(doc, 10, lineText, infoDiseases[i].name);
                    lineText = this.writeLinkOrpha(doc, 175, lineText, (infoDiseases[i].id).toUpperCase());
                }
                lineText += 7;
            }
        }
        
        var pageCount = doc.internal.pages.length; //Total Page Number
        pageCount = pageCount-1;
        for (i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            //footer page
            doc.text(this.translate.instant("land.page")+ ' ' + i + '/' + pageCount, 97, 286);
        }

        // Save file
        var date = this.getDate();
        doc.save('Dx29_Report_' + date + '.pdf');

    }

}
