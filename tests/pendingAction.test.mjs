import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPendingAction } from '../lib/pendingAction.ts'

test('uma ação pendente bloqueia outro disparo e libera após sucesso', async () => {
  const run = createPendingAction()
  let finish
  let calls = 0
  const first = run(() => { calls++; return new Promise(resolve => { finish = resolve }) })
  assert.equal(await run(() => { calls++ }), false)
  assert.equal(calls, 1)
  finish()
  assert.equal(await first, true)
  assert.equal(await run(() => { calls++ }), true)
  assert.equal(calls, 2)
})

test('uma ação que falha libera o próximo disparo', async () => {
  const run = createPendingAction()
  await assert.rejects(run(() => Promise.reject(new Error('falha'))))
  assert.equal(await run(() => undefined), true)
})
