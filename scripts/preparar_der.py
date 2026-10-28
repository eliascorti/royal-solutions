"""Genera una única lámina DER completa y su fuente Mermaid."""
from pathlib import Path
from html import escape
import runpy,json
ROOT=Path(__file__).resolve().parents[1]
m=runpy.run_path(str(ROOT/'docs/poc/modelo.py'))
relations=m['RELATIONS'];entities=m['ENTITIES']
assert len({(a,b,k) for a,b,k,c,o in relations})==len(relations)
assert all(a in entities and b in entities for a,b,k,c,o in relations)
lines=['digraph DER {', 'graph [rankdir=LR, bgcolor="white", pad="0.4", nodesep="0.35", ranksep="1.0", splines=polyline, outputorder=edgesfirst];', 'node [shape=plain, fontname="Arial"];', 'edge [fontname="Arial", fontsize=9, color="#6F8090", arrowsize=0.7];']
for key,(origin,attrs) in entities.items():
 label='<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="5" COLOR="#B5C4CF"><TR><TD BGCOLOR="#174765"><FONT COLOR="white"><B>'+key+'</B></FONT></TD></TR><TR><TD ALIGN="LEFT" BGCOLOR="#F6F8FA">'+'<BR ALIGN="LEFT"/>'.join(escape(x) for x in attrs)+'<BR ALIGN="LEFT"/></TD></TR></TABLE>'
 lines.append(f'{key} [label=<{label}>];')
for a,b,fk,card,optional in relations:
 parent='0..1' if optional else '1'
 lines.append(f'{a} -> {b} [label="{fk}",dir=none,taillabel="{parent}",headlabel="{card}",labeldistance=2.0];')
lines.append('}')
(ROOT/'docs/poc/der').mkdir(exist_ok=True)
(ROOT/'docs/poc/der/completo.dot').write_text('\n'.join(lines)+'\n',encoding='utf-8')
lines=['erDiagram']
for a,b,fk,card,opt in relations:
 left='|o' if opt else '||';right='o|' if card=='0..1' else 'o{'
 lines.append(f'    {a} {left}--{right} {b} : "{fk}"')
(ROOT/'docs/poc/DER.mmd').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps(dict(entidades=len(entities),relaciones=len(relations),laminas=1)))
