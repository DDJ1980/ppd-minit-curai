
import { readUsers, saveUsers, ok, fail, requireAdmin, logAudit } from "./_utils.js";
const seed = {
  "users": [
    {
      "name": "SALASIAH BINTI RAHMAT @ ABDUL JABBAR",
      "email": "salasiah.rahmat@moe.gov.my",
      "role": "pengesah",
      "whatsapp": "60197232300"
    },
    {
      "name": "ENCIK MOHD NIZAM BIN NGATMAN",
      "email": "mohd.nizam@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "MOHAMAD RASHID ISNIN",
      "email": "mrashid.isnin@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "MOHD FARID BIN ITHNIN",
      "email": "mohdfaridithnin@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "MOHD SHAHRIN ZAKARIA",
      "email": "shahrin.zakaria@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "MOHD SHAHRUL FADZLI BIN MALIKI",
      "email": "mohd.shahrul@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "MUHAMMAD WIDAD BIN ISHAK",
      "email": "widadishak@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "NORHAFIDZAH KAMSAN",
      "email": "hafizah.kamsan@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "OLLY ROZITA MOHAMED ZAIN",
      "email": "rozita.mzain@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "PUAN DIANA DJURAINI BINTI JOHARI",
      "email": "diana.j@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "PUAN NOOR HAZWANI BINTI ZAINUDIN",
      "email": "noorhazwani@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "PUAN NORASHIKIN BT AWANG",
      "email": "norashikin.awang@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "PUAN NORZALILAFARHAH BINTI ZAINUDIN",
      "email": "norzalilafarhah@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "ZAINUDIN BIN OTHMAN",
      "email": "zainudin@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "ZANARIAH BASRI",
      "email": "zanariah.basri@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "CIK MAZNAH BINTI GHAZALI",
      "email": "cik.maznah@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "ROSNANI BINTI ZAINAL",
      "email": "rosnani.zainal@moe.gov.my",
      "role": "pegawai"
    },
    {
      "name": "ENCIK OTHMAN BIN YUNUS",
      "email": "othman.yunus@moe.gov.my",
      "role": "pegawai"
    }
  ]
};
export default async (req, ctx)=>{
  if(req.method!=="POST")return fail("Use POST",405);
  let body={}; try{body=await req.json()}catch{}
  const action=body.action;
  if(action==="whoami"){ try{await requireAdmin(ctx); return ok({isAdmin:true})}catch(e){return fail(e.message||"Admin only",403)} }
  try{await requireAdmin(ctx)}catch(e){return fail(e.message||"Admin only",403)}
  if(action==="list"){ const d=await readUsers(); return ok({users:d.users}) }
  if(action==="upsert"){ const u=body.user||{}; if(!u.email||!u.role) return fail("Email & role wajib"); const d=await readUsers(); const i=(d.users||[]).findIndex(x=>(x.email||'').toLowerCase()===u.email.toLowerCase()); if(i>=0)d.users[i]={...d.users[i],...u}; else d.users.push(u); await saveUsers(d); await logAudit({type:"USER_UPSERT",by:ctx.clientContext.user.email,target:u.email,at:Date.now()}); return ok({}) }
  if(action==="delete"){ const email=(body.email||'').toLowerCase(); const d=await readUsers(); d.users=(d.users||[]).filter(x=>(x.email||'').toLowerCase()!==email); await saveUsers(d); await logAudit({type:"USER_DELETE",by:ctx.clientContext.user.email,target:email,at:Date.now()}); return ok({}) }
  if(action==="seed"){ const d=await readUsers(); if((d.users||[]).length>0) return ok({note:"already"}); await saveUsers(seed); await logAudit({type:"SEED",by:ctx.clientContext.user.email,at:Date.now()}); return ok({seeded:true}) }
  return fail("Unknown")
}
