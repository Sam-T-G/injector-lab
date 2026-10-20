/// <reference lib="webworker" />
import { evaluatePoint, search, SCENARIOS, type DesignInputs, type DesignPoint } from './physics'
import { evaluate05 } from './physics/v05/evaluate'
import type { Inputs05 } from './physics/v05/types'

export type WorkerRequest =
  | { id: number; kind: 'search'; inputs: DesignInputs }
  | { id: number; kind: 'point'; inputs: DesignInputs; point: DesignPoint }
  | { id: number; kind: 'v05'; inputs: Inputs05 }

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data
  try {
    if (req.kind === 'search') {
      let last = 0
      const result = search(req.inputs, {
        onProgress: (done, total) => {
          const now = performance.now()
          if (now - last > 60 || done === total) {
            last = now
            ctx.postMessage({ id: req.id, kind: 'progress', done, total })
          }
        },
      })
      ctx.postMessage({ id: req.id, kind: 'search', result })
    } else if (req.kind === 'point') {
      ctx.postMessage({ id: req.id, kind: 'point', result: evaluatePoint(req.inputs, req.point, SCENARIOS, 121) })
    } else {
      const result = evaluate05(req.inputs)
      const transfer = result.fields.flatMap((f) => [f.ox.buffer, f.fuel.buffer])
      ctx.postMessage({ id: req.id, kind: 'v05', result }, transfer)
    }
  } catch (err) {
    ctx.postMessage({ id: req.id, kind: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
