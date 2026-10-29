import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logisticPreview, sigmoid, fitBinary, quantile75 } from '../src/mocks/logistic.ts';
import { classificationMetrics } from '../src/utils/classification.ts';
import { events } from '../src/mocks/data.ts';
import { defaultFilters } from '../src/app/defaults.ts';

test('Ajuste logístico devuelve probabilidades reproducibles y evalúa meses posteriores',()=>{
  const result=logisticPreview(defaultFilters);
  assert.equal(result.status,'ready');if(result.status!=='ready')return;
  assert.equal(result.trainStart,'2020-01');assert.equal(result.trainEnd,'2023-12');
  assert.equal(result.testStart,'2024-01');assert.equal(result.testEnd,'2024-12');
  assert.equal(result.trainSize,48);assert.equal(result.next.period,'2025-01');
  assert.deepEqual(result,logisticPreview(defaultFilters));
  for(const p of [...result.test,result.next]) assert.ok(p.probability>0&&p.probability<1);
  for(const p of result.test)assert.equal(p.observed,Number(p.count>result.countThreshold));
  assert.equal(result.brier,result.test.reduce((s,p)=>s+(p.probability-p.observed)**2,0)/12);
  const metrics=classificationMetrics(result.test,.5);assert.equal(metrics.tp+metrics.fp+metrics.tn+metrics.fn,12);
});
test('Cambiar meses de evaluación no altera umbral, coeficientes ni probabilidad de su primer mes',()=>{
  const base=logisticPreview(defaultFilters);
  const changed=logisticPreview(defaultFilters,events.filter(e=>!e.dischargeDate.startsWith('2024')));
  assert.equal(base.status,'ready');assert.equal(changed.status,'ready');
  if(base.status!=='ready'||changed.status!=='ready')return;
  assert.equal(changed.countThreshold,base.countThreshold);assert.deepEqual(changed.coefficients,base.coefficients);
  assert.equal(changed.test[0].probability,base.test[0].probability);
  assert.notEqual(changed.brier,base.brier);
});
test('No se incluyen datos posteriores al corte ni meses finales incompletos',()=>{
  const filters={...defaultFilters,startDate:'2023-01-01',endDate:'2023-12-31'};
  const base=logisticPreview(filters), truncated=logisticPreview(filters,events.filter(e=>e.dischargeDate<='2023-12-31'));
  assert.deepEqual(base,truncated);
  const partial=logisticPreview({...defaultFilters,endDate:'2024-12-15'});
  assert.equal(partial.cutoff,'2024-11-30');assert.equal(partial.omittedPartialMonth,true);
  if(partial.status==='ready')assert.equal(partial.next.period,'2024-12');
});
test('Filtros cambian población, historia inicial es explícita y muestras insuficientes no producen resultados',()=>{
  const all=logisticPreview(defaultFilters), selected=logisticPreview({...defaultFilters,diagnosis:'asthma'});
  if(all.status==='ready'&&selected.status==='ready')assert.notEqual(all.countThreshold,selected.countThreshold);
  const differentStart=logisticPreview({...defaultFilters,startDate:'2020-01-01'});
  if(all.status==='ready'&&differentStart.status==='ready'){assert.equal(all.next.probability,differentStart.next.probability);assert.deepEqual(all.coefficients,differentStart.coefficients);}
  assert.equal(logisticPreview({...defaultFilters,startDate:'2019-01-01',endDate:'2021-12-31'}).status,'unavailable');
  assert.equal(logisticPreview(defaultFilters,[]).status,'unavailable');
});
test('Métricas distinguen denominador cero; bajar corte no reduce sensibilidad',()=>{
  const points=[{probability:.8,observed:1 as const},{probability:.4,observed:1 as const},{probability:.6,observed:0 as const},{probability:.1,observed:0 as const}];
  assert.deepEqual(classificationMetrics(points,.5),{tp:1,tn:1,fp:1,fn:1,accuracy:.5,precision:.5,recall:.5});
  assert.ok(classificationMetrics(points,.3).recall!>=classificationMetrics(points,.5).recall!);
  assert.equal(classificationMetrics([{probability:.2,observed:0}],.5).precision,null);
  assert.equal(classificationMetrics([{probability:.2,observed:0}],.5).recall,null);
});
test('La penalización permite ajuste finito de una muestra separable sin coeficientes inventados',()=>{
  const fit=fitBinary([[1,0],[1,0],[1,1],[1,1]],[0,0,1,1]);
  assert.ok(fit.converged);assert.ok(fit.weights.every(Number.isFinite));
  assert.ok(sigmoid(fit.weights[0])<.5);assert.ok(sigmoid(fit.weights[0]+fit.weights[1])>.5);
  assert.equal(quantile75([0,10,20,30]),22.5);
});
