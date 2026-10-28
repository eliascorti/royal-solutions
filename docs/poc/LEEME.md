# Documento conservado y DER completo

Se utiliza como fuente el PDF de 35 páginas entregado por el equipo. No se reconstruyen su portada, logo, lema ni matrices de trazabilidad.

- POC: `output/pdf/RoyalSolutions_POC_Actualizado.pdf` (42 páginas).
- DER separado: `output/pdf/RoyalSolutions_DER_Actualizado.pdf` (una sola lámina A1 vectorial).
- Fuente de los complementos: `especificacion.py` (solo RF-31..38 y CU-24..33).
- Modelo: `modelo.py` (25 entidades y 40 relaciones; una sola vista completa).
- Fuentes gráficas: `der/completo.dot` y `DER.mmd`.

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

Python también requiere reportlab y pypdf. El script copia las páginas 1-33 del original y corrige puntualmente cuatro páginas: almacenamiento local de documentos, medio Mercado Pago, avisos locales y agenda diaria. Las demás 29 páginas se comprueban por texto, streams gráficos e imágenes idénticos. Esto incluye portada, logo y matrices originales de las páginas 21 y 22.

Los requerimientos y casos adicionales se agregan como complementos; mantienen la numeración previa y usan extensiones con X de la matriz. La sección 16 antigua se sustituye por un solo DER completo y una página de reglas. La fuente no se sobrescribe.

El informe de validación se guarda en `tmp/pdfs/validacion_documento.json`. Los PDF, dependencias temporales y capturas están ignorados en Git; se versionan las fuentes. La lámina grande permite ampliar el diagrama conservando nitidez.
