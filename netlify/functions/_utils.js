
import { getStore } from "@netlify/blobs";
const USERS_KEY="config/users.json";
export async function getUsersStore(){return getStore("config")}
export async function getMinitStore(){return getStore("minit")}
export async function getPdfStore(){return getStore("pdf")}
export async function getAuditStore(){return getStore("audit")}
export async function readUsers(){const s=await getUsersStore();return await s.get(USERS_KEY,{type:"json"})||{users:[]}}
export async function saveUsers(d){const s=await getUsersStore();await s.set(USERS_KEY,JSON.stringify(d),{metadata:{updatedAt:Date.now()}})}
export function ok(b){return new Response(JSON.stringify({ok:true,...b}),{status:200,headers:{"Content-Type":"application/json"}})}
export function fail(e,c=400){return new Response(JSON.stringify({ok:false,error:e}),{status:c,headers:{"Content-Type":"application/json"}})}
export function toId(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
export function requireUser(ctx){const u=ctx?.clientContext?.user;if(!u) throw new Error("Unauthorized"); return u}
export async function requireAdmin(ctx){const u=requireUser(ctx); const admin=(process.env.ADMIN_EMAIL||'').toLowerCase(); if(admin && u.email?.toLowerCase()===admin)return u; const d=await readUsers(); const f=(d.users||[]).find(x=>(x.email||'').toLowerCase()===(u.email||'').toLowerCase() && x.role==='admin'); if(!f) throw new Error("Admin only"); return u}
export async function logAudit(ev){const s=await getAuditStore();const id=toId();await s.set(id+'.json',JSON.stringify({id,...ev}))}
