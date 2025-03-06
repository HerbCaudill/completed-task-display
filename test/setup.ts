import { beforeAll } from 'vitest'

beforeAll(() => {
  // Mock the Obsidian API
  global.window.document.body.toggleClass = (className: string, shouldToggle: boolean) => {
    if (shouldToggle) {
      document.body.classList.add(className)
    } else {
      document.body.classList.remove(className)
    }
  }
})
