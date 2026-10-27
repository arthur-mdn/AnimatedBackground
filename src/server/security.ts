import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
import type {Request,Response} from 'express';

export function securityConfig(env:NodeJS.ProcessEnv=process.env){
 const integer=(name:string,fallback:number)=>{const value=Number(env[name]??fallback);if(!Number.isSafeInteger(value)||value<=0)throw new Error(`${name} doit être un entier positif.`);return value;};
 const trustedProxies=(env.TRUST_PROXY_CIDRS||'').split(',').map(s=>s.trim()).filter(Boolean);
 for(const proxy of trustedProxies){const [ip,bits,...extra]=proxy.split('/');const family=isIP(ip);if(!family||extra.length||bits!==undefined&&(!/^\d+$/.test(bits)||Number(bits)>(family===4?32:128)))throw new Error('TRUST_PROXY_CIDRS doit contenir uniquement des adresses IP ou des réseaux CIDR explicites.');}
 if(env.SESSION_SECRET&&Buffer.byteLength(env.SESSION_SECRET)<32)throw new Error('SESSION_SECRET doit contenir au moins 32 octets.');
 return {trustedProxies,sessionSecret:env.SESSION_SECRET||randomBytes(32).toString('hex'),sessionSeconds:86400,
  generationWindowMs:3600000,sessionGenerations:integer('SESSION_GENERATIONS_PER_HOUR',5),ipGenerations:integer('IP_GENERATIONS_PER_HOUR',10),globalGenerations:integer('GLOBAL_GENERATIONS_PER_HOUR',30),
  renderTimeoutMs:integer('RENDER_TIMEOUT_SECONDS',2700)*1000,retentionMs:integer('EXPORT_RETENTION_HOURS',24)*3600000,
  storageBytes:integer('OUTPUT_MAX_MB',20480)*1024**2,minFreeBytes:integer('MIN_FREE_DISK_MB',2048)*1024**2,cacheBytes:integer('RENDER_CACHE_MAX_MB',8192)*1024**2};
}
export type SecurityConfig=ReturnType<typeof securityConfig>;

// Stateless, signed, host-only cookie. The job owner identifier never enters JSON responses.
export class VisitorSessions{
 readonly cookieName:string;
 constructor(private secret:string,private secure:boolean,private lifetimeSeconds=86400){this.cookieName=secure?'__Host-ab_session':'ab_session';}
 private mac(value:string){return createHmac('sha256',this.secret).update(value).digest('base64url');}
 read(req:Pick<Request,'headers'>,now=Date.now()){
  const raw=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith(this.cookieName+'='))?.slice(this.cookieName.length+1);
  if(!raw||raw.length>200)return null;
  const parts=raw.split('.');if(parts.length!==3||!/^[a-f0-9]{64}$/.test(parts[0])||!/^\d{10,13}$/.test(parts[1])||!/^[\w-]{43}$/.test(parts[2]))return null;
  const payload=parts.slice(0,2).join('.'),expected=Buffer.from(this.mac(payload)),received=Buffer.from(parts[2]);
  if(expected.length!==received.length||!timingSafeEqual(expected,received)||Number(parts[1])<=now)return null;
  return parts[0];
 }
 issue(res:Response,now=Date.now(),id=randomBytes(32).toString('hex')){
  const payload=`${id}.${now+this.lifetimeSeconds*1000}`;
  res.append('Set-Cookie',`${this.cookieName}=${payload}.${this.mac(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${this.lifetimeSeconds}${this.secure?'; Secure':''}`);
  return id;
 }
 networkKey(ip:string){return this.mac(ip);}
}

// Bounded maps fail closed rather than evicting live limits under an address flood.
export class WindowLimiter{
 private buckets=new Map<string,{count:number;until:number}>();
 constructor(private windowMs:number,private capacity=10000){}
 check(key:string,limit:number,now=Date.now()){
  let bucket=this.buckets.get(key);
  if(bucket&&bucket.until<=now){this.buckets.delete(key);bucket=undefined;}
  if(!bucket&&this.buckets.size>=this.capacity){for(const [id,b]of this.buckets)if(b.until<=now)this.buckets.delete(id);if(this.buckets.size>=this.capacity)return {allowed:false,retryAfter:Math.ceil(this.windowMs/1000)};}
  return {allowed:!bucket||bucket.count<limit,retryAfter:bucket?Math.max(1,Math.ceil((bucket.until-now)/1000)):0};
 }
 consume(key:string,limit:number,now=Date.now()){
  const result=this.check(key,limit,now);if(!result.allowed)return result;
  const bucket=this.buckets.get(key);if(bucket)bucket.count++;else this.buckets.set(key,{count:1,until:now+this.windowMs});
  return result;
 }
}
