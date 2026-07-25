import csv, json, sys
from pathlib import Path
from transition_anomaly import features, score

source=Path(sys.argv[1]); out=Path(sys.argv[2]); rates=[]; dates=[]
with source.open(encoding='utf-8') as f:
    for row in csv.DictReader(f):
        rates.append(float(row['rate'])); dates.append(row['check_date'])
rows=features(rates)
if len(rows)<24: raise SystemExit('need at least 31 daily observations')
scores=score(rows); latest=scores[-1]; percentile=round(100*sum(x<=latest for x in scores)/len(scores),1)
payload={'algorithm':'Isolation Forest (dependency-free)', 'purpose':'recent reservoir transition pattern anomaly evidence, not drought forecast', 'features':['storage rate','7-day slope','mean absolute daily change'], 'trainingRows':len(rows), 'latestDate':dates[-1], 'anomalyScore':round(latest,4), 'historicalPercentile':percentile, 'interpretation':'higher score means the latest 7-day pattern is rarer in this reservoir history'}
out.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8'); print(json.dumps(payload,ensure_ascii=False))
