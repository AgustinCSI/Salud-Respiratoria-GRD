# Catálogo inicial de gráficos

Todos los valores actuales son ficticios. La representación pertenece al frontend; definiciones clínicas, limpieza y análisis definitivo al equipo de datos.

## Evolución mensual

- Pregunta: ¿cómo cambia el número de eventos respiratorios durante el período seleccionado?
- Variables: mes del egreso y número de eventos.
- Unidad: hospitalizaciones; no pacientes ni incidencia.
- Período: rango inclusivo aplicado, agrupación mensual, meses parciales identificados.
- Filtros: fechas, región, edad, sexo y grupo diagnóstico.
- Lectura: una diferencia entre puntos describe la distribución de los eventos seleccionados. En la simulación no es evidencia de estacionalidad real.
- Ausentes: cero si el mes tiene cobertura y no hay eventos; nulo/unavailable si no hay cobertura. No conectar vacíos.
- Acceso: teclado en el gráfico, tabla de valores y CSV rotulado como simulado.

## Ranking diagnóstico

- Pregunta: ¿qué grupos diagnósticos concentran los eventos seleccionados?
- Variables: grupo principal excluyente y número de eventos; porcentaje del total respiratorio seleccionado.
- Unidad: eventos y porcentaje. No tasa poblacional.
- Período y filtros: los mismos que la serie y tarjetas.
- Lectura: compara frecuencias de esta selección; no prevalencias poblacionales.
- Ausentes: grupo no especificado explícito; categorías con cero se conservan. Todos los grupos se muestran, sin un top que oculte el resto.
- Reconciliación: suma de barras = tarjeta de hospitalizaciones = suma mensual.

## Indicadores

Hospitalizaciones: número de eventos. Proporción: eventos respiratorios seleccionados / egresos del universo × 100. Estancia: mediana de estancias válidas, incluyendo cero días y excluyendo ausentes con recuento explícito. Las tres tarjetas comparten selección; diagnóstico no filtra el denominador de egresos. Sin eventos, el conteo es cero y la mediana no se calcula.

## Pendientes de ampliación

Mapa interactivo de Chile (geometría y semántica por validar), barras territoriales y tabla; mapa de calor región × mes; comparación temporal entre años; demografía y cruces pertinentes. Ambiente y vacunas permanecen sin gráficos hasta validar fuentes compatibles. No se muestran tasas poblacionales ni mortalidad sin definiciones y datos adecuados.
