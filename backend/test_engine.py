from analyzer_engine import analyze_code
from samples import SAMPLES

for s in SAMPLES:
    res = analyze_code(s["code"])
    print(f"=== {s['name']} ===")
    print(f"Tokens: {len(res['tokens'])}, Symbols: {len(res['symbol_table'])}, Issues: {len(res['issues'])}")
    print(f"Score: {res['metrics']['quality_score']}%, Grade: {res['metrics']['grade']}, Comp: {res['metrics']['cyclomatic_complexity']}")
    print("Issue types:", [i["type"] for i in res["issues"]])
    print()
