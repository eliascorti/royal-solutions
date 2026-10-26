"""Reemplaza solo las secciones 14/15 y conserva las primeras 15 páginas del PDF.

Ejecutar con Python con reportlab y pypdf instalados.
Contenido editable: docs/poc/especificacion.py. También emite una versión Markdown.
"""
from pathlib import Path
import hashlib
import json
import runpy
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'material-fuente' / 'RoyalSolutions_Final.pdf'
OUT = ROOT / 'output' / 'pdf' / 'RoyalSolutions_Final_Corregido_POC.pdf'
TMP = ROOT / 'tmp' / 'pdfs'
D = runpy.run_path(str(ROOT / 'docs' / 'poc' / 'especificacion.py'))
RF, CU, SCOPE = D['REQUIREMENTS'], D['CASES'], D['SCOPE']

def ident(prefix,n): return f'{prefix}-{n:02d}'
def refs(numbers): return ', '.join(ident('RF',n) for n in numbers)

def validate_spec():
    expected=set(range(1,36))
    assert {r[0] for r in RF} == expected and len(RF)==35
    assert {c['number'] for c in CU} == set(range(1,29)) and len(CU)==28
    assert {n for c in CU for n in c['rfs']} == expected, 'Requerimientos sin CU o referencias inexistentes'
    assert {n for _,_,yes,ns in SCOPE if yes for n in ns} == expected, 'Alcance y RF no coinciden'
    for c in CU:
        assert all(c[k] for k in ['title','actor','description','pre','post','steps','alternatives'])
        assert set(c['rfs']) <= expected
    return {ident('RF',n):[ident('CU',c['number']) for c in CU if n in c['rfs']] for n in range(1,36)}

inverse=validate_spec()
styles=getSampleStyleSheet()
for font,file in [('Body','times.ttf'),('Bold','timesbd.ttf'),('Italic','timesi.ttf')]:
    pdfmetrics.registerFont(TTFont(font,str(Path('C:/Windows/Fonts')/file)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Italic',boldItalic='Bold')
blue=colors.HexColor('#155A87')
styles.add(ParagraphStyle(name='Main',fontName='Body',fontSize=10.5,leading=13.8,spaceAfter=6,alignment=TA_LEFT))
styles.add(ParagraphStyle(name='H1x',fontName='Bold',fontSize=16,leading=20,textColor=blue,spaceAfter=12,keepWithNext=True))
styles.add(ParagraphStyle(name='H2x',fontName='Bold',fontSize=12.6,leading=16,textColor=blue,spaceBefore=10,spaceAfter=7,keepWithNext=True))
styles.add(ParagraphStyle(name='H3x',fontName='Bold',fontSize=11.4,leading=14.5,spaceBefore=8,spaceAfter=6,keepWithNext=True))
styles.add(ParagraphStyle(name='Cell',fontName='Body',fontSize=9,leading=11.4,spaceAfter=0))
styles.add(ParagraphStyle(name='HeadCell',parent=styles['Cell'],fontName='Bold',textColor=colors.white))
styles.add(ParagraphStyle(name='Tiny',fontName='Body',fontSize=8.2,leading=10.3,spaceAfter=4))
styles.add(ParagraphStyle(name='Bulletx',parent=styles['Main'],leftIndent=12,firstLineIndent=-9,spaceAfter=3))
W=508
story=[]
md=[]
def p(text,style='Main'): return Paragraph(escape(str(text)),styles[style])
def add(text): story.append(p(text));md.append(text+'\n')
def heading(text,level=2): story.append(p(text,{1:'H1x',2:'H2x',3:'H3x'}[level]));md.append('#'*level+' '+text+'\n')
def bullet(text): story.append(p('- '+text,'Bulletx'));md.append('- '+text)
def table(headers,rows,widths,small=False):
    data=[[p(x,'HeadCell') for x in headers]]+[[p(x,'Cell' if not small else 'Tiny') for x in row] for row in rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),blue),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('GRID',(0,0),(-1,-1),.4,colors.HexColor('#B6C0C7')),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F3F6F8')]),
        ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
    ]))
    story.extend([t,Spacer(1,8)])
    md.append('| '+' | '.join(headers)+' |')
    md.append('| '+' | '.join('---' for _ in headers)+' |')
    md.extend('| '+' | '.join(str(x).replace('|','/') for x in row)+' |' for row in rows)
    md.append('')

