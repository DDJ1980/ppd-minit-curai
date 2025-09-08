
import bcrypt from 'bcryptjs';
import { readJson, writeJson, USERS_KEY } from './_util.mjs';

export default async (req, context) => {
  try{
    const body = await req.json();
    const { setupKey, name, email, password } = body || {};
    if(!setupKey || !name || !email || !password) return new Response(JSON.stringify({ok:false,error:'Data tidak lengkap'}),{status:400});
    if(setupKey !== (process.env.ADMIN_SETUP_KEY||'')) return new Response(JSON.stringify({ok:false,error:'Setup key salah'}),{status:401});
    const users = await readJson(USERS_KEY, []);
    if(users.find(u=>u.role==='admin')) return Response.json({ok:false,error:'Admin sudah wujud'});
    const hash = await bcrypt.hash(password, 10);
    users.push({name, email:email.toLowerCase(), role:'admin', whatsapp:'', password:hash});
    await writeJson(USERS_KEY, users);
    return Response.json({ok:true});
  }catch(e){ return Response.json({ok:false,error:e.message}); }
};
