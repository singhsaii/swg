'use strict';

// Smart Water Guardian: dependency-free API + static web server.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const PORT = Number(process.env.PORT) || 3000;
const sessions = new Map();
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
const ZONES = [
  { id:'hostel-a', name:'Hostel A', category:'Hostel', baseline:8000, current:12500, tankLevel:62, sensors:4 },
  { id:'academic-block-1', name:'Academic Block 1', category:'Academic', baseline:11000, current:11450, tankLevel:78, sensors:6 },
  { id:'canteen', name:'Central Canteen', category:'Canteen', baseline:6500, current:7900, tankLevel:41, sensors:3 },
  { id:'research-labs', name:'Research Labs', category:'Labs', baseline:5200, current:4980, tankLevel:86, sensors:5 },
  { id:'gardens', name:'Gardens & Sports', category:'Open Areas', baseline:4300, current:4760, tankLevel:55, sensors:3 },
  { id:'washrooms', name:'Washroom Block', category:'Washrooms', baseline:3600, current:3350, tankLevel:92, sensors:4 }
];
let db = { users:[], reports:[], thresholds:{ warning:15, critical:30, overflow:95 } };
let writeQueue = Promise.resolve();

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...headers });
  res.end(JSON.stringify(body));
};
const fail = (res, status, message) => json(res, status, { error:message });
const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });
const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');
const makeHash = password => { const salt = crypto.randomBytes(16).toString('hex'); return { salt, passwordHash:hashPassword(password, salt) }; };

