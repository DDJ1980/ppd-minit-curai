
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readJson, writeJson, MINIT_KEY, USERS_KEY, verifyToken } from './_util.mjs';

function nowMY(){ const d=new Date(), p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
function wrap(t,n){const w=String(t||'').split(/\s+/);const L=[];let l='';for(const x of w){if((l+' '+x).trim().length>n){L.push(l.trim());l=x;}else l=(l?l+' ':'')+x;} if(l.trim())L.push(l.trim()); return L;}
async function buildPdfBuffer(item, signerName){
  const pdf=await PDFDocument.create(); const page=pdf.addPage([595,842]); const {width,height}=page.getSize(); const m=40;
  const fb=await pdf.embedFont(StandardFonts.HelveticaBold); const fr=await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText('PEJABAT PENDIDIKAN DAERAH MERSING',{x:m,y:height-m-30,size:12,font:fb});
  page.drawText('APLIKASI PEREKODAN MINIT CURAI • SEKTOR PEMBELAJARAN',{x:m,y:height-m-48,size:10,font:fb,color:rgb(0.07,0.23,0.51)});
  page.drawLine({start:{x:m,y:height-m-60},end:{x:width-m,y:height-m-60},thickness:0.7,color:rgb(0.82,0.82,0.82)});
  let y=height-m-90; const line=(a,b)=>{page.drawText(a,{x:m,y,size:11,font:fb}); page.drawText(String(b||'-'),{x:m+120,y,size:11,font:fr}); y-=18;};
  line('Tarikh',item.tarikh); line('Masa',item.masa); line('Tempat',item.tempat); line('Tajuk',item.tajuk); line('Pegawai',`${item.pegawai_nama||''} <${item.pegawai_email||''}>`);
  y-=8; const para=(a,t)=>{page.drawText(a,{x:m,y,size:11,font:fb}); y-=16; for(const ln of wrap(t,85)){ page.drawText(ln,{x:m,y,size:11,font:fr}); y-=14;} y-=6;};
  para('Catatan',item.catatan); para('Tindakan PPD',item.tindakan_ppd); para('Rumusan',item.rumusan);
  const sigY=y-10;
  try{ const sig=fs.readFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname),'assets','signature.png'));
    const sp=await pdf.embedPng(sig); const d=sp.scale(0.5); page.drawImage(sp,{x:m+120,y:sigY-40,width:Math.min(220,d.width),height:Math.min(80,d.height)});
  }catch{}
  page.drawText('Disahkan oleh',{x:m,y:sigY,size:11,font:fb});
  page.drawText(`${signerName||'Timbalan Sektor Pembelajaran'}`,{x:m+120,y:sigY,size:11,font:fr});
  page.drawText(`Ditandatangani secara digital • ${nowMY()}`,{x:m+120,y:sigY-16,size:10,font:fr,color:rgb(0.27,0.27,0.27)});
  const bytes=await pdf.save(); return Buffer.from(bytes);
}
async function sendEmailWithPdf(toList, ccList, subject, html, pdfBuffer, filename){
  const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS}=process.env;
  if(!SMTP_HOST||!SMTP_PORT||!SMTP_USER||!SMTP_PASS) throw new Error('SMTP belum dikonfigurasi.');
  const transporter=nodemailer.createTransport({host:SMTP_HOST,port:Number(SMTP_PORT),secure:Number(SMTP_PORT)===465,auth:{user:SMTP_USER,pass:SMTP_PASS}});
  await transporter.sendMail({from:SMTP_USER,to:toList.join(','),cc:(ccList||[]).join(','),subject,html,attachments:[{filename,content:pdfBuffer}]});
}
export default async (req,ctx)=>{
  try{
    const payload = verifyToken(req.headers.get('authorization'));
    if(!payload || payload.role!=='pengesah') return Response.json({ok:false,error:'Pengesah sahaja'});
    const body=await req.json();
    const items=await readJson(MINIT_KEY,[]);
    const it=items.find(x=>x.id===body.id);
    if(!it) return Response.json({ok:false,error:'Tiada'});
    it.status='APPROVED'; it.pengesah_nama = payload.name||''; it.approved_at = new Date().toISOString().slice(0,16).replace('T',' ');
    await writeJson(MINIT_KEY, items);
    const users=await readJson(USERS_KEY,[]);
    const pengesah = users.find(u=>u.role==='pengesah') || {email: payload.email};
    const signerName = pengesah?.name || payload.name || 'Timbalan Sektor Pembelajaran';
    const clerkCC = process.env.CLERK_CC_EMAIL || 'rosnani.zainal@moe.gov.my';
    const pdfBuffer = await buildPdfBuffer(it, signerName);
    const dataUrl=`data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    const toList=[it.pegawai_email]; if(pengesah?.email) toList.push(pengesah.email);
    try{ await sendEmailWithPdf(toList, clerkCC?[clerkCC]:[], `Minit Curai Disahkan: ${it.tajuk}`, `<p>Minit curai bertarikh <b>${it.tarikh}</b> telah disahkan.</p>`, pdfBuffer, `MinitCurai-${it.tarikh}-${(it.pegawai_nama||'pegawai').replace(/[^A-Za-z0-9_-]+/g,'_')}.pdf`);}catch(e){}
    return Response.json({ok:true,pdfDataUrl:dataUrl});
  }catch(e){ return Response.json({ok:false,error:e.message}); }
};
