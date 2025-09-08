
import { getMinitStore, requireAdmin } from "./_utils.js";
export default async (req, ctx) => {
  await requireAdmin(ctx);
  const store = await getMinitStore(); const list = await store.list(); let items = [];
  for (const key of list.blobs||[]) { if (!key.pathname.endsWith('.json')) continue; const it = await store.get(key.pathname, { type:'json' }); if (it) items.push(it); }
  items.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));
  const cols = ['tarikh','masa','tempat','tajuk','pegawai_nama','pegawai_email','status','tindakan_ppd','rumusan'];
  const rows = [cols.join(',')];
  for (const it of items) { const r = cols.map(k => '"' + String(it[k]||'').replaceAll('"','""') + '"').join(','); rows.push(r); }
  const csv = rows.join('\n');
  return new Response(csv, { status:200, headers: { "Content-Type":"text/csv; charset=utf-8" } });
}
