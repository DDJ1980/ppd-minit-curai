
import { readJson, writeJson, MINIT_KEY, verifyToken } from './_util.mjs';

export default async (req, context) => {
  const payload = verifyToken(req.headers.get('authorization'));
  if(!payload || payload.role!=='pengesah') return Response.json({ok:false,error:'Pengesah sahaja'});
  const body = await req.json();
  const items = await readJson(MINIT_KEY, []);
  const it = items.find(x=>x.id===body.id);
  if(!it) return Response.json({ok:false,error:'Tiada'});
  it.status='APPROVED';
  await writeJson(MINIT_KEY, items);
  return Response.json({ok:true});
};