heading('14. Alcance completo del proyecto y recorte de la POC',1)
add('Revisión funcional del '+D['REVISION']+'. Las secciones anteriores de contexto, introducción, investigación, encuestas y sus gráficos se conservan sin modificaciones. Esta revisión actualiza exclusivamente alcance, requerimientos, reglas de los recorridos, actores, casos de uso y trazabilidad.')
heading('14.1. Qué se presenta: POC, MVP y proyecto completo')
add('La entrega académica es una prueba de concepto (POC): representa la factibilidad y coherencia del recorrido entre cliente, prestador y administración. Su recorte funcional corresponde a un MVP avanzado de demostración. No se presenta como una plataforma lista para operar ni como evidencia nueva de validación de mercado.')
add('MVP designa las capacidades seleccionadas para el recorrido central. POC indica el nivel de ejecución de esta entrega: datos, documentos, pagos y servicios externos de ejemplo. Alcance completo reúne ese recorte y las capacidades futuras previstas. En esta revisión, las filas marcadas POC y todos los RF-01 a RF-35 pertenecen al mismo recorte funcional, sin marcas contradictorias entre tablas.')
add('El recorrido central comprende: cuenta y perfil; alta del prestador con cobertura y disponibilidad; publicación o consulta de candidatos; postulación y contratación; confirmación o rechazo; ejecución e importe; pago por efectivo, transferencia o Mercado Pago; comisión, reputación e historial. También se representa la regularización de la comisión pendiente que genera el efectivo.')
add('Las integraciones reales de Mercado Pago, banco, correo, push, identidad, cifrado y GPS no se presumen implementadas. Se representan sus entradas, resultados y efectos locales. La operación real requerirá desarrollo, verificación y definiciones técnicas adicionales. La matriz especifica requisitos; no certifica por sí sola que una versión del software ya los cumple.')

heading('14.1.1. Funcionalidades seleccionadas y evolución futura')
add('POC = incluido como interacción o simulación de esta entrega. Futuro = parte de la visión del proyecto, excluido del recorrido obligatorio de demostración. Un mapa esquemático o una agenda son representaciones de una función ya vinculada a sus RF, no nuevas integraciones externas.')
table(['Módulo','Funcionalidad','Recorte','RF'],[(a,b,'POC' if y else 'Futuro',refs(ns) if ns else '-') for a,b,y,ns in SCOPE],[76,289,43,100])

heading('14.1.2. Recorridos coherentes por actor')
table(['Actor','Recorrido','Casos de uso'],D['FLOW_MAP'],[78,292,138])
add('El cliente registra el pago del servicio y el prestador registra la regularización de una deuda de comisión. Son operaciones diferentes, con pagadores y destinatarios diferentes. Ambas deben conservar su referencia y sus efectos independientes.')

heading('14.1.3. Disponibilidad, pagos y reglas compartidas')
for title,items in D['RULES']:
    heading(title,3)
    for item in items: bullet(item)

state_start=len(story)
heading('14.1.4. Estados y condiciones de cierre')
table(['Estado de la orden','Significado','Origen'],D['ORDER_STATES'],[100,298,110])
add('Informar finalización no agrega un estado de orden: se registran ejecución y monto y se mantiene Confirmada hasta el pago, o se deriva a En revisión. Calificar tampoco cambia Finalizada por un estado nuevo. No se exige un código de inicio ni estados de desplazamiento para el cierre del servicio.')
add('Solicitud: abierta, cerrada a postulaciones al contratar o cancelada; el rechazo/vencimiento de la orden puede reabrirla. No se fija un vencimiento automático de solicitud sin una política configurada.')
add('Pago del servicio y regularización: pendiente, pendiente de acreditación cuando se adjunta transferencia, acreditado, rechazado o en revisión. Aprobado en MP corresponde a acreditado dentro de la representación. El rechazo de un pago permite reintento y no rechaza por sí solo la orden.')
add('Alta: incompleta, pendiente de verificación o activa. La revisión documental puede exigir correcciones. Ausencia de horario y franja ocupada no son suspensiones de cuenta. Un reporte puede quedar pendiente, en revisión o resuelto; su resolución no acredita dinero automáticamente.')
add('Solo después de reconocer/acreditar el pago del servicio se finaliza la orden y se habilita una reseña por participante. Los movimientos de cobro, comisión y regularización deben registrarse una sola vez por operación reconocida, incluso si se repite una confirmación.')
state_block=story[state_start:]
del story[state_start:]
story.append(KeepTogether(state_block))

