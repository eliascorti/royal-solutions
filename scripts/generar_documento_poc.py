"""Actualiza las secciones del PDF conservando su diseño y un DER completo.
Uso: python scripts/generar_documento_poc.py --source "ruta/al/PDF_original.pdf"
"""
from pathlib import Path
from io import BytesIO
from xml.sax.saxutils import escape
import argparse, hashlib, json, runpy, sys
ROOT=Path(__file__).resolve().parents[1]
# Dependencia opcional local para las correcciones puntuales sobre el PDF.
if (ROOT/'tmp/pdf-tools').exists():sys.path.insert(0,str(ROOT/'tmp/pdf-tools'))
import pymupdf
from pypdf import PdfReader,PdfWriter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate,Paragraph,Table,TableStyle,Spacer,PageBreak,KeepTogether
from reportlab.pdfgen import canvas
parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);args=parser.parse_args()
SOURCE=args.source.resolve();OUT=ROOT/'output/pdf';TMP=ROOT/'tmp/pdfs'
OUT.mkdir(parents=True,exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
D=runpy.run_path(str(ROOT/'docs/poc/especificacion.py'));M=runpy.run_path(str(ROOT/'docs/poc/modelo.py'))
RF=D['EXTRA_REQUIREMENTS'];CU=D['EXTRA_CASES']
assert [r[0] for r in RF]==list(range(31,39))
assert [c['number'] for c in CU]==list(range(24,34))
assert {n for c in CU for n in c['rfs'] if n>30}==set(range(31,39))
assert all(set(c['rfs'])<=set(range(1,39)) for c in CU)
def ident(p,n):return f'{p}-{n:02d}'
def refs(ns):return ', '.join(ident('RF',n) for n in ns)

# Se conservan las páginas originales, sin reconstruir portada, tablas ni matrices.
source=PdfReader(SOURCE);assert len(source.pages)==35
edited=pymupdf.open(SOURCE);patches=[]
fontfile='C:/Windows/Fonts/times.ttf'
def replace_line(page_index,needle,new):
 page=edited[page_index];lines=[ln for b in page.get_text('dict')['blocks'] if 'lines' in b for ln in b['lines']]
 matches=[ln for ln in lines if needle in ''.join(s['text'] for s in ln['spans'])];assert len(matches)==1,(needle,len(matches))
 ln=matches[0];sp=ln['spans'][0];rect=pymupdf.Rect(ln['bbox']);x,y=sp['origin'];fs=sp['size']
 assert pymupdf.Font(fontfile=fontfile).text_length(new,fontsize=fs)<530-x
 page.add_redact_annot(rect,fill=(1,1,1));page.apply_redactions(images=0,graphics=0)
 page.insert_font(fontname='TNR',fontfile=fontfile);page.insert_text((x,y),new,fontname='TNR',fontsize=fs)
 patches.append(dict(page=page_index+1,old=needle,new=new))
def replace_cell(page_index,needle,new):
 page=edited[page_index];blocks=[b for b in page.get_text('dict')['blocks'] if 'lines' in b]
 matches=[b for b in blocks if needle in ' '.join(s['text'] for ln in b['lines'] for s in ln['spans'])];assert len(matches)==1,(needle,len(matches))
 b=matches[0];right=[ln for ln in b['lines'] if ln['bbox'][0]>290];assert right
 rect=pymupdf.Rect(300.7,min(ln['bbox'][1] for ln in right)-.1,530,max(ln['bbox'][3] for ln in right)+3)
 fs=right[0]['spans'][0]['size'];page.add_redact_annot(rect,fill=(1,1,1));page.apply_redactions(images=0,graphics=0)
 page.insert_font(fontname='TNR',fontfile=fontfile)
 remain=page.insert_textbox(rect,new,fontname='TNR',fontsize=fs,lineheight=1.08)
 assert remain>=0,(needle,remain)
 patches.append(dict(page=page_index+1,old=needle,new=new))
# Cambios concretos sin tocar el diseño ni la numeración de las tablas originales.
# Sustituir solo la palabra que afirmaba un cifrado inexistente.
p=edited[24];rects=p.search_for('cifrada.');assert len(rects)==1
rect=rects[0];lines=[ln for b in p.get_text('dict')['blocks'] if 'lines' in b for ln in b['lines'] if any('cifrada.' in s['text'] for s in ln['spans'])];assert len(lines)==1
ln=lines[0];text=''.join(s['text'] for s in ln['spans']).replace('cifrada.','local.')
replace_line(24,'cifrada.',text)
replace_line(27,'(efectivo, transferencia o tarjeta).','(efectivo, transferencia o Mercado Pago).')
replace_cell(29,'El usuario otorgó permisos de notificación','El usuario tiene una sesión iniciada en la aplicación.')
replace_cell(29,'Se produce un evento relevante', '1. Se produce un evento relevante (solicitud, postulación, confirmación, cancelación o pago).\n2. Se determinan los destinatarios por rubro, zona y participación en la orden.\n3. Se registra el aviso en la aplicación.\n4. El usuario abre la notificación y accede a la pantalla correspondiente.')
replace_cell(29,'El envío falla o el usuario no tiene permisos activos','3.a. Si el usuario desactiva los avisos, la notificación queda en el centro de notificaciones de la aplicación.')
replace_cell(31,'El usuario accede a la sección "Mis órdenes"','1. El usuario abre Mis changas o Historial.\n2. Se recuperan sus órdenes por estado y fecha.\n3. El prestador puede consultar la agenda diaria.\n4. Selecciona una orden para ver su detalle.')
patched=TMP/'original_ajustes_puntuales.pdf';edited.save(patched);edited.close();patched_reader=PdfReader(patched)
patched_pages={x['page'] for x in patches}

for name,file in [('Body','times.ttf'),('Bold','timesbd.ttf')]:pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
styles=getSampleStyleSheet();blue=colors.HexColor('#1F4E78')
for name,size,leading,kw in [('Text',10.5,13.5,dict(spaceAfter=7)),('H1x',15,18,dict(fontName='Bold',textColor=blue,spaceAfter=10,keepWithNext=True)),('H2x',13,16,dict(fontName='Bold',spaceAfter=7,spaceBefore=9,keepWithNext=True)),('Cell',9.5,11.5,dict()),('Head',8,10,dict(fontName='Bold',textColor=colors.white)),('Matrix',7.5,9,dict()),('MatrixHead',6.5,8,dict(fontName='Bold',textColor=colors.white))]:
 attrs=dict(fontName='Body',fontSize=size,leading=leading);attrs.update(kw);styles.add(ParagraphStyle(name=name,**attrs))
styles.add(ParagraphStyle(name='WhiteCell',parent=styles['Cell'],textColor=colors.white))
def p(t,style='Text'):return Paragraph(escape(str(t)),styles[style])
story=[];md=[]
def heading(t,level=2):story.append(p(t,'H1x' if level==1 else 'H2x'));md.append('#'*level+' '+t+'\n')
def add(t):story.append(p(t));md.append(t+'\n')
def table(headers,rows,widths,matrix=False):
 rows=list(rows);data=[[p(h,'MatrixHead' if matrix else 'Head') for h in headers]]+[[p(v,'Matrix' if matrix else 'Cell') for v in row] for row in rows]
 t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),blue),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#B6C0C7')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4)]));story.extend([t,Spacer(1,7)])
 md.extend(['| '+' | '.join(headers)+' |','| '+' | '.join('---' for h in headers)+' |']+['| '+' | '.join(str(v) for v in row)+' |' for row in rows]+[''])
