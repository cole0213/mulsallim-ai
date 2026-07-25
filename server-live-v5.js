/* 물살림 AI - KRC API 프록시 v5 (실행용) */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const root = __dirname;
const port = Number(process.env.PORT || 4175);
const serviceKey = process.env.KRC_SERVICE_KEY;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const send = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}>\\s*([^<]*?)\\s*</${name}>`)); return m ? m[1].trim() : null; };
const xmlItems = (xml) => xml.split('<item>').slice(1).map((part) => part.split('</item>')[0]);
const validDate = (value) => typeof value === 'string' && value.length === 8 && [...value].every((char) => char >= '0' && char <= '9');

function urlFor(protocol, feature, parameters) {
  const url = new URL(`${protocol}://apis.data.go.kr/B552149/reserviorWaterLevel/${feature}/`);
  for (const [key, value] of Object.entries({ serviceKey, pageNo: '1', numOfRows: '100', ...parameters })) if (value) url.searchParams.set(key, value);
  return url;
}
async function krc(feature, parameters) {
  if (!serviceKey) return { status: 503, body: { error: 'KRC_SERVICE_KEY가 설정되지 않았습니다.' } };
  try {
    let protocol = 'http'; let response = await fetch(urlFor(protocol, feature, parameters)); let xml = await response.text();
    if (response.status >= 500) { protocol = 'https'; response = await fetch(urlFor(protocol, feature, parameters)); xml = await response.text(); }
    const reason = tag(xml, 'returnReasonCode');
    if (!response.ok || (reason && reason !== '00')) return { status: 502, body: { error: 'KRC API 응답 오류', detail: tag(xml, 'returnAuthMsg') || tag(xml, 'errMsg') || `HTTP ${response.status}`, upstreamStatus: response.status, protocolTried: protocol } };
    return { status: 200, xml };
  } catch (error) { return { status: 502, body: { error: 'KRC API 호출 실패', detail: error.message } }; }
}
async function codes(query) {
  const name = query.get('name'); const county = query.get('county');
  if (!name && !county) return { status: 400, body: { error: 'name 또는 county 중 하나가 필요합니다.' } };
  const result = await krc('reservoircode', { fac_name: name, county });
  if (result.status !== 200) return result;
  return { status: 200, body: { source: '한국농어촌공사 농업용저수지 코드조회', asOf: new Date().toISOString(), items: xmlItems(result.xml).map((item) => ({ facilityCode: tag(item, 'fac_code'), facilityName: tag(item, 'fac_name'), county: tag(item, 'county') })) } };
}
async function levels(query) {
  const facCode = query.get('facCode'); const from = query.get('from'); const to = query.get('to');
  if (!facCode || !validDate(from) || !validDate(to)) return { status: 400, body: { error: 'facCode, from(YYYYMMDD), to(YYYYMMDD)가 필요합니다.' } };
  const result = await krc('reservoirlevel', { fac_code: facCode, date_s: from, date_e: to });
  if (result.status !== 200) return result;
  return { status: 200, body: { source: '한국농어촌공사 농업용저수지 수위조회', asOf: new Date().toISOString(), items: xmlItems(result.xml).map((item) => ({ facilityCode: tag(item, 'fac_code'), facilityName: tag(item, 'fac_name'), county: tag(item, 'county'), checkDate: tag(item, 'check_date'), waterLevelM: Number(tag(item, 'water_level')), storageRate: Number(tag(item, 'rate')) })) } };
}
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/health') return send(res, 200, { status: 'ok', krcConfigured: Boolean(serviceKey), apiMode: 'http-first' });
  if (url.pathname === '/api/krc/reservoir-codes') { const result = await codes(url.searchParams); return send(res, result.status, result.body); }
  if (url.pathname === '/api/krc/reservoir-levels') { const result = await levels(url.searchParams); return send(res, result.status, result.body); }
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname); const target = path.resolve(root, `.${requested}`);
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { res.writeHead(404); return res.end('Not Found'); }
  res.writeHead(200, { 'content-type': types[path.extname(target)] || 'application/octet-stream' }); fs.createReadStream(target).pipe(res);
}).listen(port, () => console.log(`물살림 AI 로컬 서버 v5: http://localhost:${port}`));
