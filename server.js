/*
 * 물살림 AI의 최소 백엔드. 공공 API 키를 브라우저에 노출하지 않고
 * KRC 저수지 수위 API를 자체 API로 변환한다.
 * 실행: KRC_SERVICE_KEY=... node server.js
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const krcKey = process.env.KRC_SERVICE_KEY;
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}
function xmlTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}
function toDate(value) { return /^\d{8}$/.test(value || '') ? value : null; }

async function reservoirLevel(query) {
  if (!krcKey) return { status: 503, body: { error: 'KRC_SERVICE_KEY가 설정되지 않았습니다.', mode: 'configuration_required' } };
  const facCode = query.get('facCode'); const from = toDate(query.get('from')); const to = toDate(query.get('to'));
  if (!facCode || !from || !to) return { status: 400, body: { error: 'facCode, from(YYYYMMDD), to(YYYYMMDD)가 필요합니다.' } };
  const endpoint = new URL('http://apis.data.go.kr/B552149/reserviorWaterLevel/reservoirlevel/');
  endpoint.searchParams.set('serviceKey', krcKey);
  endpoint.searchParams.set('pageNo', '1'); endpoint.searchParams.set('numOfRows', '500');
  endpoint.searchParams.set('fac_code', facCode); endpoint.searchParams.set('date_s', from); endpoint.searchParams.set('date_e', to);
  try {
    const response = await fetch(endpoint); const xml = await response.text();
    if (!response.ok || xmlTag(xml, 'resultCode') !== '00') return { status: 502, body: { error: 'KRC API 응답 오류', detail: xmlTag(xml, 'resultMsg') || xmlTag(xml, 'returnAuthMsg') || 'unknown' } };
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => ({
      facilityCode: xmlTag(match[1], 'fac_code'), facilityName: xmlTag(match[1], 'fac_name'), county: xmlTag(match[1], 'county'),
      date: xmlTag(match[1], 'check_date'), waterLevelM: Number(xmlTag(match[1], 'water_level')), storageRate: Number(xmlTag(match[1], 'rate'))
    }));
    return { status: 200, body: { source: 'KRC 농촌용수 저수지 수위정보 조회', asOf: new Date().toISOString(), items } };
  } catch (error) { return { status: 502, body: { error: 'KRC API 호출 실패', detail: error.message } }; }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/health') return sendJson(res, 200, { status: 'ok', krcConfigured: Boolean(krcKey) });
  if (url.pathname === '/api/reservoir-levels') { const result = await reservoirLevel(url.searchParams); return sendJson(res, result.status, result.body); }
  const requestPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = path.resolve(root, `.${requestPath}`);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); return res.end('Not Found'); }
  res.writeHead(200, { 'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}).listen(port, () => console.log(`물살림 AI 서버: http://localhost:${port}`));