def build(path,items,top=57):SimpleDocTemplate(str(path),pagesize=(595.28,841.89),leftMargin=62.35,rightMargin=62.35,topMargin=top,bottomMargin=48,title='Royal Solutions - POC',author='Equipo Royal Solutions').build(items)
# Requerimientos en 14.2, matrices en 15.2 y casos en 15.3.
heading('14.2. Requerimientos')
table(['Código','Detalle','Tipo','Módulo','MVP'],[(ident('RF',n),t,'Funcional',m,'Sí') for n,m,t in RF],[44,252.58,49,91,34])
requirements_part=TMP/'requerimientos.pdf';build(requirements_part,story,top=142)
requirements_md=list(md)
story=[];md=[]
for title,ns in [('Bloque B - RF-16 a RF-30',list(range(16,31))),('Bloque C - RF-31 a RF-38',list(range(31,39)))]:
 heading(title)
 table(['CU']+[ident('RF',n) for n in ns],[(ident('CU',c['number']),)+tuple('X' if n in c['rfs'] else '' for n in ns) for c in CU],[42]+[(470.58-42)/len(ns)]*len(ns),matrix=True)
matrices_part=TMP/'matrices.pdf';build(matrices_part,story,top=222)
matrices_md=list(md)
story=[];md=[]
for c in CU:
 items=[p(ident('CU',c['number'])+' - '+c['title'],'H2x')]
 rows=[('Actor principal',c['actor']),('RF asociados',refs(c['rfs'])),('Descripción',c['description']),('Precondiciones',c['pre']),('Postcondiciones',c['post']),('Flujo principal','\n'.join(f'{i}. {x}' for i,x in enumerate(c['steps'],1))),('Flujos alternativos','\n'.join(f'{i}. {x}' for i,x in enumerate(c['alternatives'],1)))]
 values=[[Paragraph('<b>'+escape(a)+'</b>',styles['Cell']),Paragraph(escape(b).replace('\n','<br/>'),styles['Cell'])] for a,b in rows]
 values[0]=[Paragraph('<b>'+escape(rows[0][0])+'</b>',styles['WhiteCell']),p(rows[0][1],'WhiteCell')]
 t=Table(values,colWidths=[234,236.58],hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),blue),('GRID',(0,0),(-1,-1),.6,colors.black),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4)]));items.extend([t,Spacer(1,8)]);story.append(KeepTogether(items))
 md.extend(['### '+ident('CU',c['number'])+' - '+c['title'],'']+[f'**{a}:** {b}\n' for a,b in rows])
