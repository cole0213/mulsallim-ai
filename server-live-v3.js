/* 물살림 AI - KRC 저수지 API 프록시 v3
 * 서비스키는 환경 변수 KRC_SERVICE_KEY로만 전달한다.
 * KRC 공개 명세의 http 주소를 우선 사용하고, 연결 실패일 때만 https를 보조로 시도한다.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const root = __dirname;
const port = Number(process.env.PORT || 4175);
const serviceKey = process.env.KRC_SERVICE_KEY;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};
const tag = (xml, name) => {
  const found = xml.match(new RegExp(`<${name}>\\s*([^<]*?)\\s*</${name}>`));
  return found ? found[1].trim() : null;
};
const items = (xml) => xml.split('<item>').slice(1).map((part) => part.split('</item>')[0]);
const isDate = (value) => /^\\d{8}$/.test(value || '');

function makeUrl(protocol, feature, parameters) {
  const endpoint = new URL(`${protocol}://apis.data.go.kr/B552149/reserviorWaterLevel/${feature}/`);
  Object.entries({ serviceKey, pageNo: '1', numOfRows: '100', ...parameters }).forEach(([key, value]) => {
    if (value) endpoint.searchParams.set(key, value);
  });
  return endpoint;
}

async function requestOnce(protocol, feature, parameters) {
  const response = await fetch(makeUrl(protocol, feature, parameters));
  const xml = await response.text();
  return { response, xml, protocol };
}

async function requestKrc(feature, parameters) {
  if (!serviceKey) return { status: 503, body: { error: 'KRC_SERVICE_KEY가 설정되지 않았습니다.', mode: 'configuration_required' } };
  try {
    let result = await requestOnce('http', feature, parameters);
    // 공개 명세는 http지만, 기관 인프라에서 http가 막힌 경우만 https를 보조로 시도한다.
    if (!result.response.ok && result.response.status >= 500) result = await requestOnce('https', feature, parameters);
    const reasonCode = tag(result.xml, 'returnReasonCode');
    if (!result.response.ok || (reasonCode && reasonCode !== '00')) {
      return {
        status: 502,
        body: {
          error: 'KRC API 응답 오류',
          detail: tag(result.xml, 'returnAuthMsg') || tag(result.xml, 'errMsg') || `HTTP ${result.response.status}`,
          upstreamStatus: result.response.status,
          protocolTried: result.protocol,
        },
      };
    }
    return { status: 200, xml: result.xml };
  } catch (error) {
    return { status: 502, body: { error: 'KRC API 호출 실패', detail: error.message } };
  }
}

async function findCodes(params) {
  const name = params.get('name');
  const county = params.get('county');
  if (!name && !county) return { status: 400, body: { error: 'name 또는 county 중 하나가 필요합니다.' } };
  const result = await requestKrc('reservoircode', { fac_name: name, county });
  if (result.status !== 200) return result;
  return {
    status: 200,
    body: {
      source: '한국농어촌공사 농업용저수지 코드조회', asOf: new Date().toISOString(),
      items: items(result.xml).map((item) => ({
        facilityCode: tag(item, 'fac_code'), facilityName: tag(item, 'fac_name'), county: tag(item, 'county'),
      })),
    },
  };
}

async function findLevels(params) {
  const facCode = params.get('facCode');
  const from = params.get('from');
  const to = params.get('to');
  if (!facCode || !isDate(from) || !isDate(to)) return { status: 400, body: { error: 'facCode, from(YYYYMMDD), to(YYYYMMDD)가 필요합니다.' } };
  const result = await requestKrc('reservoirlevel', { fac_code: facCode, date_s: from, date_e: to });
  if (result.status !== 200) return result;
  return {
    status: 200,
    body: {
      source: '한국농어촌공사 농업용저수지 수위조회', asOf: new Date().toISOString(),
      items: items(result.xml).map((item) => ({
        facilityCode: tag(item, 'fac_code'), facilityName: tag(item, 'fac_name'), county: tag(item, 'county'),
        checkDate: tag(item, 'check_date'), waterLevelM: Number(tag(item, 'water_level')), storageRate: Number(tag(item, 'rate')),
      })),
    },
  };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/health') return sendJson(res, 200, { status: 'ok', krcConfigured: Boolean(serviceKey), apiMode: 'http-first' });
  if (url.pathname === '/api/krc/reservoir-codes') return sendJson(res, ...(await findCodes(url.searchParams)).toArray?.() || []);
  if (url.pathname === '/api/krc/reservoir-levels') return sendJson(res, ...(await findLevels(url.searchParams)).toArray?.() || []);
  // Node 객체는 배열로 전개할 수 없으므로, 위 API 분기를 여기서 명시적으로 처리한다.
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const target = path.resolve(root, `.${requested}`);
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { res.writeHead(404); return res.end('Not Found'); }
  res.writeHead(200, { 'content-type': types[path.extname(target)] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
}).listen(port, () => console.log(`물살림 AI 로컬 서버 v3: http://localhost:${port}`));
