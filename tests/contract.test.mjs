import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = process.env.API_BASE ?? 'http://api:8080';
const seed = JSON.parse(await readFile('/data/seed.json', 'utf8'));
const expectedSummary = {
  npsScore: 24, npsResponses: 978,
  promoters: { count: 477, pct: 48.8 },
  neutrals: { count: 256, pct: 26.2 },
  detractors: { count: 245, pct: 25.1 },
  responsesCount: 1246, csatAvg: 3.91,
};

async function request(path, status = 200, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  assert.equal(response.status, status, `${options.method ?? 'GET'} ${path}`);
  if (status === 204) {
    assert.equal(await response.text(), '');
    return { response, body: null };
  }
  if (status === 404) return { response, body: null };
  return { response, body: await response.json() };
}
const write = (method, body) => ({
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

async function waitForApi() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch { /* A API ainda pode estar importando o seed. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('A API não ficou disponível em 60 segundos.');
}

// Os cenários compartilham um banco descartável e executam em ordem.
test('Contrato obrigatório com PostgreSQL e seed reais', async t => {
  await waitForApi();
  await t.test('resumo bate exatamente com a tabela de conferência', async () => {
    assert.deepEqual((await request('/api/analytics/summary')).body, expectedSummary);
  });

  await t.test('listagem paginada e busca parcial sem diferenciar maiúsculas', async () => {
    const first = (await request('/api/contacts')).body;
    assert.equal(first.total, seed.contacts.length);
    assert.equal(first.page, 1);
    assert.equal(first.pageSize, 20);
    assert.equal(first.items.length, 20);
    const second = (await request('/api/contacts?page=2')).body;
    assert.equal(second.items.length, 20);
    assert.equal(second.items.some(item => first.items.some(other => other.id === item.id)), false);
    for (const search of [seed.contacts[0].name.slice(0, 3), seed.contacts[0].email.slice(0, 8)]) {
      const expected = seed.contacts.filter(c => [c.name, c.email].some(value => value.toLowerCase().includes(search.toLowerCase())));
      const result = (await request(`/api/contacts?search=${encodeURIComponent(search.toUpperCase())}&pageSize=100`)).body;
      assert.equal(result.total, expected.length);
      assert.deepEqual(result.items.map(c => c.id), expected.map(c => c.id).sort((a, b) => a - b));
    }
    assert.equal((await request('/api/contacts?search=%25')).body.total, 0);
    assert.equal((await request('/api/contacts?search=%27%20OR%201%3D1%20--')).body.total, 0);
    const beyond = (await request('/api/contacts?page=100000')).body;
    assert.deepEqual(beyond.items, []);
    assert.equal(beyond.total, seed.contacts.length);
    for (const query of ['page=0', 'page=abc', 'pageSize=0', 'pageSize=101', 'page=1&page=2']) {
      assert.equal(typeof (await request(`/api/contacts?${query}`, 400)).body.error, 'string');
    }
  });

  await t.test('históricos usam JOIN, preservam campos e omitem respostas excluídas', async () => {
    for (const contact of seed.contacts) {
      assert.deepEqual((await request(`/api/contacts/${contact.id}`)).body, contact);
      const actual = (await request(`/api/contacts/${contact.id}/responses`)).body;
      const expected = seed.responses.filter(r => r.contactId === contact.id && r.deletedAt === null)
        .sort((a, b) => Date.parse(b.respondedAt) - Date.parse(a.respondedAt) || b.id - a.id)
        .map(r => {
          const survey = seed.surveys.find(s => s.id === r.surveyId);
          return { id: r.id, surveyId: r.surveyId, surveyName: survey.name, surveyType: survey.type,
            score: r.score, comment: r.comment, channel: r.channel, respondedAt: new Date(r.respondedAt).toISOString() };
        });
      assert.equal(actual.every(r => r.respondedAt.endsWith('Z')), true);
      assert.deepEqual(actual.map(r => ({ ...r, respondedAt: new Date(r.respondedAt).toISOString() })), expected);
    }
    await request('/api/contacts/2147483647', 404);
    await request('/api/contacts/2147483647/responses', 404);
  });

  await t.test('validação, CRUD, duplicidade e e-mail liberado após soft delete', async () => {
    for (const body of [{}, { name: ' ', email: 'valid@example.com' }, { name: 'Aluno', email: 'inválido' }]) {
      assert.equal(typeof (await request('/api/contacts', 400, write('POST', body))).body.error, 'string');
    }
    assert.equal(typeof (await request('/api/contacts', 400, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    })).body.error, 'string');
    const input = { name: 'Aluno teste', email: 'contract-check@example.com', segment: null };
    const created = await request('/api/contacts', 201, write('POST', input));
    const id = created.body.id;
    assert.equal(created.response.headers.get('location'), `/api/contacts/${id}`);
    assert.deepEqual(created.body, { id, ...input });
    assert.deepEqual((await request(`/api/contacts/${id}/responses`)).body, []);
    assert.equal(typeof (await request('/api/contacts', 409, write('POST', { ...input, email: input.email.toUpperCase() }))).body.error, 'string');
    const edited = { ...input, name: 'Aluno editado', segment: 'Texto livre' };
    assert.deepEqual((await request(`/api/contacts/${id}`, 200, write('PUT', edited))).body, { id, ...edited });
    await request(`/api/contacts/${id}`, 409, write('PUT', { ...edited, email: seed.contacts[0].email.toUpperCase() }));
    await request(`/api/contacts/${id}`, 400, write('PUT', { ...edited, name: '' }));
    await request('/api/contacts/2147483647', 404, write('PUT', edited));
    await request(`/api/contacts/${id}`, 204, { method: 'DELETE' });
    await request(`/api/contacts/${id}`, 404);
    await request(`/api/contacts/${id}/responses`, 404);
    await request(`/api/contacts/${id}`, 404, { method: 'DELETE' });
    await request(`/api/contacts/${id}`, 404, write('PUT', edited));
    assert.equal((await request(`/api/contacts?search=${input.email}`)).body.total, 0);
    const reused = (await request('/api/contacts', 201, write('POST', input))).body;
    assert.notEqual(reused.id, id);
    await request(`/api/contacts/${reused.id}`, 204, { method: 'DELETE' });
  });

  await t.test('contatos excluídos saem dos indicadores e resumo vazio é seguro', async () => {
    for (const contact of seed.contacts) await request(`/api/contacts/${contact.id}`, 204, { method: 'DELETE' });
    assert.deepEqual((await request('/api/analytics/summary')).body, {
      npsScore: 0, npsResponses: 0, promoters: { count: 0, pct: 0 },
      neutrals: { count: 0, pct: 0 }, detractors: { count: 0, pct: 0 },
      responsesCount: 0, csatAvg: null,
    });
    const contacts = (await request('/api/contacts')).body;
    assert.equal(contacts.total, 0);
    assert.deepEqual(contacts.items, []);
  });
});
