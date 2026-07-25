"""저수지별 7일 후 저수율 예측의 경량 검증 파이프라인.
입력 CSV: check_date(YYYYMMDD), rate(%) / 출력: models/metrics.json
로컬 PC에서 학습하지 않고 승인된 서버에서만 실행한다.
"""
import argparse, json
from pathlib import Path
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

def main(path: str, out: str):
    df = pd.read_csv(path, dtype={"check_date": str})[["check_date", "rate"]].dropna()
    df = df.sort_values("check_date").drop_duplicates("check_date", keep="last")
    for lag in (1, 3, 7, 14): df[f"lag_{lag}"] = df.rate.shift(lag)
    df["target_7d"] = df.rate.shift(-7)
    data = df.dropna().copy()
    if len(data) < 45: raise SystemExit("검증에는 최소 45일의 유효 관측이 필요합니다.")
    cut = int(len(data) * .8); train, test = data.iloc[:cut], data.iloc[cut:]
    cols = ["lag_1", "lag_3", "lag_7", "lag_14"]
    model = GradientBoostingRegressor(random_state=42, n_estimators=100, max_depth=2, loss="huber")
    model.fit(train[cols], train.target_7d)
    prediction = model.predict(test[cols]); baseline = test.lag_1
    result = {"rows": int(len(data)), "horizon_days": 7,
      "gradient_boosting": {"mae": round(mean_absolute_error(test.target_7d, prediction), 3), "mape": round(mean_absolute_percentage_error(test.target_7d, prediction)*100, 3)},
      "persistence_baseline": {"mae": round(mean_absolute_error(test.target_7d, baseline), 3), "mape": round(mean_absolute_percentage_error(test.target_7d, baseline)*100, 3)},
      "test_from": str(test.check_date.iloc[0]), "test_to": str(test.check_date.iloc[-1])}
    Path(out).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))
if __name__ == "__main__":
    p=argparse.ArgumentParser(); p.add_argument("csv"); p.add_argument("--out", default="metrics.json"); a=p.parse_args(); main(a.csv,a.out)
