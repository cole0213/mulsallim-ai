from pathlib import Path
import re

root=Path(__file__).parent
source=(root/'build_submission_realuse_v2.py').read_text(encoding='utf-8')
number=r'\d+(?:\.\d+)?'
fixed=re.sub(r"(?<=')\],\[("+number+r"(?:,"+number+r")*)\]\)", r"]\n],[\1])", source)
exec(compile(fixed,str(root/'build_submission_realuse_v2.py'),'exec'))
