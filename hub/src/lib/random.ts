/**
 * A tiny seeded PRNG (mulberry32). Shape layouts are "random", but a given
 * seed always produces the same layout, so a section does not reshuffle on
 * every re-render — only when the visitor asks it to.
 */
export const hashSeed = (input: string): number => {
  let hash = 1779033703 ^ input.length
  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353)
    hash = (hash << 13) | (hash >>> 19)
  }
  return hash >>> 0
}

export interface Random {
  next: () => number
  range: (min: number, max: number) => number
  pick: <T>(items: readonly T[]) => T
  sign: () => 1 | -1
}

export const createRandom = (seed: string): Random => {
  let state = hashSeed(seed)
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    pick: (items) => items[Math.floor(next() * items.length)],
    sign: () => (next() < 0.5 ? -1 : 1),
  }
}

/**
 * One salt per page load: every visit gets its own arrangement, while a
 * single visit stays stable (StrictMode double renders included).
 */
export const SESSION_SALT = Math.random().toString(36).slice(2, 8)

/** Fisher–Yates on a copy. Unseeded on purpose: a new order on every visit. */
export const shuffle = <T>(items: readonly T[]): T[] => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}
