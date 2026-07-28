import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeNdjsonStream } from '../src/api/streaming.js'

function bodyFromChunks(chunks) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

test('parses events split across arbitrary network chunks', async () => {
  const events = []
  const body = bodyFromChunks([
    '{"type":"aiMessageDel',
    'ta","delta":"hel"}\n{"type":"aiMessageDelta",',
    '"delta":"lo"}\n',
    '{"type":"aiMessageCompleted"}',
  ])

  await consumeNdjsonStream(body, (event) => events.push(event))

  assert.deepEqual(events, [
    { type: 'aiMessageDelta', delta: 'hel' },
    { type: 'aiMessageDelta', delta: 'lo' },
    { type: 'aiMessageCompleted' },
  ])
})

test('preserves multibyte text split between chunks', async () => {
  const encoded = new TextEncoder().encode(
    '{"type":"aiMessageDelta","delta":"You’re okay 🙂"}\n'
  )
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(encoded.slice(0, encoded.length - 3))
      controller.enqueue(encoded.slice(encoded.length - 3))
      controller.close()
    },
  })
  const events = []

  await consumeNdjsonStream(body, (event) => events.push(event))

  assert.equal(events[0].delta, 'You’re okay 🙂')
})
