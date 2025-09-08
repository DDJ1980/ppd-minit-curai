
import { getMinitStore, getPdfStore, ok, fail, requireUser, logAudit, readUsers } from "./_utils.js";
import { PDFDocument, StandardFonts } from "pdf-lib";
import nodemailer from "nodemailer";
import fs from "fs/promises";

async function buildPdf(rec){
  const pdf=await PDFDocument.create(); const page=pdf.addPage([595,842]);
  const { width }=page.getSize(); const margin=50; let y=780;
  try{ const p=new URL('./assets/logo.png',import.meta.url); const bytes=await fs.readFile(p); const png=await pdf.embedPng(bytes); const w=120,h=(png.height/png.width)*w; page.drawImage(png,{x:(width-w)/2,y:y-h,width:w,height:h}); y-=h+10; }catch{}
  const font=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  function line(t,f=font,s=12,dy=16){ page.drawText(t,{x:margin,y, size:s, font:f}); y-=dy; }
  line('KEMENTERIAN PENDIDIKAN MALAYSIA', bold);
  line('PEJABAT PENDIDIKAN DAERAH MERSING', bold);
  y-=4; page.drawLine({start:{x:margin,y},end:{x:width-margin,y},thickness:1}); y-=16;
  line('Minit Curai • Sektor Pembelajaran', bold, 12);
  const rows=[ ['Tarikh',rec.tarikh],['Tempat',rec.tempat],['Masa',rec.masa],['Tajuk',rec.tajuk],['Pegawai',`${rec.pegawai_nama} <${rec.pegawai_email}>`],['Status','Disahkan'] ];
  for(const [k,v] of rows){ page.drawText(k+':',{x:margin,y,size:11,font:bold}); page.drawText(String(v||'-'),{x:margin+120,y,size:11,font}); y-=14; }
  y-=6; line('Catatan',bold,11,14); line(String(rec.catatan||'-'),font,11,14);
  y-=6; line('Tindakan PPD',bold,11,14); line(String(rec.tindakan_ppd||'-'),font,11,14);
  y-=6; line('Rumusan',bold,11,14); line(String(rec.rumusan||'-'),font,11,14);
  y=120; page.drawLine({start:{x:margin,y},end:{x:margin+220,y},thickness:1}); page.drawText('Timbalan Sektor Pembelajaran',{x:margin,y: y-14, size:10, font});
  const bytes=await pdf.save(); return bytes;
}

async function sendEmail(to, subject, text, bytes){
  const host=process.env.SMTP_HOST; const port=Number(process.env.SMTP_PORT||465); const user=process.env.SMTP_USER; const pass=process.env.SMTP_PASS;
  if(!host||!user||!pass) return {sent:false};
  const t=nodemailer.createTransport({host,port,secure:port===465,auth:{user,pass}});
  const info=await t.sendMail({ from:user, to, subject, text, attachments:[{filename:'minit-curai.pdf', content: Buffer.from(bytes)}] });
  return {sent:true, id:info.messageId};
}

export default async (req, ctx)=>{
 if(req.method!=="POST")return fail("Use POST",405);
 const user=requireUser(ctx);
 let b={}; try{b=await req.json()}catch{};
 const id=b.id; if(!id) return fail("ID diperlukan.");
 const store=await getMinitStore(); const key=id+".json"; const rec=await store.get(key,{type:'json'}); if(!rec) return fail("Rekod tidak ditemui.",404);
 rec.status="APPROVED"; rec.approvedAt=Date.now();
 const pdfBytes=await buildPdf(rec);
 const ps=await getPdfStore(); const pdfKey=id+'.pdf'; await ps.set(pdfKey,pdfBytes,{contentType:'application/pdf'});
 const url=await ps.getSignedUrl(pdfKey,{expiresIn:3600}); rec.pdfKey=pdfKey; await store.set(key,JSON.stringify(rec));
 const users=await readUsers(); const pengesah=(users.users||[]).find(u=>u.role==='pengesah');
 const recipients=[rec.pegawai_email]; if(pengesah?.email) recipients.push(pengesah.email);
 const sent=await sendEmail(recipients.join(','), 'Minit Curai Disahkan: '+rec.tajuk, 'Dilampirkan PDF minit curai yang disahkan.', pdfBytes);
 await logAudit({type:'APPROVE',by:user.email,id,at:Date.now(),emailed:sent.sent});
 return ok({pdfUrl:url, emailed:sent.sent});
}
