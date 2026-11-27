const { randomBytes } = require('node:crypto');

const origin = 'https://kyotaki.cybozu.com';
const route = '/policy-chat-kintone';
const callback = `https://kintone-ai-ringi-api.onrender.com${route}/callback`;
const scopes = ['k:app_record:read', 'k:app_settings:read', 'k:file:read'];
const stateCookie = '__Host-policy_state';
const sessionCookie = '__Host-policy_session';
const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' };
const randomId = () => randomBytes(32).toString('hex');

function readCookie(req, name) {
  const prefix = name + '=';
  return req.get('Cookie')?.split(';').map(part => part.trim())
    .find(part => part.startsWith(prefix))?.slice(prefix.length);
}

function remember(entries, key, value, limit) {
  const now = Date.now();
  for (const [id, entry] of entries) {
    if (entry.expires <= now) entries.delete(id);
  }
  if (entries.size >= limit) entries.delete(entries.keys().next().value);
  entries.set(key, value);
}

function mountKintoneLogin(app, enabled) {
  const clientId = process.env.POLICY_KINTONE_CLIENT_ID?.trim();
  const clientSecret = process.env.POLICY_KINTONE_CLIENT_SECRET?.trim();
  const ready = enabled && clientId && clientSecret;
  const attempts = new Map();
  const sessions = new Map();

  app.use(route, (_req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    if (!ready) return res.status(503).send('kintoneログインによる試用は準備中です。');
    next();
  });

  app.get(route + '/callback', async (req, res) => {
    const state = readCookie(req, stateCookie);
    const attempt = attempts.get(state);
    if (!attempt || attempt.expires < Date.now() || req.query.state !== state) {
      return res.status(400).send('ログインを確認できませんでした。社内規程ポータルから開き直してください。');
    }
    attempts.delete(state);
    res.clearCookie(stateCookie, cookieOptions);
    if (req.query.error || typeof req.query.code !== 'string' || !req.query.code || req.query.code.length > 1024) {
      return res.status(403).send('kintoneでの連携が許可されませんでした。試用対象をご確認ください。');
    }

    try {
      const response = await fetch(origin + '/oauth2/token', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ grant_type: 'authorization_code', redirect_uri: callback, code: req.query.code }),
        redirect: 'error',
        signal: AbortSignal.timeout(15_000)
      });
      if (!response.ok) {
        console.error(`kintone OAuth token HTTP ${response.status}`);
        return res.status(403).send('kintoneでの連携を確認できませんでした。');
      }
      const token = await response.json();
      const granted = typeof token.scope === 'string' ? token.scope.split(/\s+/) : [];
      const duration = Math.min(3600, Number(token.expires_in)) * 1000;
      if (!scopes.every(scope => granted.includes(scope)) ||
          typeof token.access_token !== 'string' || !token.access_token || !(duration > 0)) {
        return res.status(403).send('必要なkintoneの閲覧権限を確認できませんでした。');
      }
      sessions.delete(readCookie(req, sessionCookie));
      const id = randomId();
      remember(sessions, id, { id, token: token.access_token, expires: Date.now() + duration }, 200);
      res.cookie(sessionCookie, id, { ...cookieOptions, maxAge: duration });
      return res.redirect(303, route);
    } catch {
      return res.status(502).send('kintoneに接続できませんでした。時間をおいて開き直してください。');
    }
  });

  app.use(route, (req, res, next) => {
    const id = readCookie(req, sessionCookie);
    const session = sessions.get(id);
    if (session && session.expires > Date.now()) {
      req.policySession = session;
      return next();
    }
    sessions.delete(id);
    if (req.path !== '/' || req.method !== 'GET') {
      return res.status(401).json({ error: 'kintoneで再認証するため、画面を開き直してください。' });
    }
    const state = randomId();
    const duration = 10 * 60_000;
    remember(attempts, state, { expires: Date.now() + duration }, 500);
    res.cookie(stateCookie, state, { ...cookieOptions, maxAge: duration });
    const url = new URL(origin + '/oauth2/authorization');
    url.search = new URLSearchParams({
      client_id: clientId, redirect_uri: callback, state, response_type: 'code', scope: scopes.join(' ')
    });
    return res.redirect(302, url.href);
  });

  return req => {
    sessions.delete(req.policySession?.id);
  };
}

module.exports = { mountKintoneLogin, origin, route };
