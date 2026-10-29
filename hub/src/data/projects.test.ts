import { describe, expect, it } from 'vitest'
import { FEATURED_PROJECTS, PROJECTS } from './projects'

describe('project catalog', () => {
  it('keeps slugs unique', () => {
    const slugs = PROJECTS.map((project) => project.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('only gives live projects an https url', () => {
    for (const project of PROJECTS) {
      if (project.url) expect(project.url).toMatch(/^https:\/\//)
    }
  })

  it('features a spread of live projects', () => {
    expect(FEATURED_PROJECTS.length).toBeGreaterThanOrEqual(6)
    for (const project of FEATURED_PROJECTS) expect(project.url).toBeTruthy()
  })

  it('does not surface the telenursing work', () => {
    expect(PROJECTS.some((project) => /telenursing/i.test(`${project.name} ${project.slug}`))).toBe(false)
  })
})
