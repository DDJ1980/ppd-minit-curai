
import { readJson, writeJson, MINIT_KEY, USERS_KEY, verifyToken } from './_util.mjs';

export default async (req, context) => {
  const payload = verifyToken(req.headers.get('authorization'));
  if(!payload) return Response.json({ok:false,error:'Sila log masuk'});
  const body = await req.json();
  const minit = await readJson(MINIT_KEY, []);
  const id = Date.now().toString(36);
  const item = { id, status:'PENDING', pegawai_email: payload.email, pegawai_nama: payload.name, ...body };
  minit.unshift(item);
  await writeJson(MINIT_KEY, minit);

  // Cari timbalan whatsapp
  const users = await readJson(USERS_KEY, []);
  const timb = users.find(u=>u.role==='pengesah');
  let wa = null;
  if(timb?.whatsapp){
    const msg = encodeURIComponent(`Minit Curai baru: ${item.tajuk} (${item.tarikh}) oleh ${item.pegawai_nama}`);
    wa = `https://wa.me/${timb.whatsapp}?text=${msg}`;
  }
  return Response.json({ok:true, id, wa});
};
