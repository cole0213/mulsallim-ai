"""Time-split, multi-reservoir evaluation. Results are evidence, not a deployment claim."""
from __future__ import annotations
import json, math
from pathlib import Path
from datetime import datetime, timedelta

ROOT=Path(__file__).parent
SRC=ROOT/'multiregion_365d.json'
OUT=ROOT/'multiregion_evaluation.json'

def day(s): return datetime.strptime(s,'%Y%m%d').date()
def median(xs):
    xs=sorted(xs); n=len(xs)
    return xs[n//2] if n%2 else (xs[n//2-1]+xs[n//2])/2
def mean(xs): return sum(xs)/len(xs) if xs else 0.0
def std(xs):
    m=mean(xs); return math.sqrt(mean([(x-m)**2 for x in xs]))
def sigmoid(x): return 1/(1+math.exp(-max(-35,min(35,x))))

def examples(reservoir):
    values={day(x['checkDate']):float(x['storageRate']) for x in reservoir['observations']}
    dates=sorted(values)
    out=[]
    for current in dates:
        future=current+timedelta(days=7)
        past=[current-timedelta(days=i) for i in range(0,8)]
        if future not in values or any(x not in values for x in past): continue
        window=[values[x] for x in reversed(past)]
        slope=(window[-1]-window[0])/7
        diffs=[window[i]-window[i-1] for i in range(1,len(window))]
        change=values[future]-values[current]
        out.append({'facilityCode':reservoir['facilityCode'],'region':reservoir['region'],'date':current.isoformat(),'x':[values[current],slope,std(diffs)],'future':values[future],'drop':int(change<=-5.0)})
    cut=int(len(out)*0.70)
    return out[:cut],out[cut:]

def scale(rows):
    cols=list(zip(*[r['x'] for r in rows])); mus=[mean(c) for c in cols]; sigmas=[max(std(c),1e-6) for c in cols]
    return mus,sigmas
def norm(rows,mus,sigmas): return [[1]+[(v-m)/s for v,m,s in zip(r['x'],mus,sigmas)] for r in rows]
def fit_logistic(rows,mus,sigmas,steps=2500,lr=.05,l2=.01):
    xs=norm(rows,mus,sigmas); ys=[r['drop'] for r in rows]; w=[0.0]*len(xs[0])
    for _ in range(steps):
        grad=[0.0]*len(w)
        for x,y in zip(xs,ys):
            p=sigmoid(sum(a*b for a,b in zip(w,x)))
            for j,v in enumerate(x): grad[j]+=(p-y)*v
        for j in range(len(w)): w[j]-=lr*((grad[j]/len(xs))+(l2*w[j] if j else 0))
    return w
def probabilities(rows,mus,sigmas,w):
    return [sigmoid(sum(a*b for a,b in zip(w,x))) for x in norm(rows,mus,sigmas)]
def confusion(labels,scores,t):
    tp=fp=tn=fn=0
    for y,s in zip(labels,scores):
        p=s>=t
        if p and y: tp+=1
        elif p: fp+=1
        elif y: fn+=1
        else: tn+=1
    precision=tp/(tp+fp) if tp+fp else 0
    recall=tp/(tp+fn) if tp+fn else 0
    return {'threshold':round(t,3),'tp':tp,'fp':fp,'tn':tn,'fn':fn,'precision':round(precision,4),'recall':round(recall,4),'f1':round((2*precision*recall/(precision+recall)) if precision+recall else 0,4),'alertRate':round((tp+fp)/max(1,len(labels)),4)}
def choose_threshold(labels,scores):
    results=[confusion(labels,scores,t/100) for t in range(10,91,5)]
    return max(results,key=lambda x:(x['f1'],x['precision']))
def mae(actual,predicted): return mean([abs(a-b) for a,b in zip(actual,predicted)])

raw=json.loads(SRC.read_text(encoding='utf8'))
train=[]; test=[]; per=[]
for reservoir in raw['reservoirs']:
    a,b=examples(reservoir); train+=a; test+=b
    per.append({'facilityCode':reservoir['facilityCode'],'facilityName':reservoir['facilityName'],'region':reservoir['region'],'trainExamples':len(a),'testExamples':len(b),'observations':len(reservoir['observations'])})
if len(train)<200 or len(test)<100: raise SystemExit('not enough valid time-split rows')

mus,sigmas=scale(train); weights=fit_logistic(train,mus,sigmas)
train_scores=probabilities(train,mus,sigmas,weights); test_scores=probabilities(test,mus,sigmas,weights)
threshold=choose_threshold([r['drop'] for r in train],train_scores)['threshold']
candidate=confusion([r['drop'] for r in test],test_scores,threshold)
baseline_scores=[1.0 if r['x'][0]<=50 else 0.0 for r in test]
baseline=confusion([r['drop'] for r in test],baseline_scores,.5)
actual=[r['future'] for r in test]; persistence=[r['x'][0] for r in test]
# A simple multi-region linear trend projection; intentionally compared rather than assumed superior.
trend_projection=[max(0,min(100,r['x'][0]+7*r['x'][1])) for r in test]

result={
 'generatedAt':datetime.now().astimezone().isoformat(),
 'purpose':'Multi-reservoir time-split evidence for field-check prioritization; not a drought forecast deployment claim.',
 'source':raw['source'],
 'coverage':{'reservoirs':len(raw['reservoirs']),'regions':sorted({r['region'] for r in raw['reservoirs']}),'observations':sum(len(r['observations']) for r in raw['reservoirs']),'trainExamples':len(train),'testExamples':len(test),'positiveRateTest':round(mean([r['drop'] for r in test]),4)},
 'definition':{'event':'storage rate decreases by at least 5 percentage points seven calendar days later','split':'first 70% chronological examples per reservoir for training; remaining 30% for held-out test','features':['current storage rate','7-day slope','7-day daily-change volatility']},
 'forecastComparison':{'persistenceMae':round(mae(actual,persistence),3),'trendProjectionMae':round(mae(actual,trend_projection),3),'decision':'trend projection is not deployed unless it beats persistence robustly across expanded data'},
 'fieldCheckSignal':{'baseline':'current storage rate at or below 50%','candidate':'regularized logistic signal trained on three transparent features','thresholdSelectedOnTraining':threshold,'baselineHeldout':baseline,'candidateHeldout':candidate,'decision':'candidate may only be called a field-check prioritization signal; no automatic alert or official drought judgment'},
 'perReservoir':per,
 'model':{'weights':[round(x,6) for x in weights],'means':[round(x,6) for x in mus],'scales':[round(x,6) for x in sigmas]}
}
OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result,ensure_ascii=False,indent=2))