story.append(PageBreak())
heading('14.2. Requerimientos funcionales del MVP/POC',1)
add('Se conservan RF-01 a RF-30 para mantener las referencias históricas y se aclara su redacción. RF-31 a RF-35 completan Mercado Pago, resumen de comisiones, regularización, finalización común y revisión administrativa. Todos están incluidos en la POC; su ejecución externa real queda fuera de esta entrega.')
table(['Código','Módulo','Requerimiento','POC'],[(ident('RF',n),m,t,'Sí') for n,m,t in RF],[47,81,342,38])

criteria_start=len(story)
heading('14.3. Criterios de coherencia de la demostración')
for item in [
 'Toda función incluida en el recorte tiene al menos un RF y un CU asociado. Una vista visual adicional, como Día/Semana, se vincula al CU existente que representa.',
 'Los tres medios previstos para pagar el servicio son efectivo, transferencia y Mercado Pago. Gestionar referencias de tarjetas no incorpora un cobro directo con tarjeta independiente.',
 'Cliente y prestador observan la misma orden y el mismo importe. Una corrección administrativa se informa a ambos antes de continuar el pago.',
 'La comisión por efectivo es deuda del prestador; la comisión digital es una deducción del cobro representado. No se suman las dos para una misma operación.',
 'Una transferencia adjuntada y un resultado MP pendiente no son acreditaciones. La deuda o el neto solo cambian al representar una confirmación válida.',
 'Los documentos y los ejemplos de la POC son ficticios. Los gráficos y conclusiones de las encuestas anteriores no se recalculan ni se reinterpretan como resultados nuevos.',
]:bullet(item)
criteria_block=story[criteria_start:]
del story[criteria_start:]
story.append(KeepTogether(criteria_block))

heading('15. Casos de uso y trazabilidad',1)
add('Se mantiene la numeración CU-01 a CU-23 y se completa su coherencia con los recorridos revisados. Se agregan CU-24 (Mercado Pago), CU-25 (consulta de cobros/comisiones), CU-26 (regularización), CU-27 (finalización común) y CU-28 (revisión de pagos). No se agrega un CU separado por cada botón o modo de visualización.')
heading('15.1. Actores del sistema')
table(['Actor','Tipo','Responsabilidad en esta entrega'],D['ACTORS'],[110,91,307])
heading('15.1.1. Relación entre acciones del cliente y del prestador')
add('El alta del prestador parte de una cuenta cliente. La contratación la inicia el cliente; la aceptación y finalización las informa el prestador. El cliente reconoce el importe y paga el servicio. Ambos pueden consultar la orden y calificar después del cierre. El prestador consulta su comisión y, si corresponde, paga su propia deuda a Royal. El administrador representa decisiones y verificaciones cuando el circuito las necesita.')

story.append(PageBreak())
heading('15.2. Matriz de trazabilidad CU - RF',1)
add('La X indica que el caso de uso implementa o utiliza explícitamente el requerimiento. Los bloques A, B y C conforman una única matriz; las filas CU-01 a CU-28 se repiten para facilitar la lectura.')
for label,start,end in [('A',1,12),('B',13,24),('C',25,35)]:
    heading(f'Bloque {label}: RF-{start:02d} a RF-{end:02d}')
    ns=list(range(start,end+1))
    rows=[(ident('CU',c['number']),)+tuple('X' if n in c['rfs'] else '' for n in ns) for c in CU]
    table(['CU']+[ident('RF',n) for n in ns],rows,[58]+[(W-58)/len(ns)]*len(ns),small=True)
    story.append(PageBreak())
heading('15.2.1. Trazabilidad inversa y cobertura')
add('Todos los RF incluidos tienen cobertura. La siguiente relación permite localizar el caso correspondiente sin interpretar una celda vacía como un requisito fuera del MVP.')
table(['RF','Casos asociados','RF','Casos asociados'],[(ident('RF',a),', '.join(inverse[ident('RF',a)]),ident('RF',b) if b<=35 else '',', '.join(inverse[ident('RF',b)]) if b<=35 else '') for a,b in zip(range(1,19),range(19,37))],[45,209,45,209])

