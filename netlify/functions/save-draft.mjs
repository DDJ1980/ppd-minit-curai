
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readJson, writeJson, MINIT_KEY, verifyToken } from './_util.mjs';
async function build(item){
  const pdf=await PDFDocument.create(); const p=pdf.addPage([595,842]); const {width,height}=p.getSize(); const m=40;
  const fb=await pdf.embedFont(StandardFonts.HelveticaBold); const fr=await pdf.embedFont(StandardFonts.Helvetica);
  p.drawText('MINIT CURAI • DRAF', {x:m,y:height-m-20,size:12,font:fb,color:rgb(0.05,0.2,0.55)});
  let y=height-m-50; const line=(a,b)=>{p.drawText(a,{x:m,y,size:11,font:fb}); p.drawText(String(b||'-'),{x:m+120,y,size:11,font:fr}); y-=18;};
  line('Tarikh',item.tarikh); line('Masa',item.masa); line('Tempat',item.tempat); line('Tajuk',item.tajuk); y-=8;
  const para=(lab,txt)=>{p.drawText(lab,{x:m,y,size:11,font:fb}); y-=16; const words=String(txt||'').split(/\\s+/); let ln=''; for(const w of words){ if((ln+' '+w).trim().length>85){ p.drawText(ln.trim(),{x:m,y,size:11,font:fr}); y-=14; ln=w;} else ln=(ln?ln+' ':'')+w;} if(ln){p.drawText(ln.trim(),{x:m,y,size:11,font:fr}); y-=14;} y-=6;};
  para('Catatan',item.catatan); para('Tindakan PPD',item.tindakan_ppd); para('Rumusan',item.rumusan);
  p.drawText('D R A F T',{x:width/2-80,y:height/2,size:48,font:fb,color:rgb(0.8,0.85,0.95),rotate:{angle:-25}});
  const bytes=await pdf.save(); return Buffer.from(bytes);
}
export default async (req,ctx)=>{
  try{
    const payload = verifyToken(req.headers.get('authorization'));
    if(!payload || payload.role!=='pegawai') return Response.json({ok:false,error:'Pegawai sahaja'});
    const body=await req.json(); const items=await readJson(MINIT_KEY,[]);
    const id='D'+Date.now(); const it={id,status:'DRAFT',pegawai_email:payload.email,pegawai_nama:payload.name||'',...body};
    items.push(it); await writeJson(MINIT_KEY, items);
    const buf=await build(it); const url='data:application/pdf;base64,'+buf.toString('base64');
    return Response.json({ok:true,id, pdfDataUrl:url});
  }catch(e){ return Response.json({ok:false,error:e.message}); }
};
