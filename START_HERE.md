# 물살림 AI 실연동 시작 안내

## 보안

공공데이터 인증키는 노출된 경우 재발급한다. 새 키는 이 문서, Git 저장소, 프론트엔드 코드, 채팅에 기록하지 않는다.

## 실행 명령

```powershell
Set-Location Z:\nmlab\99_sgs\04_krc_water_ai
$env:KRC_SERVICE_KEY='재발급_인증키를_이_자리에서만_입력'
$env:PORT='4175'
node server-live-v2.js
```

## 확인 순서

1. `http://localhost:4175/api/health` → `krcConfigured: true` 확인
2. `http://localhost:4175/api/krc/reservoir-codes?name=탑정` → 시설 코드 확인
3. `http://localhost:4175/api/krc/reservoir-levels?facCode=4423010045&from=20260701&to=20260723` → 날짜별 수위·저수율 확인
4. 대시보드의 시연 데이터를 API 응답으로 교체

## API 역할

- `/reservoircode/`: 저수지명 또는 위치로 시설 코드를 찾는다.
- `/reservoirlevel/`: 시설 코드와 날짜 범위로 수위(m)·저수율(%) 이력을 조회한다.

브라우저는 KRC API가 아니라 로컬 백엔드만 호출하므로 인증키가 화면이나 배포 파일에 노출되지 않는다.
