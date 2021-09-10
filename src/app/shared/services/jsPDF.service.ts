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
    constructor(public translate: TranslateService,) { }

    generateTimelinePDF(timeLineElementId: string, listSymptoms): Promise<string>{
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

            // Generate timeline image
            var link = document.createElement('a');
            link.download = 'Dx29_Timeline_' + actualDate + '.jpeg';
            link.href = dataUrl;
            document.getElementById(timeLineElementId).style.removeProperty("background-color");

            // Doc image
            var img = new Image()
            img.src = dataUrl;
            const imgProps = (<any>doc).getImageProperties(img);


            this.newHeatherAndFooter(doc);
            positionY += 55
            positionY = this.newSectionDoc(doc,null, this.translate.instant("land.diagnosed.timeline.title"),null, positionY)
            var headermargin = positionY;

            var imgHeight = imgProps.height;
            var heightLeft = imgHeight;
            var imgShowHeight = imgHeight-headermargin-30;

            doc.addImage(img, 'JPG', marginX, positionY, pdfPageWidth/2, imgShowHeight, undefined, 'FAST');
            heightLeft -= pdfPageHeight;
            
            while (heightLeft >= 0) {
                positionY = (heightLeft - imgHeight); // top padding for other pages
                heightLeft -= pdfPageHeight;
                doc.addPage();
                doc.addImage(img, 'JPG', marginX, positionY, pdfPageWidth/2, imgShowHeight, undefined, 'FAST');
                //this.newHeatherAndFooter(doc);
            }

            // Doc table
            doc.addPage();
            this.newHeatherAndFooter(doc);
            positionY = this.newSectionDoc(doc,this.translate.instant("land.diagnosed.timeline.Appendix1"), this.translate.instant("land.diagnosed.timeline.Symptoms"),this.translate.instant("land.diagnosed.timeline.Appendix1Desc"),positionY)

            var bodyTable = []
            for (var i = 0; i< listSymptoms.length;i++){
                var name = listSymptoms[i].name
                if(name==undefined){
                    name = listSymptoms[i].id + "-" + this.translate.instant("phenotype.Deprecated")
                }
                var id = listSymptoms[i].id
                var onsetdate = listSymptoms[i].onsetdate
                if((onsetdate==undefined)||(onsetdate==null)){
                    onsetdate="-"
                }
                var finishdate = listSymptoms[i].finishdate
                if((finishdate==undefined)||(finishdate==null)){
                    finishdate="-"
                }
                var notes = listSymptoms[i].notes
                if((notes==undefined)||(notes==null)){
                    notes="-"
                }
                bodyTable.push([name,id,onsetdate,finishdate,notes])
                
            }
            doc.autoTable({
                head: [[this.translate.instant("generics.Name"), "ID", this.translate.instant("generics.Start Date"), this.translate.instant("generics.End Date"), this.translate.instant("generics.notes")]],
                body: bodyTable,
                startY: positionY
            }); 
            doc.save('Dx29_Timeline_' + actualDate +'.pdf');
            
            return doc.output('datauristring');

        }.bind(this));
    }

    private newSectionDoc(doc,sectionNumber,sectionTitle,sectionSubtitle,line){
        line = line + 20;
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

    private newHeatherAndFooter(doc, line){
        // Footer
        const pdfPageWidth = doc.internal.pageSize.getWidth() - 10;
        const pdfPageHeight = doc.internal.pageSize.getHeight()

        var logoHealth = new Image();
        logoHealth.src = "https://dx29.ai/assets/img/logo-foundation-twentynine-footer.png"
        doc.addImage(logoHealth, 'png', 20, pdfPageHeight-20, 35, 20);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 133, 133)
        doc.textWithLink("www.dx29.ai", pdfPageWidth-50, pdfPageHeight-20, { url: 'https://app.dx29.ai/Identity/Account/Register' });

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

    writeHeader(doc, pos, lineText, text) {
        doc.setTextColor(117, 120, 125)
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(text, pos, lineText += 20);
    }

    writeDataHeader(doc, pos, lineText, text) {
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.text(text, pos, lineText += 20);
    }

}
