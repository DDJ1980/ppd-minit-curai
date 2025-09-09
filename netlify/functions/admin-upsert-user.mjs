
import { readJson, writeJson, USERS_KEY, requireAdmin, hashPassword } from './_util.mjs';
export default async (req, ctx)=>{
  try{
    await requireAdmin(req);
    const b = await req.json();
    const users = await readJson(USERS_KEY, []);
    let u = null;
    if(b.originalEmail){
      u = users.find(x=>x.email===b.originalEmail);
    }
    if(!u && b.email){
      u = users.find(x=>x.email===b.email);
    }
    if(!u){ u = { email: b.email }; users.push(u); }
    if(b.email) u.email = b.email;
    if(b.name!==undefined) u.name = b.name;
    if(b.role!==undefined) u.role = String(b.role||'pegawai').toLowerCase();
    if(b.whatsapp!==undefined) u.whatsapp = b.whatsapp;
    if(b.password){ u.passwordHash = await hashPassword(b.password); }
    await writeJson(USERS_KEY, users);
    return Response.json({ok:true});
  }catch(e){ return Response.json({ok:false,error:e.message}); }
};
