# Surviral · Salud Respiratoria GRD

Dashboard académico sobre hospitalizaciones por enfermedades respiratorias en Chile. El proyecto separa los datos originales, la investigación, la generación de resultados en Python y su presentación en el sitio.

## Carpetas y responsabilidades

| Carpeta | Responsabilidad |
| --- | --- |
| `datos_grd/` | Datos originales GRD y catálogos. No sobrescribirlos ni publicarlos como recursos del sitio. Los TXT de esta copia son punteros Git LFS. |
| `desarrolloInvestigacion/` | Limpieza, armonización y análisis. `Union_tablas.ipynb` está en desarrollo: se busca limpiar cada dataset y después construir una tabla filtrada común para trabajar. |
| `graficosFrontend/` | Código Python que consumirá la tabla preparada y generará los resultados reales del dashboard: agregados, indicadores y gráficos, con sus metadatos. Actualmente está vacía. |
| `frontend/` | Navegación, pantallas, filtros y presentación. Actualmente funciona con datos simulados; deberá consumir los resultados publicados por `graficosFrontend/` mediante servicios. |
| `DocumentacionProyecto/` | Propuesta, planificación y acuerdos del equipo. Incluye el [plan de desarrollo](DocumentacionProyecto/PLAN_DESARROLLO.md). |

## Flujo previsto

```text
datos_grd/ → desarrolloInvestigacion/ → tabla preparada y filtrada
          → graficosFrontend/ → resultados publicados → frontend/
```

La meta es reemplazar todos los indicadores, gráficos, tablas y descargas simulados por resultados reales provenientes de `graficosFrontend/`. Las opciones de filtros y la cobertura también deberán corresponder a esos resultados. El navegador consumirá archivos preparados; no ejecutará Python.

Primero se acordará la tabla de trabajo y se validará su limpieza. Después se implementarán los generadores reales. Mientras tanto, se puede avanzar en el contrato de resultados, los servicios y los estados independientes de cada panel. Un fallo no debe sustituir datos reales por simulados ni bloquear el resto del sitio.

Para ejecutar el sitio, consultar [frontend/README.md](frontend/README.md).
