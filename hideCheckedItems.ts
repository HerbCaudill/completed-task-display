export const hideCheckedClass = 'hide-checked'
const listClass = 'HyperMD-list-line'

/**
 * Hides checked items, along with their children, in an markdown document rendered in Obsidian.
 */
export const hideCheckedItems = (container: Element) => {
  const lines = Array.from(container.querySelectorAll(`.${listClass}`))
  let currentLevel = 0
  let insideCheckedParent = false

  // First pass: identify items that should have the class
  const shouldHide = new Set<Element>()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as HTMLElement
    const classNames = line.className.split(' ')

    // Extract level number from list-line-X class
    const levelClass = classNames.find(cls => cls.startsWith(`${listClass}-`))
    const level = levelClass ? Number.parseInt(levelClass.replace(`${listClass}-`, ''), 10) : 0

    // If we're inside a checked parent's children
    if (insideCheckedParent) {
      // Add styling class to children (higher level = deeper nesting)
      if (level > currentLevel) {
        shouldHide.add(line)
      } else {
        // We've hit another item at the same or higher level
        insideCheckedParent = false
      }
    }
    // If this is a checked parent item, hide it
    else if (line.getAttribute('data-task') === 'x') {
      insideCheckedParent = true
      shouldHide.add(line)
      currentLevel = level
      continue
    }
  }

  // Second pass: update classes efficiently to minimize DOM changes
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as HTMLElement
    const hasClass = line.classList.contains(hideCheckedClass)
    const needsClass = shouldHide.has(line)

    if (hasClass && !needsClass) {
      line.classList.remove(hideCheckedClass)
    } else if (!hasClass && needsClass) {
      line.classList.add(hideCheckedClass)
    }
  }
}
