
import bcrypt from 'bcryptjs';
import { readJson, USERS_KEY, signToken } from './_util.mjs';

export default async (req, context) => {
  try{
    const body = await req.json();
    const { email, password } = body || {};
    if(!email || !password) return Response.json({ok:false,error:'Emel/kata laluan diperlukan'});
    const users = await readJson(USERS_KEY, []);
    const user = users.find(u=>u.email===String(email).toLowerCase());
    if(!user) return Response.json({ok:false,error:'Pengguna tiada'});
    const ok = await bcrypt.compare(password, user.password||'');
    if(!ok) return Response.json({ok:false,error:'Kata laluan salah'});
    const token = signToken(user);
    return Response.json({ok:true, token});
  }catch(e){ return Response.json({ok:false,error:e.message}); }
};
