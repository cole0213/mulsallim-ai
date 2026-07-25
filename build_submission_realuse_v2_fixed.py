from pathlib import Path

root=Path(__file__).parent
source=(root/'build_submission_realuse_v2.py').read_text(encoding='utf-8')
# The source is retained for auditability. Correct only the missing closing list
# delimiter in the first evaluation matrix before executing it in memory.
needle=" ['완성도','지역·저수지·근거·이번 주 행동·공유·재확인의 단일 흐름 구현'],[3,12])"
replacement=" ['완성도','지역·저수지·근거·이번 주 행동·공유·재확인의 단일 흐름 구현']\n],[3,12])"
if needle not in source:
    raise RuntimeError('Expected evaluation-matrix line was not found.')
exec(compile(source.replace(needle,replacement,1),str(root/'build_submission_realuse_v2.py'),'exec'))
