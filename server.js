const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(ROOT,'data');
const UPLOAD_DIR = path.join(ROOT,'uploads');
const DB_FILE = path.join(DATA_DIR,'properties.json');
const ADMIN_U = process.env.ADMIN_USERNAME || 'cavijeh';
const ADMIN_P = process.env.ADMIN_PASSWORD || 'Alira7770';
const sessions = new Set();
fs.mkdirSync(DATA_DIR,{recursive:true}); fs.mkdirSync(UPLOAD_DIR,{recursive:true});
if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE,'[]');
function db(){try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}catch{return[]}}
function save(x){fs.writeFileSync(DB_FILE,JSON.stringify(x,null,2))}
function uid(){return 'p_'+Date.now().toString(36)+'_'+crypto.randomBytes(3).toString('hex')}
function send(res,status,data,type='application/json'){
  const headers={'Content-Type':type,'Cache-Control':'no-cache','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS'};
  if(type==='application/json'){
    const body=JSON.stringify(data);
    headers['Content-Length']=Buffer.byteLength(body);
    res.writeHead(status,headers);
    res.end(body);
  }else{
    res.writeHead(status,headers);
    res.end(data);
  }
}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>15*1024*1024)req.destroy()});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch{reject(new Error('bad json'))}});req.on('error',reject)})}
function isAdmin(req){const t=(req.headers.authorization||'').replace(/^Bearer\s+/,'');return sessions.has(t)}
function auth(req,res){if(!isAdmin(req)){send(res,401,{error:'دسترسی مدیر لازم است'});return false}return true}
function storeImages(id,arr){const out=[];for(const src of Array.isArray(arr)?arr:[]){if(typeof src!=='string'||!src)continue;if(src.startsWith('/uploads/')){out.push(src);continue}const m=src.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);if(!m)continue;const ext=m[1].toLowerCase()==='png'?'png':m[1].toLowerCase()==='webp'?'webp':'jpg';const f=`${id}_${Date.now()}_${crypto.randomBytes(2).toString('hex')}.${ext}`;fs.writeFileSync(path.join(UPLOAD_DIR,f),Buffer.from(m[2],'base64'));out.push('/uploads/'+f)}return out.slice(0,6)}
function normalize(p){const q={...p,id:p.id||uid(),createdAt:p.createdAt||Date.now()};q.images=storeImages(q.id,q.images);return q}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
function staticFile(req,res){let u=decodeURIComponent(req.url.split('?')[0]);let f=u==='/'?'/index.html':u;let full=path.normalize(path.join(ROOT,f));if(!full.startsWith(ROOT)||!fs.existsSync(full)||fs.statSync(full).isDirectory()){full=path.join(ROOT,'index.html')}try{const ext=path.extname(full);send(res,200,fs.readFileSync(full),mime[ext]||'application/octet-stream')}catch{send(res,404,{error:'not found'})}}

const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`); const p=u.pathname;
  if(req.method==='OPTIONS'){
    res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS'});
    return res.end();
  }
  if(req.method==='POST'&&p==='/api/login'){const b=await body(req);if(b.username!==ADMIN_U||b.password!==ADMIN_P)return send(res,401,{error:'نام کاربری یا رمز عبور اشتباه است'});const token=crypto.randomBytes(32).toString('hex');sessions.add(token);return send(res,200,{token,user:{role:'admin',name:'مدیر سیستم'}})}
  if(req.method==='POST'&&p==='/api/logout'){if(!auth(req,res))return;const t=(req.headers.authorization||'').replace(/^Bearer\s+/,'');sessions.delete(t);return send(res,200,{ok:true})}
  if(req.method==='GET'&&p==='/api/properties'){const all=db();return send(res,200,(isAdmin(req)?all:all.filter(x=>x.status==='APPROVED')).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)))}
  if(req.method==='POST'&&p==='/api/properties'){const b=await body(req);for(const k of ['title','price','location'])if(!String(b[k]||'').trim())return send(res,400,{error:`${k} الزامی است`});const q=normalize({...b,status:'PENDING',isFeatured:false});const all=db();all.unshift(q);save(all);return send(res,201,q)}
  const m=p.match(/^\/api\/properties\/([^/]+)$/); const ms=p.match(/^\/api\/properties\/([^/]+)\/status$/);
  if(ms&&req.method==='PATCH'){if(!auth(req,res))return;const id=decodeURIComponent(ms[1]),b=await body(req),allowed=['PENDING','APPROVED','REJECTED','SOLD'];if(!allowed.includes(b.status))return send(res,400,{error:'وضعیت نامعتبر'});const all=db(),q=all.find(x=>x.id===id);if(!q)return send(res,404,{error:'آگهی پیدا نشد'});q.status=b.status;q.updatedAt=Date.now();save(all);return send(res,200,q)}
  if(m&&req.method==='PUT'){if(!auth(req,res))return;const id=decodeURIComponent(m[1]),b=await body(req),all=db(),i=all.findIndex(x=>x.id===id);if(i<0)return send(res,404,{error:'آگهی پیدا نشد'});const merged={...all[i],...b,id};merged.images=storeImages(id,b.images||all[i].images);merged.updatedAt=Date.now();all[i]=merged;save(all);return send(res,200,merged)}
  if(m&&req.method==='DELETE'){if(!auth(req,res))return;const id=decodeURIComponent(m[1]),all=db(),q=all.find(x=>x.id===id);if(!q)return send(res,404,{error:'آگهی پیدا نشد'});for(const src of q.images||[]){if(src.startsWith('/uploads/'))try{fs.unlinkSync(path.join(ROOT,src.slice(1)))}catch{}}save(all.filter(x=>x.id!==id));return send(res,200,{ok:true})}
  if(req.method==='GET'&&p==='/api/backup'){if(!auth(req,res))return;return send(res,200,{version:4,exportedAt:new Date().toISOString(),properties:db()})}
  if(req.method==='POST'&&p==='/api/backup'){if(!auth(req,res))return;const b=await body(req);if(!Array.isArray(b.properties))return send(res,400,{error:'فایل نامعتبر'});save(b.properties.map(normalize));return send(res,200,{ok:true})}
  if(p.startsWith('/uploads/')){return staticFile(req,res)}
  if(p.startsWith('/api/'))return send(res,404,{error:'مسیر API پیدا نشد'});
  return staticFile(req,res);
 }catch(e){console.error(e);send(res,500,{error:'خطای داخلی سرور'})}
});
server.listen(PORT,()=>console.log(`Amlak Negin Pro: http://localhost:${PORT}`));
