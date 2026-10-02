import { useEffect, useReducer, useRef, useState } from 'react'
import { LEVELS, newGame, openCell, toggleFlag } from './game.js'

function reducer(state, action) {
  switch (action.type) {
    case 'reset': return newGame(action.level ?? state.level)
    case 'open': return openCell(state, action.i)
    case 'flag': return toggleFlag(state, action.i)
    default: return state
  }
}

const pad = (n) => String(Math.max(0, Math.min(999, n))).padStart(3, '0')

function Cell({ cell, exploded, dispatch, i }) {
  const timer = useRef(null)
  const longPressed = useRef(false)

  const startPress = () => {
    longPressed.current = false
    timer.current = setTimeout(() => {
      longPressed.current = true
      dispatch({ type: 'flag', i })
      navigator.vibrate?.(20)
    }, 420)
  }
  const endPress = () => clearTimeout(timer.current)

  let cls = 'cell'
  let content = ''
  if (cell.open) {
    cls += ' open'
    if (cell.mine) { cls += exploded ? ' boom' : ' mine'; content = '💣' }
    else if (cell.n) { cls += ` n${cell.n}`; content = cell.n }
  } else if (cell.flag) content = '🚩'

  return (
    <button
      className={cls}
      onClick={() => {
        if (longPressed.current) { longPressed.current = false; return }
        dispatch({ type: 'open', i })
      }}
      onContextMenu={(e) => { e.preventDefault(); dispatch({ type: 'flag', i }) }}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={endPress}
      onTouchCancel={endPress}
      aria-label={cell.open ? (cell.n ? `${cell.n} adjacent mines` : 'Empty') : cell.flag ? 'Flagged' : 'Hidden cell'}
    >
      {content}
    </button>
  )
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, 'Beginner', newGame)
  const [secs, setSecs] = useState(0)
  const { cells, w, status, level, m } = state

  // Timer runs only while a game is in progress.
  useEffect(() => {
    if (status === 'idle') setSecs(0)
    if (status !== 'playing') return
    const id = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  const flags = cells.filter((c) => c.flag).length
  const face = { won: '😎', lost: '😵' }[status] ?? '🙂'
  const message =
    status === 'won' ? `Cleared in ${secs} seconds!` :
    status === 'lost' ? 'Boom. Press the face to try again.' : ''

  return (
    <main>
      <h1>Minesweeper</h1>
      <div className="bar">
        <span className="stat" title="Mines left">{pad(m - flags)}</span>
        <button className="face" onClick={() => dispatch({ type: 'reset' })} aria-label="Restart">{face}</button>
        <span className="stat" title="Time">{pad(secs)}</span>
        <select
          value={level}
          onChange={(e) => dispatch({ type: 'reset', level: e.target.value })}
          aria-label="Difficulty"
        >
          {Object.keys(LEVELS).map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <div className="msg" role="status">{message}</div>
      <div className="scroll">
        <div className="board" style={{ gridTemplateColumns: `repeat(${w}, var(--s))` }}>
          {cells.map((cell, i) => (
            <Cell key={i} i={i} cell={cell} exploded={state.exploded === i} dispatch={dispatch} />
          ))}
        </div>
      </div>
      <p className="hint">
        Click to reveal, right-click or long-press to flag. Click a number to reveal its
        neighbours once enough flags are placed.
      </p>
    </main>
  )
}
