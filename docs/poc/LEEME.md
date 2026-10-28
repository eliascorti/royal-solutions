# Documento POC y DER

El POC mantiene la portada, el logo, el lema y el diseño del PDF entregado. Los 38 requerimientos se encuentran en la sección 14.2, las matrices con X en 15.2 y los 33 casos de uso en 15.3. No contiene un apartado de complementos ni un historial de cambios.

- `output/pdf/RoyalSolutions_POC_Actualizado.pdf`: 42 páginas.
- `output/pdf/RoyalSolutions_DER_Actualizado.pdf`: una lámina A1 vectorial.
- `especificacion.py`: contenido de RF-31..38 y CU-24..33.
- `modelo.py`: 25 entidades y 40 relaciones.
- `der/completo.dot` y `DER.mmd`: modelo gráfico.

## Regenerar

Desde la raíz, con Python, Node y Edge:

```powershell
npm install
npm install --prefix tmp/der-tools @viz-js/viz@3.31.0 --no-audit --no-fund
python -m pip install --target tmp/pdf-tools pymupdf
python scripts/preparar_der.py
node scripts/render_der.cjs
python scripts/generar_documento_poc.py --source "C:/ruta/al/PDF_original.pdf"
```

Python requiere también reportlab y pypdf. El generador conserva las páginas sin cambios, inserta el contenido dentro de cada sección y aplica correcciones puntuales sobre el texto existente. La portada y las matrices originales mantienen su diseño. El original no se sobrescribe.

El informe `tmp/pdfs/validacion_documento.json` comprueba preservación, referencias, ubicación de las secciones y ausencia de títulos editoriales de complementos. Los PDF y capturas se mantienen como entregables locales; se versionan sus fuentes.
