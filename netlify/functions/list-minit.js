
import { getMinitStore, ok, fail, requireUser, getPdfStore } from "./_utils.js";
export default async (req, ctx)=>{
 if(req.method!=="POST")return fail("Use POST",405);
 requireUser(ctx);
 const store=await getMinitStore(); const list=await store.list(); let items=[];
 for(const k of list.blobs||[]){ if(!k.pathname.endsWith('.json')) continue; const o=await store.get(k.pathname,{type:'json'}); if(o) items.push(o) }
 items.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));
 for(const it of items){ if(it.pdfKey){ try{ const ps=await getPdfStore(); it.pdfUrl=await ps.getSignedUrl(it.pdfKey,{expiresIn:1800}); }catch{} } }
 return ok({items});
}
