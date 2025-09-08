
import { readJson, MINIT_KEY, verifyToken } from './_util.mjs';

export default async (req, context) => {
  const payload = verifyToken(req.headers.get('authorization'));
  if(!payload) return Response.json({ok:false,error:'Sila log masuk'});
  const items = await readJson(MINIT_KEY, []);
  return Response.json({ok:true, items});
};