cases_part=TMP/'casos_uso.pdf';build(cases_part,story)
(ROOT/'docs/SECCIONES_14_15_POC.md').write_text('# Requerimientos, matriz de trazabilidad y casos de uso\n\n'+'\n'.join(x.rstrip() for x in requirements_md+matrices_md+md).rstrip()+'\n',encoding='utf-8')

# Sustituir únicamente la sección 16 antigua: una lámina completa y reglas concisas.
story=[];heading('16.1. Lectura del modelo y reglas de integridad',1)
for t in [
 'Un usuario puede tener un único perfil de prestador. Sus rubros, zonas y franjas se relacionan mediante PRESTADOR_RUBRO, COBERTURA y DISPONIBILIDAD. Los documentos se vinculan al prestador y, cuando corresponde, al rubro.',
 'El cliente publica solicitudes y cada solicitud admite postulaciones de distintos prestadores. La combinación solicitud + prestador es única. ORDEN registra cliente, prestador y rubro; solicitud y postulación son opcionales para permitir la contratación directa desde el catálogo. Si existen, deben corresponder a los mismos participantes y rubro.',
 'PAGO se vincula de forma única con la orden. Los reintentos actualizan su estado e historial. MOVIMIENTO conserva los asientos internos de cobro, comisión y regularización, sin implicar una billetera del prestador. La acreditación no duplica movimientos.',
 'Una orden finalizada admite hasta dos reseñas: una por participante. La combinación orden + autor es única; autor y destinatario deben ser las contrapartes. El vínculo se conserva aunque el código no se muestre en la reputación.',
 'Los reportes del servicio y sus evidencias se distinguen de las denuncias de reseñas. Mensajes, notificaciones, favoritos, tarjetas y recuperación de contraseña conservan sus relaciones con usuarios, prestadores u órdenes según el diagrama.',
 'La dirección de una solicitud u orden es una copia histórica: no cambia si luego se edita una dirección del usuario. Las reservas confirmadas se mantienen al editar la disponibilidad.',
]:add(t)
heading('16.2. Correspondencia con el POC y límites del modelo')
add('El DER reúne en una sola vista los datos de los casos de uso del sistema. Las entidades de usuario, prestador y documentos respaldan el alta; solicitud, postulación y orden respaldan la contratación; pago y movimiento respaldan cobros y comisiones; reseña y reporte respaldan reputación y moderación. Las restantes entidades completan acceso, comunicación y datos del perfil.')
add('PK identifica la clave primaria, FK la clave foránea y UK una restricción única. Las cardinalidades están indicadas en los extremos. Este es el modelo lógico de la POC; la implementación actual utiliza objetos JSON en localStorage, sin una base SQL desplegada. El diseño no introduce nuevas pantallas ni funciones fuera del alcance.')
rules=TMP/'reglas_der.pdf';build(rules,story)
der=TMP/'der-completo.pdf';assert len(PdfReader(der).pages)==1
# PDF separado: un solo DER y una sola página.
writer=PdfWriter();writer.append(PdfReader(der));writer.add_metadata({'/Title':'Royal Solutions - DER completo','/Author':'Equipo Royal Solutions'})
der_out=OUT/'RoyalSolutions_DER_Actualizado.pdf'
with der_out.open('wb') as f:writer.write(f)

