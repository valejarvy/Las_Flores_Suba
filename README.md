# Barrio Las Flores · Suba — SIG Web

Aplicación web de tres capas sobre el barrio Las Flores (Localidad 11 de Suba, Bogotá D.C.).

## Estructura

- `frontend/` — interfaz web (HTML, CSS, JavaScript + Leaflet).
- `backend/` — lógica de negocio y consultas a fuentes oficiales (IDECA, Alcaldía de Bogotá, SIMUR, OSM).
- `api/` — servidor Express que expone los endpoints REST y sirve el frontend.

## Ejecución

```powershell
cd api
npm install
npm start
```

Abrir <http://localhost:3000>.

## Fuentes de datos utilizadas

- Polígono oficial de estudio: IDECA, Unidad de Planeamiento Zonal (UPZ 28 El Rincón), que incluye Las Flores, El Poa y Centro Suba. El núcleo del barrio Las Flores se conserva en `backend/data/lasflores_nucleo.geojson`.
- Localidad: IDECA, capa `localidad`.
- Colegios y bibliotecas: IDECA, `infraestructuraeducativa`.
- Parques y escenarios: IDECA, `parquesyescenarios`.
- Transporte público: IDECA, `transportepublico`.
- CAI y estaciones de policía: Secretaría Distrital de Seguridad.
- Cámaras: SIMUR / Secretaría Distrital de Movilidad.
- Gastronomía: Instituto Distrital de Turismo.
- Delito de alto impacto: Secretaría Distrital de Seguridad, Convivencia y Justicia.
- Catastro: IDECA, sector catastral.

Cuando una fuente oficial no contiene registros georreferenciados dentro del polígono (por ejemplo, veterinarias o estado superficial de calles), la aplicación lo indica explícitamente y no muestra datos inventados.
