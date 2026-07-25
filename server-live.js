/*
 * 물살림 AI 실연동 서버
 * - KRC 인증키는 환경변수 KRC_SERVICE_KEY로만 받는다.
 * - 브라우저는 이 서버만 호출하고 KRC 키를 절대 알 수 없다.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const root = __dirname;
const port = Number(process.env.PORT || 4175);
const serviceKey = process.env.KRC_SERVICE_KEY;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };

function json(res, status, body) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); }
function tag(xml, name) { const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)); return match ? match[1].trim() : null; }
function items(xml) { return [...xml.matchAll(/<item>([\\s\\S]*?)<\\/item>/g)].map((match) => match[1]); }
function queryString(endpoint, values) { const url = new URL(endpoint); Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value); }); return url; }
function apiError(xml, fallback) { return tag(xml, 'returnAuthMsg') || tag(xml, 'errMsg') || tag(xml, 'resultMsg') || fallback; }
function validDate(value) { return /^\\d{8}$/.test(value || ''); }

async function callKrc(pathname, values) {
  if (!serviceKey) return { status: 503, body: { error: 'KRC_SERVICE_KEY가 설정되지 않았습니다.', mode: 'configuration_required' } };
  const endpoint = queryString(`https://apis.data.go.kr/B552149/reserviorWaterLevel/${pathname}/`, { serviceKey, pageNo: '1', numOfRows: '100', ...values });
  try {
    const response = await fetch(endpoint); const xml = await response.text();
    if (!response.ok || tag(xml, 'returnReasonCode') !== '00') return { status: 502, body: { error: 'KRC API 응답 오류', detail: apiError(xml, `HTTP ${response.status}`) } };
    return { status: 200, xml };
  } catch (error) { return { status: 502, body: { error: 'KRC API 호출 실패', detail: error.message } }; }
}

async function reservoirCodes(query) {
  const name = query.get('name'); const county = query.get('county');
  if (!name && !county) return { status: 400, body: { error: 'name 또는 county 중 하나가 필요합니다.' } };
  const result = await callKrc('reservoircode', { fac_name: name, county });
  if (result.status !== 200) return result;
  return { status: 200, body: { source: 'KRC 농촌용수 저수지 코드조회', asOf: new Date().toISOString(), items: items(result.xml).map((item) => ({ facilityCode: tag(item, 'fac_code'), facilityName: tag(item, 'fac_name'), county: tag(item, 'county') })) } };
}

async function reservoirLevels(query) {
  const facCode = query.get('facCode'); const from = query.get('from'); const to = query.get('to');
  if (!facCode || !validDate(from) || !validDate(to)) return { status: 400, body: { error: 'facCode, from(YYYYMMDD), to(YYYYMMDD)가 필요합니다.' } };
  const result = await callKrc('reservoirlevel', { fac_code: facCode, date_s: from, date_e: to });
  if (result.status !== 200) return result;
  return { status: 200, body: { source: 'KRC 농촌용수 저수지 수위정보 조회', asOf: new Date().toISOString(), items: items(result.xml).map((item) => ({ facilityCode: tag(item, 'fac_code'), facilityName: tag(item, 'fac_name'), county: tag(item, 'county'), checkDate: tag(item, 'check_date'), waterLevelM: Number(tag(item, 'water_level')), storageRate: Number(tag(item, 'rate')) })) } };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/health') return json(res, 200, { status: 'ok', krcConfigured: Boolean(serviceKey) });
  if (url.pathname === '/api/krc/reservoir-codes') { const result = await reservoirCodes(url.searchParams); return json(res, result.status, result.body); }
  if (url.pathname === '/api/krc/reservoir-levels') { const result = await reservoirLevels(url.searchParams); return json(res, result.status, result.body); }
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const target = path.resolve(root, `.${requested}`);
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { res.writeHead(404); return res.end('Not Found'); }
  res.writeHead(200, { 'content-type': types[path.extname(target)] || 'application/octet-stream' }); fs.createReadStream(target).pipe(res);
}).listen(port, () => console.log(`물살림 AI 실연동 서버: http://localhost:${port}`));
