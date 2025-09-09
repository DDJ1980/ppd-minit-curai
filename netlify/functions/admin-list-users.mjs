
import { readJson, USERS_KEY, requireAdmin } from './_util.mjs';
export default async (req, ctx) => {
  try{
    await requireAdmin(req);
    const users = await readJson(USERS_KEY, []);
    const safe = users.map(({passwordHash, ...u}) => u);
    return Response.json({ok:true, users: safe});
  }catch(e){ return Response.json({ok:false, error: e.message}); }
};
