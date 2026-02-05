import assert from 'node:assert/strict'
import test from 'node:test'
import { createDefaultState } from '../shared/timer'
import { deriveTimerPhase, getBadgePresentation, getPhaseLabelKey } from '../shared/timer-phase'

test('deriveTimerPhase maps status/mode to phase', () => {
  const base = createDefaultState()
  assert.equal(deriveTimerPhase({ ...base, status: 'running', mode: 'work' }), 'focusing')
  assert.equal(deriveTimerPhase({ ...base, status: 'running', mode: 'break' }), 'rest')
  assert.equal(deriveTimerPhase({ ...base, status: 'paused', mode: 'work' }), 'paused')
  assert.equal(deriveTimerPhase({ ...base, status: 'idle', mode: 'break' }), 'focus_over')
  assert.equal(deriveTimerPhase({ ...base, status: 'idle', mode: 'work' }), 'rest_over')
})

test('badge presentation uses 3-char text', () => {
  const presentation = getBadgePresentation('rest_over')
  assert.equal(presentation.text.length, 3)
  assert.equal(presentation.text, 'RDY')
})

test('phase label uses translation key', () => {
  assert.equal(getPhaseLabelKey('focus_over'), 'phase_focus_over')
})
