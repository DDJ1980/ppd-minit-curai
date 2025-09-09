
import { readJson, writeJson, USERS_KEY, requireAdmin } from './_util.mjs';
export default async (req, ctx) => {
  try{
    await requireAdmin(req);
    const body = await req.json();
    if(!body?.email) return Response.json({ok:false, error:'email kosong'});
    const users = await readJson(USERS_KEY, []);
    const idx = users.findIndex(u => u.email === body.email);
    if(idx === -1) return Response.json({ok:false, error:'user tidak ditemui'});
    users.splice(idx, 1);
    await writeJson(USERS_KEY, users);
    return Response.json({ok:true});
  }catch(e){ return Response.json({ok:false, error: e.message}); }
};
