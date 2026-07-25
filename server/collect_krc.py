import os, sys, csv, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import date, timedelta
from pathlib import Path

def envfile(path):
    for line in Path(path).read_text().splitlines():
        if line.startswith('KRC_SERVICE_KEY='): return line.split('=',1)[1].strip()
    raise RuntimeError('KRC_SERVICE_KEY가 없습니다.')
def main(code, out, env='/root/mulsallim_ai/.env'):
    key=envfile(env); end=date.today(); start=end-timedelta(days=364)
    q=urllib.parse.urlencode({'serviceKey':key,'pageNo':1,'numOfRows':400,'fac_code':code,'date_s':start.strftime('%Y%m%d'),'date_e':end.strftime('%Y%m%d')})
    url='http://apis.data.go.kr/B552149/reserviorWaterLevel/reservoirlevel/?'+q
    root=ET.fromstring(urllib.request.urlopen(url,timeout=30).read())
    rows=[]
    for item in root.findall('.//item'):
        rows.append({'check_date':item.findtext('check_date'),'rate':item.findtext('rate'),'water_level':item.findtext('water_level')})
    if not rows: raise RuntimeError('수집된 관측자료가 없습니다.')
    with open(out,'w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=['check_date','rate','water_level']);w.writeheader();w.writerows(rows)
    print('COLLECTED_ROWS='+str(len(rows)))
if __name__=='__main__': main(sys.argv[1],sys.argv[2])
