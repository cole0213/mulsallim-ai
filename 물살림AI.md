# 물살림 AI

## 핵심 요약

KRC 농촌용수 저수지 수위 원자료를 지역 기반 위험 근거·동일 지역 비교·절수 협의로 전환하는 서비스개발 공모전 프로젝트다. 최종 제품은 소개용 랜딩과 실제 사용자용 대시보드를 분리하고, 인증키를 서버에만 보관한다.

## 기록

### 최종 제품·제출 문서 정렬  <!-- (2026-07-24, 진입점 2026-07-25 갱신) -->

- 최종 공개 진입(랜딩): `04_krc_water_ai/mulsallim-public-county-v12.html` (구 `mulsallim.html`은 폐기·삭제됨)
- 최종 실제 대시보드: `04_krc_water_ai/mulsallim-dashboard-county-v12.html` (구 `mulsallim-dashboard.html`은 폐기·삭제됨)
- 최종 제출 명세: [[09_최종_제출본_서비스명세서]]
- 한글 호환 제출 문서: `04_krc_water_ai/deliverables/물살림AI_제출용_최종_서비스명세서_20260724.docx`
- 저수율 35% 이하 또는 7일 15%p 이상 하락은 주의, 50% 이하 또는 7%p 이상 하락은 관심으로 표시한다. 법정 가뭄 경보를 대체하지 않는다.
- 후보 Gradient Boosting은 기준모델보다 검증 성능이 낮아 배포에서 제외했다. 관련: [[AI 모델 검증]]

### KRC 원자료 연동과 운영  <!-- (2026-07-24, 2026-07-25 갱신) -->

- 공개 운영 서버는 `server-production-v12.js`(Docker 컨테이너 `mulsallim-ai`, `nmlab16.korea.ac.kr:4184`)가 KRC `reservoircode`·`reservoirlevel` 호출을 중계한다. 구 `server-live-v5.js`는 로컬 시연용이었고 공개 배포 기준이 아니다.
- 키는 브라우저·URL·문서에 넣지 않고 서버 환경변수(`KRC_SERVICE_KEY`)에만 보관한다.
- 원자료의 행정구역 정밀도는 일반적으로 시·군 단위이므로 읍·면·동은 보조 필터다. 데이터가 없으면 임의 시설을 제시하지 않고 정확히 안내한다.
- 관련: [[KRC API 연동]], [[지역선택 UI]], [[배포 운영]]

### HTTPS 공개(Cloudflare Pages) 전환·정리  <!-- (2026-07-25) -->

- 상위망이 80/443 인입을 막아 오리진 직접 HTTPS(LE)가 불가 → Cloudflare Pages + Functions로 `https://mulsallim-ai.pages.dev` 고정 HTTPS 확보. Function `/api/*`가 오리진으로 서버간 프록시.
- **배포 블로커 A(해결):** Function→오리진 `/api` HTTP 522(비표준 포트 4184 도달불가)는 로컬 PC `cloudflared` 빠른 터널로 오리진 앞에 HTTPS를 두고 Function origin을 그 주소로 바꿔 해결. HTTPS 전 흐름(저수율·그래프·AI) 검증 완료. ⚠️ 임시 터널이라 PowerShell 창 유지 필요, 재시작 시 주소 변경. 영구화는 오리진 named tunnel. 상세: [[34_심사표_100점_자가진단_및_배포블로커_20260725]]
- **블로커 B(해결):** Pages CSP가 `unsafe-eval` 미허용인데 라이브 로더 3종이 `eval` 사용 → 지역선택 폼이 빈 채로 떴음. `build-pages.mjs`에서 eval을 `<script>` 주입으로 대체(빌드 시점 해석), 엄격 CSP 유지. HTTPS에서 지역선택 정상 복구 검증(시·도 18개).
- 러시안인형 버전 파일(v2~v11 등) 102개 삭제, 라이브 v12 세트만 유지. 낡은 역링크(v8/v9/v10) v12로 교정.
- 관련: [[배포 운영]]

## 다음 할 일

- [x] 배포 블로커 A: cloudflared 터널로 HTTPS 전 흐름 복구·검증 (로컬 임시 터널)
- [ ] 터널 영구화: 오리진 서버에서 named tunnel + `cloudflared service install`
- [ ] 강수량·가뭄 단계·용수 수요 특성을 추가한 예측 후보를 같은 기준으로 재검증
- [ ] KRC/지자체 담당자와 5~10개 저수지 시범 사용성 검증
- [ ] 잠재버그: `/api/krc/reservoir-codes`(지역 비교 버튼)가 서버 v4에 미구현 → 404. 구현 또는 버튼 정리
