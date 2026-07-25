# KRC 실데이터 연결 절차

## 보안 먼저

공공데이터 인증키는 비밀번호처럼 다룬다. 채팅, 스크린샷, Git 저장소, 프론트엔드 코드에 넣지 않는다. 한번 노출된 키는 공공데이터포털에서 재발급 후 사용한다.

## 1. 새 키를 PC 환경변수에만 설정

PowerShell에서 아래의 `새_인증키` 자리에 재발급 키를 직접 입력한다.

```powershell
Set-Location Z:\nmlab\99_sgs\04_krc_water_ai
$env:KRC_SERVICE_KEY='새_인증키'
$env:PORT='4175'
node server-live.js
```

## 2. 저수지 코드 찾기

브라우저 또는 PowerShell에서 아래처럼 호출한다.

```text
http://localhost:4175/api/krc/reservoir-codes?name=탑정
```

또는

```text
http://localhost:4175/api/krc/reservoir-codes?county=충청남도
```

응답의 `facilityCode`를 다음 단계에 사용한다.

## 3. 기간별 수위 이력 조회

```text
http://localhost:4175/api/krc/reservoir-levels?facCode=4423010045&from=20260701&to=20260723
```

성공 응답에는 `facilityName`, `county`, `checkDate`, `waterLevelM`, `storageRate`가 포함된다.

## 4. 대시보드 교체 기준

- API 응답 5개 이상 저수지 확보
- 기준일·결측값·오류 응답 확인
- 시연 데이터 표기를 실데이터 기준시각으로 교체
- 최소 365일 이력 확보 후 예측 모델 검증 시작
