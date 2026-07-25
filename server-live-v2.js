/* 물살림 AI KRC 실연동 서버 v2 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const root = __dirname;
const port = Number(process.env.PORT || 4175);
const serviceKey = process.env.KRC_SERVICE_KEY;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };

const sendJson = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
const xmlTag = (xml, name) => { const found = xml.match(new RegExp(`<${name}>\\s*([^<]*?)\\s*</${name}>`)); return found ? found[1].trim() : null; };
const xmlItems = (xml) => xml.split('<item>').slice(1).map((part) => part.split('</item>')[0]);
const isDate = (value) => /^\d{8}$/.test(value || '');

async function requestKrc(feature, parameters) {
  if (!serviceKey) return { status: 503, body: { error: 'KRC_SERVICE_KEY가 설정되지 않았습니다.', mode: 'configuration_required' } };
  const endpoint = new URL(`https://apis.data.go.kr/B552149/reserviorWaterLevel/${feature}/`);
  Object.entries({ serviceKey, pageNo: '1', numOfRows: '100', ...parameters }).forEach(([key, value]) => { if (value) endpoint.searchParams.set(key, value); });
  try {
    const response = await fetch(endpoint); const xml = await response.text();
    if (!response.ok || xmlTag(xml, 'returnReasonCode') !== '00') return { status: 502, body: { error: 'KRC API 응답 오류', detail: xmlTag(xml, 'returnAuthMsg') || xmlTag(xml, 'errMsg') || `HTTP ${response.status}` } };
    return { status: 200, xml };
  } catch (error) { return { status: 502, body: { error: 'KRC API 호출 실패', detail: error.message } }; }
}

async function findCodes(params) {
  const name = params.get('name'); const county = params.get('county');
  if (!name && !county) return { status: 400, body: { error: 'name 또는 county 중 하나가 필요합니다.' } };
  const result = await requestKrc('reservoircode', { fac_name: name, county });
  if (result.status !== 200) return result;
  return { status: 200, body: { source: 'KRC 농촌용수 저수지 코드조회', asOf: new Date().toISOString(), items: xmlItems(result.xml).map((item) => ({ facilityCode: xmlTag(item, 'fac_code'), facilityName: xmlTag(item, 'fac_name'), county: xmlTag(item, 'county') })) } };
}

async function findLevels(params) {
  const facCode = params.get('facCode'); const from = params.get('from'); const to = params.get('to');
  if (!facCode || !isDate(from) || !isDate(to)) return { status: 400, body: { error: 'facCode, from(YYYYMMDD), to(YYYYMMDD)가 필요합니다.' } };
  const result = await requestKrc('reservoirlevel', { fac_code: facCode, date_s: from, date_e: to });
  if (result.status !== 200) return result;
  return { status: 200, body: { source: 'KRC 농촌용수 저수지 수위정보 조회', asOf: new Date().toISOString(), items: xmlItems(result.xml).map((item) => ({ facilityCode: xmlTag(item, 'fac_code'), facilityName: xmlTag(item, 'fac_name'), county: xmlTag(item, 'county'), checkDate: xmlTag(item, 'check_date'), waterLevelM: Number(xmlTag(item, 'water_level')), storageRate: Number(xmlTag(item, 'rate')) })) } };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/health') return sendJson(res, 200, { status: 'ok', krcConfigured: Boolean(serviceKey) });
  if (url.pathname === '/api/krc/reservoir-codes') { const result = await findCodes(url.searchParams); return sendJson(res, result.status, result.body); }
  if (url.pathname === '/api/krc/reservoir-levels') { const result = await findLevels(url.searchParams); return sendJson(res, result.status, result.body); }
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const target = path.resolve(root, `.${requested}`);
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { res.writeHead(404); return res.end('Not Found'); }
  res.writeHead(200, { 'content-type': types[path.extname(target)] || 'application/octet-stream' }); fs.createReadStream(target).pipe(res);
}).listen(port, () => console.log(`물살림 AI 실연동 서버: http://localhost:${port}`));
