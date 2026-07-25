from pathlib import Path

root=Path(__file__).parent
source=(root/'build_submission_realuse_v2.py').read_text(encoding='utf-8')
needle="'],[3,12])\n\nheading(d,'1."
replacement="']\n],[3,12])\n\nheading(d,'1."
if needle not in source:
    raise RuntimeError('Expected evaluation-matrix delimiter was not found.')
exec(compile(source.replace(needle,replacement,1),str(root/'build_submission_realuse_v2.py'),'exec'))