story.append(PageBreak())
heading('15.3. Especificación de casos de uso',1)
add('Los flujos describen el comportamiento acordado para la POC. Las operaciones externas se representan con datos de prueba, sin afirmar validación bancaria, documental o de identidad real. Los parámetros numéricos de demostración se identifican en 14.1.3.')
for c in CU:
    group=[p(ident('CU',c['number'])+' - '+c['title'],'H2x')]
    group.append(Paragraph('<b>Actor:</b> '+escape(c['actor'])+'<br/><b>RF asociados:</b> '+escape(refs(c['rfs']))+'<br/><b>Incluido:</b> MVP/POC',styles['Main']))
    for label,key in [('Descripción','description'),('Precondiciones','pre'),('Postcondiciones','post')]:
        group.append(Paragraph('<b>'+label+':</b> '+escape(c[key]),styles['Main']))
    group.append(Paragraph('<b>Flujo principal</b>',styles['Main']))
    for i,s in enumerate(c['steps'],1):group.append(p(f'{i}. {s}','Bulletx'))
    group.append(Paragraph('<b>Flujos alternativos</b>',styles['Main']))
    for i,s in enumerate(c['alternatives'],1):group.append(p(f'A{i}. {s}','Bulletx'))
    group.append(Spacer(1,8))
    story.append(KeepTogether(group))
    md.extend(['### '+ident('CU',c['number'])+' - '+c['title'],'',f"**Actor:** {c['actor']}  ",f"**RF:** {refs(c['rfs'])}  ",'**Incluido:** MVP/POC',''])
    for label,key in [('Descripción','description'),('Precondiciones','pre'),('Postcondiciones','post')]:md.append(f'**{label}:** {c[key]}\n')
    md.append('**Flujo principal**\n');md.extend(f'{i}. {s}' for i,s in enumerate(c['steps'],1))
    md.append('\n**Alternativas**\n');md.extend(f'- {s}' for s in c['alternatives']);md.append('')

OUT.parent.mkdir(parents=True,exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
part=TMP/'secciones_14_15_poc.pdf'
def footer(canvas,doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#B6C0C7'));canvas.line(44,39,552,39)
    canvas.setFont('Body',8);canvas.setFillColor(colors.HexColor('#53636E'))
    canvas.drawString(44,27,'Royal Solutions | Especificación funcional POC | 26/10/2026')
    canvas.drawRightString(552,27,str(doc.page+15));canvas.restoreState()
doc=SimpleDocTemplate(str(part),pagesize=(596,842),leftMargin=44,rightMargin=44,topMargin=43,bottomMargin=53,title=D['TITLE'],author='Equipo Royal Solutions',allowSplitting=True)
doc.build(story,onFirstPage=footer,onLaterPages=footer)

original=PdfReader(SOURCE)
assert len(original.pages)==33 and original.pages[15].extract_text().strip().startswith('14.'), 'Fuente inesperada: revisar punto de corte'
writer=PdfWriter()
writer.append(original,pages=(0,15))
writer.append(PdfReader(part))
writer.add_metadata({'/Title':D['TITLE'],'/Author':'Equipo Royal Solutions','/Subject':'Secciones 14/15 corregidas; páginas 1-15 originales conservadas','/Keywords':'POC, MVP, alcance, requerimientos, casos de uso, trazabilidad'})
with OUT.open('wb') as f:writer.write(f)

final=PdfReader(OUT)
preserved=[]
for i in range(15):
    a,b=original.pages[i],final.pages[i]
    assert a.extract_text()==b.extract_text(),f'Texto alterado: página {i+1}'
    ah=hashlib.sha256(a.get_contents().get_data()).hexdigest()
    bh=hashlib.sha256(b.get_contents().get_data()).hexdigest()
    assert ah==bh,f'Contenido gráfico alterado: página {i+1}'
    imgs_a=sorted(hashlib.sha256(im.data).hexdigest() for im in a.images)
    imgs_b=sorted(hashlib.sha256(im.data).hexdigest() for im in b.images)
    assert imgs_a==imgs_b,f'Imagen alterada: página {i+1}'
    preserved.append(dict(page=i+1,content_sha256=ah,image_count=len(imgs_a)))
new_text='\n'.join(pg.extract_text() for pg in final.pages[15:])
for n in range(1,36):assert ident('RF',n) in new_text
for n in range(1,29):assert ident('CU',n) in new_text
assert all(len(pg.extract_text().strip())>80 for pg in final.pages[15:]),'Página nueva casi vacía'
report=dict(output=str(OUT),source=str(SOURCE),pages=len(final.pages),original_pages_preserved=preserved,requirements=35,use_cases=28,scope_rows=len(SCOPE),traceability=inverse,coverage_ok=True)
(TMP/'validacion_documento.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'docs'/'SECCIONES_14_15_POC.md').write_text('\n'.join(line.rstrip() for line in md)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['output','pages','requirements','use_cases','scope_rows','coverage_ok']},ensure_ascii=False))
print('Primeras 15 páginas: texto, streams gráficos e imágenes idénticos al original.')
