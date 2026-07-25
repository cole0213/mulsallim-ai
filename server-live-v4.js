/* 물살림 AI - KRC API 프록시 v4 (실행용)
 * 키는 $env:KRC_SERVICE_KEY로만 주입한다. 소스·브라우저·저장소에 넣지 않는다.
 */
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
const validDate = (value) => /^\\d{8}$/.test(value || '');

function apiUrl(protocol, feature, parameters) {
  const url = new URL(`${protocol}://apis.data.go.kr/B552149/reserviorWaterLevel/${feature}/`);
  for (const [key, value] of Object.entries({ serviceKey, pageNo: '1', numOfRows: '100', ...parameters })) if (value) url.searchParams.set(key, value);
  return url;
}
async function callKrc(feature, parameters) {
  if (!serviceKey) return { status: 503, body: { error: 'KRC_SERVICE_KEY가 설정되지 않았습니다.' } };
  try {
    // 해당 공개 API 명세의 공식 주소는 http다. 5xx일 때만 https를 보조로 시도한다.
    let protocol = 'http'; let response = await fetch(apiUrl(protocol, feature, parameters)); let xml = await response.text();
    if (response.status >= 500) { protocol = 'https'; response = await fetch(apiUrl(protocol, feature, parameters)); xml = await response.text(); }
    const code = tag(xml, 'returnReasonCode');
    if (!response.ok || (code && code !== '00')) return { status: 502, body: { error: 'KRC API 응답 오류', detail: tag(xml, 'returnAuthMsg') || tag(xml, 'errMsg') || `HTTP ${response.status}`, upstreamStatus: response.status, protocolTried: protocol } };
    return { status: 200, xml };
  } catch (error) { return { status: 502, body: { error: 'KRC API 호출 실패', detail: error.message } }; }
}
async function codes(query) {
  const name = query.get('name'); const county = query.get('county');
  if (!name && !county) return { status: 400, body: { error: 'name 또는 county 중 하나가 필요합니다.' } };
  const result = await callKrc('reservoircode', { fac_name: name, county });
  if (result.status !== 200) return result;
  return { status: 200, body: { source: '한국농어촌공사 농업용저수지 코드조회', asOf: new Date().toISOString(), items: xmlItems(result.xml).map((x) => ({ facilityCode: tag(x, 'fac_code'), facilityName: tag(x, 'fac_name'), county: tag(x, 'county') })) } };
}
async function levels(query) {
  const facCode = query.get('facCode'); const from = query.get('from'); const to = query.get('to');
  if (!facCode || !validDate(from) || !validDate(to)) return { status: 400, body: { error: 'facCode, from(YYYYMMDD), to(YYYYMMDD)가 필요합니다.' } };
  const result = await callKrc('reservoirlevel', { fac_code: facCode, date_s: from, date_e: to });
  if (result.status !== 200) return result;
  return { status: 200, body: { source: '한국농어촌공사 농업용저수지 수위조회', asOf: new Date().toISOString(), items: xmlItems(result.xml).map((x) => ({ facilityCode: tag(x, 'fac_code'), facilityName: tag(x, 'fac_name'), county: tag(x, 'county'), checkDate: tag(x, 'check_date'), waterLevelM: Number(tag(x, 'water_level')), storageRate: Number(tag(x, 'rate')) })) } };
}
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/health') return send(res, 200, { status: 'ok', krcConfigured: Boolean(serviceKey), apiMode: 'http-first' });
  if (url.pathname === '/api/krc/reservoir-codes') { const result = await codes(url.searchParams); return send(res, result.status, result.body); }
  if (url.pathname === '/api/krc/reservoir-levels') { const result = await levels(url.searchParams); return send(res, result.status, result.body); }
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const target = path.resolve(root, `.${requested}`);
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { res.writeHead(404); return res.end('Not Found'); }
  res.writeHead(200, { 'content-type': types[path.extname(target)] || 'application/octet-stream' }); fs.createReadStream(target).pipe(res);
}).listen(port, () => console.log(`물살림 AI 로컬 서버 v4: http://localhost:${port}`));
