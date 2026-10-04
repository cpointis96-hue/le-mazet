const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/lib/supabase/queries.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, console: { error() {} } });

function client(result) {
    const calls = [];
    const query = { then(resolve) { return Promise.resolve(result).then(resolve); } };
    for (const method of ['select', 'eq', 'order', 'insert', 'delete']) {
        query[method] = (...args) => { calls.push([method, ...args]); return query; };
    }
    return { calls, from(table) { calls.push(['from', table]); return query; } };
}

test('reads reactions for the requested event and maps database fields', async () => {
    const db = client({ data: [{ id: 'r', event_id: 'e', user_id: 'u', emoji: '👍', created_at: 'date' }], error: null });
    const result = await exportsObject.getEventReactions(db, 'e');
    assert.deepEqual(JSON.parse(JSON.stringify(result)), [{ id: 'r', eventId: 'e', userId: 'u', emoji: '👍', createdAt: 'date' }]);
    assert.deepEqual(JSON.parse(JSON.stringify(db.calls)), [['from', 'event_reactions'], ['select', '*'], ['eq', 'event_id', 'e'], ['order', 'created_at', { ascending: true }]]);
});

test('inserts the event, user and emoji required by the schema', async () => {
    const db = client({ error: null });
    assert.equal(await exportsObject.addEventReaction(db, 'e', 'u', '👍'), true);
    assert.deepEqual(JSON.parse(JSON.stringify(db.calls)), [['from', 'event_reactions'], ['insert', { event_id: 'e', user_id: 'u', emoji: '👍' }]]);
});

test('deletes only the matching event, user and emoji', async () => {
    const db = client({ error: null, count: 1 });
    assert.equal(await exportsObject.deleteEventReaction(db, 'e', 'u', '👍'), true);
    assert.deepEqual(JSON.parse(JSON.stringify(db.calls)), [['from', 'event_reactions'], ['delete', { count: 'exact' }], ['eq', 'event_id', 'e'], ['eq', 'user_id', 'u'], ['eq', 'emoji', '👍']]);
    assert.equal(await exportsObject.deleteEventReaction(client({ error: null, count: 0 }), 'e', 'u', '👍'), false);
});

test('returns the existing hook failure contracts for query errors and empty reads', async () => {
    const db = client({ error: { message: 'denied' }, data: null });
    assert.equal((await exportsObject.getEventReactions(db, 'e')).length, 0);
    assert.equal(await exportsObject.addEventReaction(db, 'e', 'u', '👍'), false);
    assert.equal(await exportsObject.deleteEventReaction(db, 'e', 'u', '👍'), false);
    assert.equal((await exportsObject.getEventReactions(client({ data: null, error: null }), 'e')).length, 0);
});
