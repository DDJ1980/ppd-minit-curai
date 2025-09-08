
import { getMinitStore, ok, fail, toId, readUsers, requireUser, logAudit } from "./_utils.js";
export default async (req, ctx)=>{
 if(req.method!=="POST")return fail("Use POST",405);
 let b={}; try{b=await req.json()}catch{};
 const reqd=["tarikh","tempat","masa","tajuk","catatan","tindakan_ppd","rumusan"]; for(const k of reqd) if(!b[k]) return fail("Medan wajib: "+k);
 const user=requireUser(ctx);
 const store=await getMinitStore(); const id=toId();
 const rec={ id, status:"PENDING", createdAt:Date.now(), ...b, pegawai_email:user.email, pegawai_nama:user.user_metadata?.full_name||user.email };
 await store.set(id+".json", JSON.stringify(rec));
 const users=await readUsers(); const pengesah=(users.users||[]).find(u=>u.role==="pengesah");
 let wa=null; if(pengesah?.whatsapp){ const text=encodeURIComponent(`Minit curai baharu menunggu semakan: ${rec.tajuk} pada ${rec.tarikh}.`); wa=`https://wa.me/${encodeURIComponent(pengesah.whatsapp)}?text=${text}` }
 await logAudit({type:"SUBMIT",by:user.email,id,at:Date.now()});
 return ok({id,wa});
}
