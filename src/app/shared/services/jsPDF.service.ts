import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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

    generateTimelinePDF(lang, dictionaryTimeline, listSymptomsNullInfo){
        var doc = new jsPDF as jsPDFWithPlugin;
        var positionY = 0;
        const marginX = 5;
        
        const pdfPageWidth = doc.internal.pageSize.getWidth() - 2 * marginX;
        const pdfPageHeight = doc.internal.pageSize.getHeight()

        // Cabecera inicial
        var img_logo = new Image();
        img_logo.src = "assets/img/logo-Dx29.png"
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
        this.writeHeader(doc, 91, 2, this.translate.instant("land.diagnosed.timeline.RegDate"));

        var actualDate = new Date();
        var dateHeader = this.getFormatDate(actualDate);
        this.writeDataHeader(doc, 93, 7, dateHeader);


        //Add QR
        var img_qr = new Image();
        img_qr.src = "assets/img/elements/qr.png"
        doc.addImage(img_qr, 'png', 160, 5, 32, 30);

        this.newHeatherAndFooter(doc);
        positionY += 35;

        doc.setDrawColor(222,226,230);
        positionY = this.drawTimeLine(doc,dictionaryTimeline, listSymptomsNullInfo, positionY);

        doc.addPage();
        this.newHeatherAndFooter(doc);
        
        positionY = 15;
        this.timelineTable(doc,positionY,dictionaryTimeline, listSymptomsNullInfo);
        
        var date = this.getDate();
        doc.save('Dx29_Timeline_' + date +'.pdf');
        
        return;
    }

    private drawTimeLine(doc, dictionaryTimeline, listSymptomsNullInfo, posY){
        //draw dictionaryTimeline
        var positionY = posY;
            for (var itemDate in dictionaryTimeline){
                positionY = this.drawLabelTimeLine(doc, itemDate, positionY);
                for (var date in dictionaryTimeline[itemDate]){
                    var lineHeight = (5*(dictionaryTimeline[itemDate][date].length)+45)+positionY;
                    doc.line(15, positionY-10, 15, lineHeight);
                    positionY = this.drawBoxTimeLine(doc, dictionaryTimeline[itemDate][date], date, positionY);
                }
            }
        
        if(listSymptomsNullInfo.length>0){
            this.drawListSymptomsNullInfo(doc, listSymptomsNullInfo, positionY);
        }
        

        return positionY;
    }

    private drawLabelTimeLine(doc, itemDate, positionY){
        var posInit = positionY;
        positionY = this.checkIfNewPage2(doc, positionY+20);
        if(positionY!=20){
            positionY =posInit;
        }else{
            posInit = positionY;
        }
        doc.setFillColor(0,157,160);
        doc.rect(15, positionY += 15, (itemDate.length*2)+3, 7, 'FD'); //Fill and Border
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        
        doc.text(itemDate, 17, posInit += 20);
        positionY += 10;
        doc.setTextColor(0, 0, 0)
        return positionY;
    }

    private drawBoxTimeLine(doc, dateinfo,date, positionY){
        var posInit = positionY;
        var posiblePos = positionY+((5*(dateinfo.length)+10));
        if(posiblePos<270){
            positionY = this.checkIfNewPage2(doc, posiblePos);
            if(positionY!=20){
                positionY =posInit;
            }else{
                posInit = positionY;
            }
        }else{
            positionY =posInit;
        }
        
        var calendarIcon = new Image();
        calendarIcon.src = "assets/img/pdf/ft-calendar.png"//https://dx29.ai/assets/img/pdf/ft-calendar.png
        doc.addImage(calendarIcon, 'png', 15, (positionY+4), 7, 7);
        
        doc.setFillColor(255, 255, 255);
        var heightRect = (5*(dateinfo.length)+10);
        if(heightRect+positionY>235){
            heightRect = (235-(posInit))+35;
        }
        doc.rect(25, (positionY+4), 150, heightRect, 'FD'); //Fill and Border
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.text(date, 30, posInit += 10);
        doc.line(30, posInit+1, 170, posInit+1);
        posInit= posInit+1;
        for (var i=0;i<dateinfo.length;i++){
            posInit = this.checkIfNewPage(doc, posInit);
            if(posInit==20){
                //is new page
                doc.setFillColor(255, 255, 255);
                doc.rect(25, (posInit+4), 150, ((5*(dateinfo.length-i)+10)-5), 'FD'); //Fill and Border
                doc.setTextColor(0, 0, 0)
                posInit= posInit+5;
                doc.setFont(undefined, 'bold');
                var lineHeight = (5*(dateinfo.length-i)+45)+positionY;
                doc.line(15, 20, 15, lineHeight);
            }
            var url = "https://hpo.jax.org/app/browse/term/" + dateinfo[i].id;
            doc.setTextColor(51, 101, 138);
            doc.textWithLink(dateinfo[i].name, 30, posInit+= 5, { url: url });
        }
        doc.setTextColor(0, 0, 0)
        //doc.text(date, 15, positionY += 20);
        positionY= posInit+ 5;
        return positionY;
    }

    private drawListSymptomsNullInfo(doc, listSymptomsNullInfo, positionY){
        var posInit = positionY;
        doc.setFillColor(0,157,160);
        doc.rect(15, positionY += 15, 53, 7, 'FD'); //Fill and Border
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        positionY = this.checkIfNewPage(doc, positionY);
        doc.text(this.translate.instant("land.diagnosed.symptoms.NoOnset"), 17, posInit += 20);
        positionY += 10;
        doc.setTextColor(0, 0, 0);
        var calendarIcon = new Image();
        calendarIcon.src = "assets/img/pdf/ft-help.png"//https://dx29.ai/assets/img/pdf/ft-help.png
        doc.addImage(calendarIcon, 'png', 15, (positionY+4), 7, 7);
        doc.setFillColor(255, 255, 255);
        var heightRect = (5*(listSymptomsNullInfo.length)+5);
        if(heightRect+positionY>235){
            heightRect = (235-(posInit))+30;
        }
        doc.rect(25, (positionY+4), 150, heightRect, 'FD'); //Fill and Border
        doc.setTextColor(0, 0, 0)
        posInit= posInit+10;
        for (var i=0;i<listSymptomsNullInfo.length;i++){
            posInit = this.checkIfNewPage(doc, posInit);
            if(posInit==20){
                //is new page
                doc.setFillColor(255, 255, 255);
                doc.rect(25, (posInit+4), 150, ((5*(listSymptomsNullInfo.length-i)+5)), 'FD'); //Fill and Border
                doc.setTextColor(0, 0, 0)
                posInit= posInit+5;
                doc.setFont(undefined, 'bold');
            }
            var url = "https://hpo.jax.org/app/browse/term/" + listSymptomsNullInfo[i].id;
            doc.setTextColor(51, 101, 138);
            doc.textWithLink(listSymptomsNullInfo[i].name, 30, posInit+= 5, { url: url });
        }
        doc.setTextColor(0, 0, 0)
        //doc.text(date, 15, positionY += 20);
        positionY= posInit+ 5;
        return positionY;
    }

    private timelineTable(doc,positionY,dictionaryTimeline, listSymptomsNullInfo){
        var bodyTable = []
        var notesBodyTable={};
        for (var itemDate in dictionaryTimeline){
            for (var date in dictionaryTimeline[itemDate]){
                for (var i=0;i<dictionaryTimeline[itemDate][date].length;i++){
                    var name = dictionaryTimeline[itemDate][date][i].name
                    if(name==undefined){
                        name = dictionaryTimeline[itemDate][date][i].id + "-" + this.translate.instant("phenotype.Deprecated")
                    }
                    var id = dictionaryTimeline[itemDate][date][i].id
                    var onsetdate = dictionaryTimeline[itemDate][date][i].onsetdate
                    if((onsetdate==undefined)||(onsetdate==null)){
                        onsetdate="-"
                    }
                    var finishdate = dictionaryTimeline[itemDate][date][i].finishdate
                    if((finishdate==undefined)||(finishdate==null)){
                        finishdate="-"
                    }
                    var duration="-"
                    if(((onsetdate!=undefined)&&(onsetdate!=null))&&((finishdate!=undefined)&&(finishdate!=null))){
                        duration = this.dateDiff(onsetdate,finishdate)
                    }
                    var notes = null;
                    if((dictionaryTimeline[itemDate][date][i].notes!=null)&&(dictionaryTimeline[itemDate][date][i].notes!=undefined)){
                        notes = dictionaryTimeline[itemDate][date][i].notes
                    }

                    var symptom = [{content:name,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}},{content:duration,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}},{content:onsetdate,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}},{content:finishdate,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}},{content:id,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}}]
                    var foundInBodyTable = false;
                    
                    for(var j=0;j<bodyTable.length;j++){
                        if(bodyTable[j].content == (id)){
                            foundInBodyTable=true
                        }
                    }
                    if(!foundInBodyTable){
                        bodyTable.push(symptom)
                        if(notes!=null){
                            notesBodyTable[id]=notes;
                        }
                    }
                }
            }
        }

        bodyTable.reverse(); // Mas antiguos primero

        for(var j=0;j<listSymptomsNullInfo.length;j++){

            var name2 = listSymptomsNullInfo[j].name
            if(name2==undefined){
                name2 = listSymptomsNullInfo[j].id + "-" + this.translate.instant("phenotype.Deprecated")
            }
            var id2 = listSymptomsNullInfo[j].id
            var onsetdate2 = "-";
            var finishdate2 = "-";
            var duration2="-";

            var notes2 = null;
            if((listSymptomsNullInfo[j].notes!=null)&&(listSymptomsNullInfo[j].notes!=undefined)){
                notes2 = listSymptomsNullInfo[j].notes
            }

            var symptom2 = [{content:name2,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}},{content:duration2,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}},{content:onsetdate2,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}},{content:finishdate2,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}},{content:id2,colSpan:1,styles:{fontSize:12, fontStyle: 'normal'}}]
            var foundInBodyTable = false;
            for(var k=0;k<bodyTable.length;k++){
                if(bodyTable[k].content == (id2)){
                    foundInBodyTable=true
                }
            }
            if(!foundInBodyTable){
                bodyTable.push(symptom2)
                if(notes2!=null){
                    notesBodyTable[id2]=notes2;
                }
            }
        } // Despues los que no tienen info de fechas

        // Add notes 
        for(var i = 0; i < bodyTable.length; i++){
            for(var j=0; j< bodyTable[i].length;j++){
                if(Object.keys(notesBodyTable).includes(bodyTable[i][j].content)){
                    bodyTable.splice(i+1,0,[{content:this.translate.instant("generics.notes")+": "+ notesBodyTable[bodyTable[i][j].content],colSpan:5,styles:{fontSize:10, fontStyle: 'italic'}}])
                }
            }
        }

        doc.autoTable({
            head: [[this.translate.instant("generics.Name"),this.translate.instant("land.diagnosed.timeline.Duration"),this.translate.instant("generics.Start Date"), this.translate.instant("generics.End Date"),"ID"]],
            body: bodyTable,
            startY: positionY,
            theme: 'plain',
            didDrawPage: ()=>{
                this.newHeatherAndFooter(doc);
            },
            willDrawCell:(data)=>{
                if (data.cell.section === 'body' && data.column.index === 4) {
                    var text = data.cell.text.toString()
                    data.cell.text = ""
                    doc.setTextColor(0, 133, 133)
                    var url = "https://hpo.jax.org/app/browse/term/" + text;
                    doc.textWithLink(text, (data.cell.x+data.cell.styles.cellPadding), (data.cell.y+3*+data.cell.styles.cellPadding), { url: url });
                }
            }
            
        }); 
    }

    dateDiff(d1, d2) {
        var months=0;
        var years=0;
        months = (new Date(d2).getFullYear() - new Date(d1).getFullYear()) * 12;
        months -= new Date(d1).getMonth();
        months += new Date(d2).getMonth();
        if(months>=12){
            years = Math.floor(months/12)
            months -=  years*12
        }
        var result="";
        if((months>1)&&(years>1)){
            result=years+" "+this.translate.instant("land.diagnosed.timeline.years")+" "+this.translate.instant("land.diagnosed.timeline.and")+" "+months+" "+this.translate.instant("land.diagnosed.timeline.months")
        }
        else if((months>1)&&(years==1)){
            result=years+" "+this.translate.instant("land.diagnosed.timeline.year")+" "+this.translate.instant("land.diagnosed.timeline.and")+" "+months+" "+this.translate.instant("land.diagnosed.timeline.months")
        }
        else if((months>1)&&(years<1)){
            result=months+" "+this.translate.instant("land.diagnosed.timeline.months")
        }
        else if((months==1)&&(years<1)){
            result=months+" "+this.translate.instant("land.diagnosed.timeline.month")
        }
        else if((months<1)&&(years>1)){
            result=years+" "+this.translate.instant("land.diagnosed.timeline.years")
        }
        else if((months<1)&&(years==1)){
            result=years+" "+this.translate.instant("land.diagnosed.timeline.year")

        }
        else if((months<1)&&(years<1)){
            result=this.translate.instant("land.diagnosed.timeline.Less than a month")
        }
        return result;
    }

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
        logoHealth.src = "assets/img/logo-foundation-twentynine-footer.png"
        doc.addImage(logoHealth, 'png', 20, 280, 25, 10);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 133, 133)
        doc.textWithLink("www.dx29.ai", 148, 286, { url: 'https://app.dx29.ai/Identity/Account/Register' });
        doc.setTextColor(0, 0, 0);
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
        if (lineText < 270) {
            return lineText
        }
        else {
            doc.addPage()
            this.newHeatherAndFooter(doc)
            lineText = 20;
            return lineText;
        }
    }

    private checkIfNewPage2(doc, lineText) {
        if (lineText < 270) {
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
        doc.setTextColor(0, 0, 0);
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
        doc.setTextColor(0, 0, 0);
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
        img_logo.src = "assets/img/logo-Dx29.png"
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
        this.writeHeader(doc, 91, 2, this.translate.instant("land.diagnosed.timeline.RegDate"));

        var actualDate = new Date();
        var dateHeader = this.getFormatDate(actualDate);
        this.writeDataHeader(doc, 93, 7, dateHeader);

       //Add QR
        var img_qr = new Image();
        img_qr.src = "assets/img/elements/qr.png"
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