function saveDb() {
  const snapshot = JSON.stringify(db, null, 2);
  writeQueue = writeQueue.then(async () => {
    const tmp = DB_FILE + '.tmp';
    await fs.writeFile(tmp, snapshot, { mode:0o600 });
    await fs.rename(tmp, DB_FILE);
  });
  return writeQueue;
}
async function loadDb() {
  await fs.mkdir(DATA_DIR, { recursive:true });
  try { db = JSON.parse(await fs.readFile(DB_FILE, 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.reports)) db.reports = [];
  if (!db.thresholds) db.thresholds = { warning:15, critical:30, overflow:95 };
  if (!db.users.some(u => u.email === 'demo@gniot.net.in')) {
    db.users.push({ id:crypto.randomUUID(), name:'Campus Administrator', email:'demo@gniot.net.in', role:'Facility Administrator', ...makeHash('Water@1234'), createdAt:new Date().toISOString() });
    await saveDb();
  }
}
function cookie(res, token) {
  res.setHeader('Set-Cookie', `swg_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${token ? 604800 : 0}`);
}
function currentUser(req) {
  const token = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('swg_session='))?.slice(12);
  const userId = token && sessions.get(token);
  return userId && db.users.find(u => u.id === userId);
}
function requireUser(req, res) {
  const user = currentUser(req);
  if (!user) fail(res, 401, 'Please sign in again.');
  return user;
}
async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 32_768) throw Object.assign(new Error('Request is too large.'), { status:413 });
  }
  try { return body ? JSON.parse(body) : {}; }
  catch { throw Object.assign(new Error('Request body must be valid JSON.'), { status:400 }); }
}
function safeEqual(a, b) {
  const x = Buffer.from(a || '', 'hex'), y = Buffer.from(b || '', 'hex');
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

async function api(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok:true, service:'Smart Water Guardian API' });
  if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
    const body = await readBody(req), email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim(), password = String(body.password || ''), role = String(body.role || 'Facility Administrator');
    if (name.length < 3 || name.length > 80) return fail(res, 400, 'Name must be 3 to 80 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(res, 400, 'Enter a valid email address.');
    if (password.length < 8 || password.length > 128) return fail(res, 400, 'Password must be 8 to 128 characters.');
    if (db.users.some(u => u.email === email)) return fail(res, 409, 'An account with this email already exists.');
    const user = { id:crypto.randomUUID(), name, email, role:['Student / Reporter','Facility Administrator'].includes(role) ? role : 'Facility Administrator', ...makeHash(password), createdAt:new Date().toISOString() };
    db.users.push(user); await saveDb();
    const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, user.id); cookie(res, token);
    return json(res, 201, { user:publicUser(user) });
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await readBody(req), email = String(body.email || '').trim().toLowerCase(), password = String(body.password || '');
    const user = db.users.find(u => u.email === email);
    if (!user || !safeEqual(hashPassword(password, user.salt), user.passwordHash)) return fail(res, 401, 'Email or password is incorrect.');
    const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, user.id); cookie(res, token);
    return json(res, 200, { user:publicUser(user) });
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('swg_session='))?.slice(12);
    if (token) sessions.delete(token); cookie(res, '');
    return json(res, 200, { ok:true });
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/session') {
    const user = currentUser(req); return user ? json(res, 200, { user:publicUser(user) }) : fail(res, 401, 'Not signed in.');
  }
  if (!url.pathname.startsWith('/api/')) return false;
  const user = requireUser(req, res); if (!user) return true;

  if (req.method === 'GET' && url.pathname === '/api/zones') {
    return json(res, 200, { zones:ZONES.map(z => ({ ...z, deviation:Number(((z.current-z.baseline)/z.baseline*100).toFixed(1)) })) });
  }
  if (req.method === 'GET' && url.pathname === '/api/reports') {
    return json(res, 200, { reports:db.reports.filter(r => user.role === 'Facility Administrator' || r.userId === user.id).map(({ userId, ...r }) => r) });
  }
  if (req.method === 'POST' && url.pathname === '/api/reports') {
    const body = await readBody(req);
    const report = { id:crypto.randomUUID(), userId:user.id, zone:String(body.zone || '').slice(0,100), type:String(body.type || '').slice(0,100), location:String(body.location || '').trim().slice(0,240), notes:String(body.notes || '').trim().slice(0,1000), severity:['Low','Medium','High'].includes(body.severity) ? body.severity : 'Medium', status:'Reported', createdAt:new Date().toISOString() };
    if (!report.zone || !report.type || !report.location) return fail(res, 400, 'Zone, issue type, and location are required.');
    db.reports.unshift(report); await saveDb();
    const { userId, ...publicReport } = report; return json(res, 201, { report:publicReport });
  }
  if (req.method === 'PATCH' && url.pathname === '/api/profile') {
    const body = await readBody(req), name = String(body.name || '').trim(), role = String(body.role || user.role);
    const email = String(body.email || user.email).trim().toLowerCase();
    if (name.length < 3 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(res, 400, 'Enter a valid name and email.');
    if (db.users.some(u => u.id !== user.id && u.email === email)) return fail(res, 409, 'That email is already in use.');
    user.name=name; user.email=email; user.role=['Student / Reporter','Facility Administrator'].includes(role) ? role : user.role;
    await saveDb(); return json(res, 200, { user:publicUser(user) });
  }
  if (req.method === 'GET' && url.pathname === '/api/settings') return json(res, 200, { thresholds:db.thresholds });
  if (req.method === 'PUT' && url.pathname === '/api/settings') {
    const b = await readBody(req), warning=Number(b.warning), critical=Number(b.critical), overflow=Number(b.overflow);
    if (![warning,critical,overflow].every(Number.isInteger) || warning < 5 || warning > 40 || critical <= warning || critical > 70 || overflow < 70 || overflow > 100) return fail(res, 400, 'Thresholds are invalid: critical must exceed warning.');
    db.thresholds={warning,critical,overflow}; await saveDb(); return json(res, 200, { thresholds:db.thresholds });
  }
  return fail(res, 404, 'API route not found.');
}

async function serve(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const handled = await api(req,res,url); if (handled !== false) return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res,405,'Method not allowed.');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(ROOT, '.' + pathname);
    if (!file.startsWith(ROOT + path.sep) || file.startsWith(DATA_DIR + path.sep)) return fail(res,403,'Forbidden.');
    const relative = path.relative(ROOT, file).replace(/\\/g, '/');
    if (!['index.html','dashboard.html'].includes(relative) && !relative.startsWith('assets/')) return fail(res,404,'File not found.');
    const stat = await fs.stat(file).catch(() => null);
    if (!stat?.isFile()) return fail(res,404,'File not found.');
    res.writeHead(200,{ 'Content-Type':MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff', 'Cache-Control':'no-cache' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch (error) { fail(res,error.status || 500,error.status ? error.message : 'Server error.'); }
}

loadDb().then(() => http.createServer(serve).listen(PORT, '127.0.0.1', () => {
  console.log(`Smart Water Guardian running at http://127.0.0.1:${PORT}`);
  console.log('Demo login: demo@gniot.net.in / Water@1234');
})).catch(error => { console.error('Could not start:',error); process.exit(1); });
