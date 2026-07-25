# 물살림 AI 최종 배포 운영 안내

## 실행

PowerShell에서 인증키를 현재 세션 환경변수로만 설정한 뒤 실행한다.

```powershell
$env:KRC_SERVICE_KEY='발급받은_키'
node server-production.js
```

브라우저는 `http://localhost:4182/`로 접속한다. 루트는 최종 랜딩 `mulsallim-final.html`로 연결된다.

## 운영 보호

- 인증키는 `.env`, 운영체제 비밀관리, 배포 플랫폼 Secret 중 하나에만 저장한다.
- 서버는 IP당 분당 90회 요청 제한, KRC 응답 5분 캐시, 최대 366일 조회 범위 검증을 적용한다.
- 정적 파일 경로 이탈을 차단하고 `nosniff` 헤더를 보낸다.
- 공개 배포 전 HTTPS, 리버스 프록시, 접근 로그 마스킹, 상태 모니터링을 추가한다.

## 시연용 서버와의 관계

현재 `server-live-v5.js`는 로컬 시연 호환용이다. 공개·파일럿 배포는 `server-production.js`를 기준으로 한다.
