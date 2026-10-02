// Pure game logic: no React in here, so it is easy to test.

export const LEVELS = {
  Beginner: { w: 9, h: 9, m: 10 },
  Intermediate: { w: 16, h: 16, m: 40 },
  Expert: { w: 30, h: 16, m: 99 },
}

export function newGame(level) {
  const { w, h, m } = LEVELS[level]
  return {
    level, w, h, m,
    cells: Array.from({ length: w * h }, () => ({ mine: false, open: false, flag: false, n: 0 })),
    status: 'idle', // idle | playing | won | lost
  }
}

export function neighbors(i, w, h) {
  const x = i % w, y = Math.floor(i / w), out = []
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue
      const nx = x + dx, ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < w && ny < h) out.push(ny * w + nx)
    }
  return out
}

// Mines go down after the first click; the clicked cell and its neighbours stay clear.
function placeMines(cells, w, h, m, first) {
  const safe = new Set([first, ...neighbors(first, w, h)])
  let placed = 0
  while (placed < m) {
    const i = Math.floor(Math.random() * w * h)
    if (cells[i].mine || safe.has(i)) continue
    cells[i].mine = true
    placed++
  }
  cells.forEach((c, i) => {
    c.n = neighbors(i, w, h).filter((j) => cells[j].mine).length
  })
}

// Flood fill from one cell. Returns the index of a mine if one was opened, else -1.
function reveal(cells, start, w, h) {
  const stack = [start]
  while (stack.length) {
    const i = stack.pop(), c = cells[i]
    if (c.open || c.flag) continue
    c.open = true
    if (c.mine) return i
    if (c.n === 0) stack.push(...neighbors(i, w, h))
  }
  return -1
}

function chord(cells, i, w, h) {
  const c = cells[i]
  if (!c.open || !c.n) return -1
  const ns = neighbors(i, w, h)
  if (ns.filter((j) => cells[j].flag).length !== c.n) return -1
  for (const j of ns) {
    if (cells[j].open || cells[j].flag) continue
    const hit = reveal(cells, j, w, h)
    if (hit >= 0) return hit
  }
  return -1
}

export function openCell(state, i) {
  if (state.status === 'won' || state.status === 'lost') return state
  if (state.cells[i].flag) return state
  const { w, h, m } = state
  const cells = state.cells.map((c) => ({ ...c }))
  let status = state.status
  if (status === 'idle') {
    placeMines(cells, w, h, m, i)
    status = 'playing'
  }
  const hit = cells[i].open ? chord(cells, i, w, h) : reveal(cells, i, w, h)

  if (hit >= 0) {
    cells.forEach((c) => {
      if (c.mine && !c.flag) c.open = true
    })
    return { ...state, cells, status: 'lost', exploded: hit }
  }
  if (cells.filter((c) => c.open).length === w * h - m) {
    cells.forEach((c) => {
      if (c.mine) c.flag = true
    })
    status = 'won'
  }
  return { ...state, cells, status }
}

export function toggleFlag(state, i) {
  if (state.status === 'won' || state.status === 'lost') return state
  if (state.cells[i].open) return state
  const cells = state.cells.slice()
  cells[i] = { ...cells[i], flag: !cells[i].flag }
  return { ...state, cells }
}
