"""Dependency-free isolation forest for KRC reservoir transition anomaly evidence.

This is not a drought forecast. It scores whether the latest 7-day rate/slope
pattern is uncommon relative to the same reservoir's recent observations.
"""
import csv, json, math, random, sys
from pathlib import Path

def c(n):
    if n <= 1: return 0.0
    return 2 * (math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n

def build(rows, depth, limit, rng):
    if len(rows) <= 1 or depth >= limit:
        return ('leaf', len(rows))
    cols = [i for i in range(len(rows[0])) if max(x[i] for x in rows) > min(x[i] for x in rows)]
    if not cols: return ('leaf', len(rows))
    col = rng.choice(cols); lo, hi = min(x[col] for x in rows), max(x[col] for x in rows)
    cut = rng.uniform(lo, hi); left = [x for x in rows if x[col] < cut]; right = [x for x in rows if x[col] >= cut]
    if not left or not right: return ('leaf', len(rows))
    return ('node', col, cut, build(left, depth + 1, limit, rng), build(right, depth + 1, limit, rng))

def path(tree, row, depth=0):
    if tree[0] == 'leaf': return depth + c(tree[1])
    return path(tree[3] if row[tree[1]] < tree[2] else tree[4], row, depth + 1)

def features(values):
    out=[]
    for i in range(7, len(values)):
        recent=values[i-7:i+1]; slope=(recent[-1]-recent[0])/7; diffs=[recent[j]-recent[j-1] for j in range(1,len(recent))]
        out.append([recent[-1], slope, sum(abs(x) for x in diffs)/len(diffs)])
    return out

def score(rows, trees=100, sample=128):
    rng=random.Random(20260724); n=min(sample,len(rows)); limit=math.ceil(math.log2(max(2,n)))
    forest=[build(rng.sample(rows,n),0,limit,rng) for _ in range(trees)]
    denom=c(n) or 1
    return [2 ** (-sum(path(t,x) for t in forest)/len(forest)/denom) for x in rows]

def main():
    source=Path(sys.argv[1]); out=Path(sys.argv[2])
    rates=[]; dates=[]
    with source.open(encoding='utf-8') as f:
        for row in csv.DictReader(f):
            rates.append(float(row['storage_rate'])); dates.append(row['check_date'])
    rows=features(rates)
    if len(rows)<24: raise SystemExit('need at least 31 daily observations')
    scores=score(rows); latest=scores[-1]; percentile=round(100*sum(x<=latest for x in scores)/len(scores),1)
    payload={'algorithm':'Isolation Forest (dependency-free)', 'purpose':'recent reservoir transition pattern anomaly evidence, not drought forecast', 'features':['storage rate','7-day slope','mean absolute daily change'], 'trainingRows':len(rows), 'latestDate':dates[-1], 'anomalyScore':round(latest,4), 'historicalPercentile':percentile, 'interpretation':'higher score means the latest 7-day pattern is rarer in this reservoir history'}
    out.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8'); print(json.dumps(payload,ensure_ascii=False))
if __name__=='__main__': main()
