import { assert, describe, expect, test } from 'vitest'
import { hideCheckedClass, hideCheckedItems } from '../hideCheckedItems'

const testCases = [
  {
    name: 'hides checked items',
    input: `
      x | - [x] alpha
        | - [ ] bravo
    `,
  },
  {
    name: 'hides children of checked tasks',
    input: `
      x | - [x] alpha
      x |   - one
      x |   - two
        | - [ ] bravo
    `,
  },
  {
    name: 'hides nested tasks',
    input: `
      x | - [x] alpha
      x |   - one
      x |   - [x] two
      x |     - 123
        | - bravo
    `,
  },
  {
    name: 'handles complex nested tasks',
    input: `
      x | - [x] alpha
      x |   - one
      x |   - [x] two
      x |     - 123
      x |   - three
        | - bravo
    `,
  },
  {
    name: 'handles non-sequential indentation',
    input: `
      x | - [x] alpha
      x |     - one
        | - bravo
    `,
  },
  {
    name: 'handles non-list items',
    input: `
      x | - [x] alpha
        | ## Heading
        | - bravo
    `,
  },
]

describe('hideCheckedItems', () => {
  for (const testCase of testCases) {
    test(testCase.name, () => {
      const inputs = testCase.input
        .trim()
        .split('\n')
        .map(x => x.split(/ \| /))
        .map(([x, line]) => ({ shouldHide: x.trim() === 'x', line }))

      const container = createTestCase(inputs.map(x => x.line))
      hideCheckedItems(container)

      const outputLines = Array.from(container.querySelectorAll('div.markdown-source-view > div'))

      for (const i in inputs) {
        const { shouldHide, line } = inputs[i]
        assert(
          isCheckedChild(outputLines[i]) === shouldHide,
          `${testCase.input}
          \`${line}\` should ${shouldHide ? 'be' : 'not be'} hidden`,
        )
        expect(isCheckedChild(outputLines[i])).toBe(shouldHide)
      }
    })
  }
})

const createTestCase = (lines: string[]): HTMLElement => {
  const container = document.createElement('div')
  container.className = 'markdown-source-view'

  lines.forEach(line => {
    const trimmedLine = line.trimStart()

    // Check if this is a paragraph (doesn't start with list marker)
    if (!trimmedLine.startsWith('-')) {
      const paragraphEl = document.createElement('div')
      paragraphEl.className = 'HyperMD-paragraph'
      paragraphEl.textContent = trimmedLine
      container.appendChild(paragraphEl)
      return
    }

    // Calculate indentation level (each 2 spaces = 1 level)
    const level = line.match(/^((\s\s)*)/)![1].length + 1

    // Create the line element
    const lineEl = document.createElement('div')
    lineEl.className = `HyperMD-list-line HyperMD-list-line-${level}`

    // Check if a line is a task and if it's checked or not
    if (line.includes('[x]')) {
      lineEl.setAttribute('data-task', 'x')
    } else if (line.includes('[ ]')) {
      lineEl.setAttribute('data-task', '')
    }

    // Set the text content (removing the leading spaces, list marker and task checkbox)
    const contentMatch = line.match(/^(\s*)-\s(?:\[([ x])\]\s)?(.*)/)
    if (contentMatch) {
      lineEl.textContent = contentMatch[3]
    } else {
      lineEl.textContent = line.trim().substring(2) // Remove the "- " prefix
    }

    container.appendChild(lineEl)
  })

  return container
}

// Helper to check if an element has the child-of-checked class
const isCheckedChild = (el: Element): boolean => el.classList.contains(hideCheckedClass)
