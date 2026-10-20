import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize, validateFilters } from '../src/mocks/aggregate.ts';
import { events, filterOptions, type SimulatedEvent } from '../src/mocks/data.ts';
import { defaultFilters } from '../src/app/defaults.ts';
import { mockService } from '../src/services/mockService.ts';

test('Las particiones reconcilian con el indicador en los seis años y dieciséis regiones', () => {
  for (const year of filterOptions.years) for (const region of ['all', ...filterOptions.regions.map(r => r.id)]) {
    const data = summarize({ ...defaultFilters, startDate: `${year}-01-01`, endDate: `${year}-12-31`, region });
    const total = data.indicators.hospitalizations.value;
    for (const values of [data.monthly, data.diagnoses, data.territories, data.demographics.age, data.demographics.sex]) {
      assert.equal(values.reduce((sum, point) => sum + (point.value ?? 0), 0), total);
    }
    assert.ok(data.meta.respiratoryTotal <= data.meta.universeTotal);
    assert.equal(data.indicators.proportion.value, 100 * data.meta.respiratoryTotal / data.meta.universeTotal);
  }
});

test('Los filtros personales y diagnósticos producen una selección consistente', () => {
  const all = summarize(defaultFilters);
  for (const age of ['under18', '18to64', '65plus', 'unknown'] as const) {
    const data = summarize({ ...defaultFilters, age });
    assert.ok(data.meta.respiratoryTotal < all.meta.respiratoryTotal);
    assert.equal(data.demographics.age.find(x => x.id === age)?.value, data.meta.respiratoryTotal);
  }
  for (const sex of ['female', 'male', 'unknown'] as const) {
    const data = summarize({ ...defaultFilters, sex });
    assert.equal(data.demographics.sex.find(x => x.id === sex)?.value, data.meta.respiratoryTotal);
  }
  for (const diagnosis of filterOptions.diagnoses) {
    const data = summarize({ ...defaultFilters, diagnosis: diagnosis.id });
    assert.equal(data.meta.universeTotal, all.meta.universeTotal);
    assert.equal(data.meta.respiratoryTotal, all.diagnoses.find(x => x.id === diagnosis.id)?.value);
  }
});

test('El rango inclusivo se respeta y se identifican meses parciales', () => {
  const filters = { ...defaultFilters, startDate: '2024-02-10', endDate: '2024-03-15' };
  const data = summarize(filters);
  const expected = events.filter(e => e.respiratory && e.dischargeDate >= filters.startDate && e.dischargeDate <= filters.endDate);
  assert.equal(data.meta.respiratoryTotal, expected.length);
  assert.deepEqual(data.monthly.map(p => [p.period, p.partial]), [['2024-02', true], ['2024-03', true]]);
});

test('Conteo cero no se confunde con mediana o proporción no calculables', () => {
  const data = summarize({ ...defaultFilters, startDate: '2024-01-01', endDate: '2024-01-01' });
  assert.equal(data.status, 'empty');
  assert.equal(data.indicators.hospitalizations.value, 0);
  assert.equal(data.indicators.hospitalizations.status, 'available');
  assert.equal(data.monthly[0].value, 0);
  assert.equal(data.indicators.proportion.value, null);
  assert.equal(data.indicators.proportion.reason, 'zero_denominator');
  assert.equal(data.indicators.medianStay.value, null);
});

test('Una mediana usa eventos originales y conserva estancias de cero días', () => {
  const base: SimulatedEvent = { id: 'a', dischargeDate: '2024-02-15', region: '13', age: null, sex: 'unknown', respiratory: true, diagnosis: 'asthma', stayDays: 0 };
  const source = [base, { ...base, id: 'b', stayDays: 8 }, { ...base, id: 'c', stayDays: null }];
  const data = summarize(defaultFilters, source);
  assert.equal(data.indicators.medianStay.value, 4);
  assert.equal(data.indicators.medianStay.validCount, 2);
  assert.equal(data.meta.missingStay, 1);
  assert.equal(data.meta.unknownAge, 3);
  assert.equal(data.meta.unknownSex, 3);
  const missing = summarize(defaultFilters, [{ ...base, stayDays: null }]);
  assert.equal(missing.indicators.medianStay.reason, 'missing_values');
  const noRespiratory = summarize(defaultFilters, [{ ...base, respiratory: false }]);
  assert.equal(noRespiratory.indicators.proportion.value, 0);
});

test('La simulación es determinista y no modifica la fuente ni los filtros', () => {
  const snapshot = JSON.stringify(events);
  const filters = { ...defaultFilters };
  assert.deepEqual(summarize(filters), summarize(filters));
  assert.equal(JSON.stringify(events), snapshot);
  assert.deepEqual(filters, defaultFilters);
  assert.equal(new Set(events.map(e => e.id)).size, events.length);
});

test('Se rechazan fechas inválidas y opciones que la cobertura no soporta', () => {
  for (const startDate of ['2024-02-30', '2025-01-01', '2024-12-32', '2018-01-01', '']) assert.throws(() => validateFilters({ ...defaultFilters, startDate }));
  assert.throws(() => validateFilters({ ...defaultFilters, startDate: '2024-12-20', endDate: '2024-01-01' }));
  assert.throws(() => validateFilters({ ...defaultFilters, region: 'fake' }));
  assert.throws(() => validateFilters({ ...defaultFilters, diagnosis: 'not-supported' }));
  assert.doesNotThrow(() => validateFilters({ ...defaultFilters, startDate: '2024-02-29' }));
});

test('El servicio permite cancelar consultas y propaga errores de validación', async () => {
  const controller = new AbortController();
  const pending = mockService.getOverview(defaultFilters, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  await assert.rejects(mockService.getOverview({ ...defaultFilters, region: 'fake' }), /Territorio no disponible/);
});
