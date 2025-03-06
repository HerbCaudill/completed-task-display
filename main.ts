import { hideCheckedItems } from './hideCheckedItems'
import { addIcon, App, MarkdownView, Plugin, PluginManifest } from 'obsidian'

const SHOWING = 'Showing completed'
const HIDING = 'Hiding completed'

export default class TaskHiderPlugin extends Plugin {
  private observers: Map<Element, MutationObserver> = new Map()
  private processingUpdate = false
  private statusBar: HTMLElement

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)
    this.statusBar = this.addStatusBarItem()
  }

  async onload() {
    this.statusBar.setText(SHOWING)

    addIcon('tasks', taskShowIcon)

    this.addRibbonIcon('tasks', 'Show/hide completed', () => {
      this.toggleCompletedTaskView()
    })

    this.addCommand({
      id: 'toggle-completed-task-view',
      name: 'Show/hide completed',
      callback: () => {
        this.toggleCompletedTaskView()
      },
    })

    // Process existing editors
    this.update()
    // Register for new editors being created
    this.registerEvent(this.app.workspace.on('layout-change', () => this.update()))
  }

  toggleCompletedTaskView() {
    document.body.toggleClass('hide-completed-tasks', hiddenState)
    hiddenState = !hiddenState
    this.statusBar.setText(hiddenState ? SHOWING : HIDING)
  }

  update() {
    this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
      const view = leaf.view
      if (!(view instanceof MarkdownView)) return

      const container = view.contentEl.querySelector('.markdown-source-view')
      if (!container) return

      // Update immediately
      this.updateCheckedItemsChildren(container)

      // If we already have an observer for this container, we don't need a new one
      if (this.observers.has(container)) return

      // Set up mutation observer for this  container
      const observer = new MutationObserver(mutations => {
        // Filter mutations to avoid processing our own class changes
        const shouldProcess = mutations.some(mutation => {
          if (mutation.type === 'childList') return true
          if (mutation.type === 'attributes') {
            const checkedChanged = mutation.attributeName === 'data-task'
            const classChangedButNotByUs =
              mutation.attributeName === 'class' &&
              !mutation.oldValue?.includes('child-of-checked') &&
              !(mutation.target as Element).className.includes('child-of-checked')
            return checkedChanged || classChangedButNotByUs
          }
          return false
        })

        if (shouldProcess) {
          this.updateCheckedItemsChildren(container)
        }
      })

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-task', 'class'],
        attributeOldValue: true,
      })

      this.observers.set(container, observer)
    })
  }

  updateCheckedItemsChildren(container: Element) {
    try {
      // Set flag to avoid recursive calls
      this.processingUpdate = true
      hideCheckedItems(container)
    } finally {
      // Always clear the flag when done
      this.processingUpdate = false
    }
  }

  onunload() {
    console.log('unloading completed-task-display plugin')
    // Disconnect all mutation observers
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }

    this.observers.clear()

    // Clean up any child-of-checked classes when plugin is disabled
    document.querySelectorAll('.child-of-checked').forEach(el => {
      el.classList.remove('child-of-checked')
    })
  }
}

const taskShowIcon = `<svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="tasks" class="svg-inline--fa fa-tasks fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M145.35 207a8 8 0 0 0-11.35 0l-71 71-39-39a8 8 0 0 0-11.31 0L1.35 250.34a8 8 0 0 0 0 11.32l56 56a8 8 0 0 0 11.31 0l88-88a8 8 0 0 0 0-11.32zM62.93 384c-17.67 0-32.4 14.33-32.4 32s14.73 32 32.4 32a32 32 0 0 0 0-64zm82.42-337A8 8 0 0 0 134 47l-71 71-39-39a8 8 0 0 0-11.31 0L1.35 90.34a8 8 0 0 0 0 11.32l56 56a8 8 0 0 0 11.31 0l88-88a8 8 0 0 0 0-11.32zM503 400H199a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h304a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8zm0-320H199a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h304a8 8 0 0 0 8-8V88a8 8 0 0 0-8-8zm0 160H199a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h304a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8z"></path></svg>`
let hiddenState = true
