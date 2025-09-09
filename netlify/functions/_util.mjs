
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getStore } from '@netlify/blobs';

const USERS_KEY = 'users.json';
const MINIT_KEY = 'minit.json';
const AUDIT_KEY = 'audit.json';

export function store(){ return getStore({name: 'ppd-minit-curai', consistency: 'strong'}); }

export async function readJson(key, def){ const s=store(); const v = await s.get(key, { type: 'json' }); return v || def; }
export async function writeJson(key, data){ const s=store(); await s.setJSON(key, data); }

export function signToken(user){
  const secret = process.env.JWT_SECRET || 'changeme';
  return jwt.sign({ email:user.email, name:user.name, role:user.role }, secret, { expiresIn:'7d' });
}
export function verifyToken(authHeader){
  try{
    if(!authHeader) return null;
    const token = authHeader.replace('Bearer ','').trim();
    const secret = process.env.JWT_SECRET || 'changeme';
    return jwt.verify(token, secret);
  }catch(e){ return null; }
}

export async function ensureAdmin(payload){
  if(!payload) return false;
  return payload.role === 'admin';
}

export async function seedIfEmpty(){
  const users = await readJson(USERS_KEY, []);
  if(users.length===0){
    // empty store
    await writeJson(USERS_KEY, []);
    await writeJson(MINIT_KEY, []);
    await writeJson(AUDIT_KEY, []);
  }
}

export { USERS_KEY, MINIT_KEY, AUDIT_KEY };
