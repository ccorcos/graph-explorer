import * as React from "react"
import Component from "reactive-magic/component"
import { Value } from "reactive-magic"
import dependencies from "../dependencies"

// TODO
// - reroot!

const childMap: { [key: string]: Set<string> } = {}
const parentMap: { [key: string]: Set<string> } = {}

dependencies.dependencies.forEach(parentDep => {
	const parent = parentDep.source
	if (!childMap[parent]) {
		childMap[parent] = new Set()
	}
	parentDep.dependencies.forEach(childDep => {
		const child = childDep.resolved
		if (!parentMap[child]) {
			parentMap[child] = new Set()
		}
		childMap[parent].add(child)
		parentMap[child].add(parent)
	})
})

interface ColumnType {
	type: "parent" | "child" | "root"
	key: string
	anchor: boolean
}

function getColumnItems({ type, key }: ColumnType) {
	if (type === "parent") {
		const set = parentMap[key]
		return set ? Array.from(set) : []
	} else if (type === "child") {
		const set = childMap[key]
		return set ? Array.from(set) : []
	} else {
		return [key]
	}
}

const root = "src/client/stores/RecordStore.ts"

export default class App extends Component<{}> {
	private focusedColumn = new Value(1)
	private columnSelection = new Value([undefined, 0, undefined])
	private columnTypes = new Value<Array<ColumnType>>([
		{ type: "parent", anchor: false, key: root },
		{ type: "root", anchor: true, key: root },
		{ type: "child", anchor: false, key: root },
	])

	willMount() {
		window.addEventListener("keyup", this.handleKeyPress)
	}

	willUnMount() {
		window.removeEventListener("keyup", this.handleKeyPress)
	}

	private reroot() {
		// everything to the left needs to be a parent
		// everything to the right needs to be a child

		const focus = this.focusedColumn.get()
		const columnTypes = this.columnTypes.get()
		if (columnTypes[focus - 1].type !== "parent") {
			this.focusedColumn.set(0)
			this.columnTypes.update(columnTypes => {
				return columnTypes.slice(focus).map((item, index) => {
					if (index === 0) {
						item.anchor = true
					} else {
						item.anchor = false
					}
					return item
				})
			})
			this.columnSelection.update(columnSelection => {
				return columnSelection.slice(focus)
			})
			this.updateBounds()
		}

		if (columnTypes[focus + 1].type !== "child") {
			this.columnTypes.update(columnTypes => {
				return columnTypes.slice(0, focus + 1).map((item, index) => {
					if (index === focus) {
						item.anchor = true
					} else {
						item.anchor = false
					}
					return item
				})
			})
			this.columnSelection.update(columnSelection => {
				return columnSelection.slice(0, focus + 1)
			})
			this.updateBounds()
		}
	}

	private handleKeyPress = (event: KeyboardEvent) => {
		if (event.code === "ArrowUp") {
			this.up()
			event.preventDefault()
		} else if (event.code === "ArrowDown") {
			this.down()
			event.preventDefault()
		} else if (event.code === "ArrowLeft") {
			this.left()
			event.preventDefault()
		} else if (event.code === "ArrowRight") {
			this.right()
			event.preventDefault()
		} else if (event.code === "Space") {
			this.reroot()
			event.preventDefault()
		}
	}

	private up() {
		const focus = this.focusedColumn.get()
		const selection = this.columnSelection.get()[focus]
		if (selection === undefined) {
			// If there's nothing selection, set it to zero
			this.columnSelection.update(state => {
				state[focus] = 0
				return state
			})
			this.updateNeighbors()
		} else if (selection > 0) {
			// Or decrement the selection but don't go out of bounds
			this.columnSelection.update(state => {
				state[focus] = selection - 1
				return state
			})
			this.updateNeighbors()
		}
	}

	private down() {
		const focus = this.focusedColumn.get()
		const column = this.columnTypes.get()[focus]
		const selection = this.columnSelection.get()[focus]
		const items = getColumnItems(column)
		if (selection === undefined) {
			// This shouldn't happen...
			this.columnSelection.update(state => {
				state[focus] = 0
				return state
			})
			this.updateNeighbors()
		} else if (selection + 1 < items.length) {
			this.columnSelection.update(state => {
				state[focus] = selection + 1
				return state
			})
			this.updateNeighbors()
		}
	}

