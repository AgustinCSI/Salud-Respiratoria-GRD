import { summarize, validateFilters } from './aggregate.ts';
import { events, type SimulatedEvent } from './data.ts';
import type { Filters } from '../types/dashboard.ts';
import type { LogisticPoint, LogisticPreview } from '../types/logistic.ts';

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-35, Math.min(35, z))));
const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);
export function quantile75(values: number[]): number {
  const sorted = [...values].sort((a,b)=>a-b), index = (sorted.length-1)*.75;
  return sorted[Math.floor(index)] + (index%1)*(sorted[Math.ceil(index)]-sorted[Math.floor(index)]);
}
// Local demonstrator only: penalized mean log-loss, deterministic gradient descent.
// The production model must be trained and validated separately by the data team.
export function fitBinary(x: number[][], y: number[]): {weights:number[]; converged:boolean} {
  const weights = x[0].map(()=>0);
  for (let iteration=0;iteration<8000;iteration++) {
    const gradient=weights.map(()=>0);
    x.forEach((row,i)=>{const error=sigmoid(dot(weights,row))-y[i];row.forEach((v,j)=>{gradient[j]+=error*v/x.length;});});
    for(let j=1;j<weights.length;j++) gradient[j]+=.05*weights[j];
    if (Math.max(...gradient.map(Math.abs))<1e-6) return {weights,converged:true};
    gradient.forEach((g,j)=>{weights[j]-=.4*g;});
  }
  return {weights,converged:false};
}
const featureLabels=['Intercepto','Trimestre 2 (vs. T1)','Trimestre 3 (vs. T1)','Trimestre 4 (vs. T1)','Mes anterior elevado','Mismo mes del año anterior elevado'];
function features(period:string, previous:number, seasonal:number, threshold:number) {
  const quarter=Math.ceil(Number(period.slice(5))/3);
  const previousHigh=previous>threshold?1:0, seasonalHigh=seasonal>threshold?1:0;
  return { quarter, previousHigh, seasonalHigh, x:[1,Number(quarter===2),Number(quarter===3),Number(quarter===4),previousHigh,seasonalHigh] } as const;
}
function nextMonth(period:string):string {
  const date=new Date(`${period}-01T00:00:00Z`);date.setUTCMonth(date.getUTCMonth()+1);return date.toISOString().slice(0,7);
}
export function logisticPreview(filters:Filters, source:readonly SimulatedEvent[]=events):LogisticPreview {
  validateFilters(filters);
  const end=new Date(`${filters.endDate}T00:00:00Z`);
  const monthEnd=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).toISOString().slice(0,10);
  const partial=filters.endDate!==monthEnd;
  if(partial) end.setUTCDate(0);
  const cutoff=end.toISOString().slice(0,10);
  const base={mode:'simulated' as const,filters:{...filters},cutoff,omittedPartialMonth:partial};
  const unavailable=(reason:string):LogisticPreview=>({...base,status:'unavailable',reason});
  if(cutoff<'2019-01-01')return unavailable('No hay meses completos anteriores a la fecha de corte.');
  // Deliberately use full pre-cutoff history; the chart's start date is not training truncation.
  const monthly=summarize({...filters,startDate:'2019-01-01',endDate:cutoff},source).monthly;
  if(monthly.length<48)return unavailable('Se necesitan al menos 48 meses completos: 12 para rezagos, 24 para entrenamiento y 12 para evaluación. Amplía la fecha final a diciembre de 2022 o después.');
  const split=monthly.length-12;
  const counts=monthly.map(p=>p.value!);
  const threshold=quantile75(counts.slice(0,split));
  const train=monthly.slice(12,split).map((p,j)=>({f:features(p.period,counts[j+11],counts[j],threshold),y:Number(counts[j+12]>threshold)}));
  const positives=train.reduce((sum,r)=>sum+r.y,0);
  if(positives<5 || train.length-positives<5)return unavailable('La selección tiene menos de cinco meses de alguna clase en entrenamiento. Amplía territorio, edad, sexo o diagnóstico. No se calcula una probabilidad con esta selección.');
  const model=fitBinary(train.map(r=>[...r.f.x]),train.map(r=>r.y));
  if(!model.converged)return unavailable('El ajuste de demostración no convergió. No se muestran probabilidades de este ajuste.');
  const prediction=(i:number,period:string)=>{const f=features(period,counts[i-1],counts[i-12],threshold);return {period,quarter:f.quarter,previousHigh:f.previousHigh,seasonalHigh:f.seasonalHigh,probability:sigmoid(dot(model.weights,[...f.x]))};};
  // Frozen coefficients and training threshold. Each held-out month only sees preceding counts.
  const test:LogisticPoint[]=monthly.slice(split).map((p,j)=>({...prediction(split+j,p.period),count:counts[split+j],observed:counts[split+j]>threshold?1:0}));
  const baseline=positives/train.length;
  const brier=test.reduce((sum,p)=>sum+(p.probability-p.observed)**2,0)/test.length;
  const baselineBrier=test.reduce((sum,p)=>sum+(baseline-p.observed)**2,0)/test.length;
  return {...base,status:'ready',countThreshold:threshold,trainStart:monthly[12].period,trainEnd:monthly[split-1].period,trainSize:train.length,trainPositive:positives,testStart:test[0].period,testEnd:test.at(-1)!.period,test,baselineProbability:baseline,brier,baselineBrier,next:prediction(counts.length,nextMonth(monthly.at(-1)!.period)),coefficients:featureLabels.map((label,i)=>({label,value:model.weights[i]}))};
}

