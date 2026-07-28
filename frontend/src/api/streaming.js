export async function consumeNdjsonStream(body, onEvent) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const processLines = (lines) => {
    lines.filter(Boolean).forEach((line) => onEvent(JSON.parse(line)))
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    processLines(lines)
    if (done) break
  }

  if (buffer.trim()) processLines([buffer])
}
