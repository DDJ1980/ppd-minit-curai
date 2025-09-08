
import { getAuditStore, requireAdmin } from "./_utils.js";
export default async (req, ctx) => {
  await requireAdmin(ctx);
  const s = await getAuditStore(); const l = await s.list(); let items = [];
  for (const key of l.blobs||[]) { if (!key.pathname.endsWith('.json')) continue; const it = await s.get(key.pathname,{type:'json'}); if (it) items.push(it); }
  items.sort((a,b)=> (a.at||0)-(b.at||0));
  const cols = ['id','type','by','target','at','emailed'];
  const rows = [cols.join(',')];
  for (const it of items) { const r = cols.map(k => '"' + String(it[k]??'').replaceAll('"','""') + '"').join(','); rows.push(r); }
  const csv = rows.join('\n');
  return new Response(csv, { status:200, headers: { "Content-Type":"text/csv; charset=utf-8" } });
}
