
import bcrypt from 'bcryptjs';
import { readJson, writeJson, USERS_KEY, verifyToken, ensureAdmin } from './_util.mjs';

export default async (req, context) => {
  const payload = verifyToken(req.headers.get('authorization'));
  const body = await req.json().catch(()=>({}));
  const action = body?.action;
  if(!payload) return Response.json({ok:false,error:'Tidak sah'});
  if(!(await ensureAdmin(payload))) return Response.json({ok:false,error:'Admin sahaja'});

  const users = await readJson(USERS_KEY, []);

  if(action==='list'){
    return Response.json({ok:true, users: users.map(u=>({name:u.name,email:u.email,role:u.role,whatsapp:u.whatsapp}))});
  }

  if(action==='upsert'){
    const u = body.user||{};
    if(!u.email) return Response.json({ok:false,error:'Emel diperlukan'});
    let ex = users.find(x=>x.email===u.email.toLowerCase());
    if(!ex){
      ex = { email: u.email.toLowerCase(), name:u.name||'', role:u.role||'pegawai', whatsapp:u.whatsapp||'', password:'' };
      users.push(ex);
    } else {
      ex.name = u.name||ex.name;
      ex.role = u.role||ex.role;
      ex.whatsapp = u.whatsapp||ex.whatsapp;
    }
    if(u.password) ex.password = await bcrypt.hash(u.password, 10);
    await writeJson(USERS_KEY, users);
    return Response.json({ok:true});
  }

  if(action==='delete'){
    const email = (body.email||'').toLowerCase();
    const idx = users.findIndex(x=>x.email===email);
    if(idx>=0){ users.splice(idx,1); await writeJson(USERS_KEY, users); return Response.json({ok:true}); }
    return Response.json({ok:false,error:'Tiada'});
  }

  if(action==='seed'){
    // Minimal seed: timbalan + beberapa pegawai (boleh overwrite kemudian)
    const seeds = [
      {name:'SALASIAH BINTI RAHMAT@ ABDUL JABBAR', email:'salasiah.rahmat@moe.gov.my', role:'pengesah', whatsapp:'60197232300'},
      {name:'MOHAMAD RASHID BIN ISNIN', email:'rashid@moe.gov.my', role:'pegawai'},
      {name:'DIANA DJURAINI BINTI JOHARI', email:'dianajohari80@gmail.com', role:'admin'},
      {name:'MOHD SHAHRUL FADZLI BIN MALIKI', email:'shahrulfadzli@moe.gov.my', role:'pegawai'},
    ];
    for(const s of seeds){
      const found = users.find(u=>u.email===s.email);
      if(!found) users.push({...s, password: await bcrypt.hash('ppd12345',10)});
    }
    await writeJson(USERS_KEY, users);
    return Response.json({ok:true, count: users.length});
  }

  return Response.json({ok:false,error:'Aksi tidak dikenali'});
};