# Recortes conservan el diseño original y permiten insertar el contenido en su sección.
def region(page_index,top,bottom,output):
 doc=pymupdf.open(SOURCE)
 # Copiar primero la página, luego retirar solo el contenido fuera de la región.
 single=pymupdf.open();single.insert_pdf(doc,from_page=page_index,to_page=page_index)
 pg=single[0];w,h=pg.rect.width,pg.rect.height
 if top>0:pg.add_redact_annot(pymupdf.Rect(0,0,w,top),fill=(1,1,1))
 if bottom<h:pg.add_redact_annot(pymupdf.Rect(0,bottom,w,h),fill=(1,1,1))
 pg.apply_redactions(images=0,graphics=2)
 dest=pymupdf.open();new=dest.new_page(width=w,height=h)
 target_top=top if top==0 else 57
 clip=pymupdf.Rect(0,top,w,bottom)
 new.show_pdf_page(pymupdf.Rect(0,target_top,w,target_top+bottom-top),single,0,clip=clip)
 dest.save(output);doc.close();single.close();dest.close()
region(19,0,130,TMP/'rf30.pdf')
region(19,375,800,TMP/'actores.pdf')
region(21,0,190,TMP/'matriz_original.pdf')
region(21,385,790,TMP/'cu01.pdf')
writer=PdfWriter();page_map={}
def add_original(i):
 page_map[i+1]=len(writer.pages)
 writer.add_page(patched_reader.pages[i] if i+1 in patched_pages else source.pages[i])
for i in range(19):add_original(i)
req_reader=PdfReader(requirements_part);first=req_reader.pages[0]
base=PdfReader(TMP/'rf30.pdf').pages[0];base.merge_page(first);writer.add_page(base)
for pg in req_reader.pages[1:]:writer.add_page(pg)
writer.append(PdfReader(TMP/'actores.pdf'))
add_original(20)
matrix_reader=PdfReader(matrices_part);base=PdfReader(TMP/'matriz_original.pdf').pages[0]
base.merge_page(matrix_reader.pages[0]);writer.add_page(base)
for pg in matrix_reader.pages[1:]:writer.add_page(pg)
writer.append(PdfReader(TMP/'cu01.pdf'))
for i in range(22,33):add_original(i)
writer.append(PdfReader(cases_part));writer.append(PdfReader(der));writer.append(PdfReader(rules))
writer.add_metadata({'/Title':'Royal Solutions - POC','/Author':'Equipo Royal Solutions','/Subject':'Plataforma de servicios de oficios y changas'})
poc_out=OUT/'RoyalSolutions_POC_Actualizado.pdf'
with poc_out.open('wb') as f:writer.write(f)
final=PdfReader(poc_out);preserved=[]
for original_no,dest in page_map.items():
 if original_no in patched_pages:continue
 a,b=source.pages[original_no-1],final.pages[dest]
 assert a.extract_text()==b.extract_text(),original_no
 assert a.get_contents().get_data()==b.get_contents().get_data(),original_no
 assert sorted(hashlib.sha256(im.data).hexdigest() for im in a.images)==sorted(hashlib.sha256(im.data).hexdigest() for im in b.images),original_no
 preserved.append(original_no)
assert {1,21}<=set(preserved)
text='\n'.join(pg.extract_text() or '' for pg in final.pages)
assert all(ident('RF',n) in text for n in range(1,39))
assert all(ident('CU',n) in text for n in range(1,34))
assert all(name in text for name in M['ENTITIES'])
for banned in ['Complementos de la POC','Requerimientos adicionales','Casos de uso adicionales','Se conservan la portada','Estos bloques agregan','secciones originales conservadas']:
 assert banned not in text,banned
assert text.index('RF-31')<text.index('15. Casos'), 'RF fuera de sección 14'
# La primera descripción CU-24 debe aparecer después de CU-23 y antes del DER.
assert text.index('CU-24 - Pagar')>text.index('CU-23')
report=dict(output=str(poc_out),der=str(der_out),pages=len(final.pages),der_pages=1,original_pages_unchanged=preserved,original_cover_and_logo_preserved=True,matrices_originales_conservadas=True,requirements_in_section_14=True,traceability_in_section_15_2=True,use_cases_in_section_15_3=True,patches=patches,requirements=38,cases=33,entities=len(M['ENTITIES']),relations=len(M['RELATIONS']))
(TMP/'validacion_documento.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ['patches','original_pages_unchanged']},ensure_ascii=False))
