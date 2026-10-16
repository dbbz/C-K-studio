// Whether a turn is running or waiting: set when a prompt is submitted and when the
// main loop's turn starts, cleared when that turn completes (register.tsx). The pane
// reads it so a press made mid-turn can say it is queued. Plain module state, so a hot
// reload starts it false; the next turn's start or end puts it right.
let isRunning = false

export function isBusy(): boolean {
  return isRunning
}

export function markBusy(): void {
  isRunning = true
}

export function markIdle(): void {
  isRunning = false
}

/**
 * Runs `send`, which submits a prompt, with a turn counted as running from the moment
 * it is sent. A prompt that did not enter (dropped, or the call failed) leaves the
 * flag as it was. The prompt.submit hook covers every prompt the engine raises; a
 * plugin's own `$.prompt.submit` (the pane's presses) does not pass through the
 * plugin's own hooks, so the pane wraps it here itself.
 */
export async function trackSubmit<T extends { drop?: string }>(send: () => Promise<T>): Promise<T> {
  const wasBusy = isRunning
  isRunning = true
  try {
    const sent = await send()
    if (sent.drop !== undefined && !wasBusy) isRunning = false
    return sent
  } catch (err) {
    if (!wasBusy) isRunning = false
    throw err
  }
}
