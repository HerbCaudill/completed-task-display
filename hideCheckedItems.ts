export const hideCheckedClass = 'hide-checked'
const listClass = 'HyperMD-list-line'

/**
 * Hides checked items, along with their children, in an markdown document rendered in Obsidian.
 */
export const hideCheckedItems = (container: Element) => {
  const lines = Array.from(container.querySelectorAll(`.${listClass}`))
  const checkedLevels: number[] = []

  // First pass: identify items that should have the class
  const shouldHide = new Set<Element>()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as HTMLElement
    const classNames = line.className.split(' ')

    // Extract level number from list-line-X class
    const levelClass = classNames.find(cls => cls.startsWith(`${listClass}-`))
    const level = levelClass ? Number.parseInt(levelClass.replace(`${listClass}-`, ''), 10) : 0

    // Remove any checked parent levels that are higher than current level
    while (checkedLevels.length > 0 && checkedLevels[checkedLevels.length - 1] >= level) {
      checkedLevels.pop()
    }

    const isChecked = line.getAttribute('data-task') === 'x'
    const parentIsChecked = checkedLevels.length > 0 && level > checkedLevels[checkedLevels.length - 1]

    if (isChecked) checkedLevels.push(level)
    if (isChecked || parentIsChecked) shouldHide.add(line)
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