	private left() {
		const focus = this.focusedColumn.get()
		const newFocus = focus - 1
		if (getColumnItems(this.columnTypes.get()[newFocus]).length !== 0) {
			this.focusedColumn.set(newFocus)
			if (this.columnSelection.get()[newFocus] === undefined) {
				this.columnSelection.update(columnSelection => {
					columnSelection[newFocus] = 0
					return columnSelection
				})
			}
			this.updateBounds()
		}
	}

	private right() {
		const focus = this.focusedColumn.get()
		const newFocus = focus + 1
		if (getColumnItems(this.columnTypes.get()[newFocus]).length !== 0) {
			this.focusedColumn.set(newFocus)
			if (this.columnSelection.get()[newFocus] === undefined) {
				this.columnSelection.update(columnSelection => {
					columnSelection[newFocus] = 0
					return columnSelection
				})
			}
			this.updateBounds()
		}
	}

	private updateBounds() {
		const focus = this.focusedColumn.get()
		const columnTypes = this.columnTypes.get()
		const column = columnTypes[focus]
		const items = getColumnItems(column)
		const selection = this.columnSelection.get()[focus]
		if (selection === undefined) {
			return
		}

		if (focus === 0) {
			const selectedItem = items[selection]
			this.columnTypes.update(columnTypes => {
				columnTypes.unshift({
					type: "parent",
					anchor: false,
					key: selectedItem,
				})
				return columnTypes
			})
			this.columnSelection.update(columnSelection => {
				columnSelection.unshift(undefined)
				return columnSelection
			})
			this.focusedColumn.set(1)
		}

		if (focus === columnTypes.length - 1) {
			const selectedItem = items[selection]
			this.columnTypes.update(columnTypes => {
				columnTypes.push({ type: "child", anchor: false, key: selectedItem })
				return columnTypes
			})
			this.columnSelection.update(columnSelection => {
				columnSelection.push(undefined)
				return columnSelection
			})
		}
	}

	private updateNeighbors() {
		const focus = this.focusedColumn.get()
		const columnTypes = this.columnTypes.get()
		const column = columnTypes[focus]
		const items = getColumnItems(column)
		const selection = this.columnSelection.get()[focus]
		if (selection === undefined) {
			return
		}

		const selectedItem = items[selection]
		const rightNeightbor = columnTypes[focus + 1]
		if (rightNeightbor.type === "child" && !rightNeightbor.anchor) {
			// Clear the selection to the right and update the key
			this.columnSelection.update(state => {
				state[focus + 1] = undefined
				return state.slice(0, focus + 2)
			})
			this.columnTypes.update(state => {
				state[focus + 1].key = selectedItem
				return state.slice(0, focus + 2)
			})
		}

		const leftNeighbor = columnTypes[focus - 1]
		if (leftNeighbor.type === "parent" && !leftNeighbor.anchor) {
			// Clear the selection to the left and update the key
			this.columnSelection.update(state => {
				state[focus - 1] = undefined
				return state.slice(focus - 1)
			})
			this.columnTypes.update(state => {
				state[focus - 1].key = selectedItem
				return state.slice(focus - 1)
			})
			this.focusedColumn.set(1)
		}
	}

	view() {
		const columns = this.columnTypes
			.get()
			.map(columnType => {
				return {
					items: getColumnItems(columnType),
					anchor: columnType.anchor,
				}
			})
			.map(({ items, anchor }, columnIndex) => {
				const focused = columnIndex === this.focusedColumn.get()
				return (
					<div
						key={columnIndex}
						style={{
							display: "inline-block",
							padding: 12,
							width: 325,
							height: "80vh",
							overflowY: "auto",
							overflowX: "hidden",
							border: focused ? "1px solid black" : "1px solid white",
						}}
					>
						{items.map((source, rowIndex) => {
							const selection = this.columnSelection.get()[columnIndex]
							const selected = rowIndex === selection
							return (
								<div
									key={rowIndex}
									style={{
										border: selected
											? anchor ? "1px solid red" : "1px solid black"
											: "1px solid white",
									}}
								>
									{source}
								</div>
							)
						})}
					</div>
				)
			})

		return (
			<div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>{columns}</div>
		)
	}
}
