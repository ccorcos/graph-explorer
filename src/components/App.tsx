import * as React from "react"
import Component from "reactive-magic/component"
import { Value } from "reactive-magic"
import dependencies from "../dependencies"

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

// A column is either a parent of X, child of X, or root of X.
// The anchor determines which column splits parent and child.

// we need a list of columns
// the anchor is the column index
// columns need to know their index in the global

interface ColumnType {
	type: "parent" | "child" | "root"
	key: string
}

function getColumnItems({ type, key }: ColumnType) {
	if (type === "parent") {
		return Array.from(parentMap[key])
	} else if (type === "child") {
		return Array.from(childMap[key])
	} else {
		return [key]
	}
}

const root = "src/client/stores/RecordStore.ts"

export default class App extends Component<{}> {
	private focusedColumn = new Value(1)
	private columnSelection = new Value([undefined, 0, undefined])
	private columnTypes = new Value<Array<ColumnType>>([
		{ type: "parent", key: root },
		{ type: "root", key: root },
		{ type: "child", key: root },
	])

	willMount() {
		window.addEventListener("keyup", this.handleKeyPress)
	}

	willUnMount() {
		window.removeEventListener("keyup", this.handleKeyPress)
	}

	private handleKeyPress = (event: KeyboardEvent) => {
		if (event.code === "ArrowUp") {
			this.up()
		} else if (event.code === "ArrowDown") {
			this.down()
		} else if (event.code === "ArrowLeft") {
			this.left()
		} else if (event.code === "ArrowRight") {
			this.right()
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
		} else if (selection > 0) {
			// Or decrement the selection but don't go out of bounds
			this.columnSelection.update(state => {
				state[focus] = selection - 1
				return state
			})
		}
		this.updateNeighbors()
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
		} else if (selection + 1 < items.length) {
			this.columnSelection.update(state => {
				state[focus] = selection + 1
				return state
			})
		}
		this.updateNeighbors()
	}

	private left() {
		const focus = this.focusedColumn.get()
		const newFocus = focus - 1
		this.focusedColumn.set(newFocus)
		if (this.columnSelection.get()[newFocus] === undefined) {
			this.columnSelection.update(columnSelection => {
				columnSelection[newFocus] = 0
				return columnSelection
			})
		}
		this.updateBounds()
	}

	private right() {
		const focus = this.focusedColumn.get()
		const newFocus = focus + 1
		this.focusedColumn.set(newFocus)
		if (this.columnSelection.get()[newFocus] === undefined) {
			this.columnSelection.update(columnSelection => {
				columnSelection[newFocus] = 0
				return columnSelection
			})
		}
		this.updateBounds()
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
				columnTypes.unshift({ type: "parent", key: selectedItem })
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
				columnTypes.push({ type: "child", key: selectedItem })
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
		if (columnTypes[focus + 1].type === "child") {
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

		if (columnTypes[focus - 1].type === "parent") {
			// Clear the selection to the left and update the key
			this.columnSelection.update(state => {
				state[focus - 1] = undefined
				return state.slice(focus - 1)
			})
			this.columnTypes.update(state => {
				state[focus - 1].key = selectedItem
				return state.slice(focus - 1)
			})
		}
	}

	view() {
		console.log(this.columnTypes.get().length)
		const columns = this.columnTypes
			.get()
			.map(getColumnItems)
			.map((items, columnIndex) => {
				const focused = columnIndex === this.focusedColumn.get()
				return (
					<div
						key={columnIndex}
						style={{
							padding: 12,
							border: focused ? "1px solid black" : "1px solid white",
						}}
					>
						column
						{items.map((source, rowIndex) => {
							const selection = this.columnSelection.get()[columnIndex]
							const selected = rowIndex === selection
							return (
								<div
									key={rowIndex}
									style={{
										border: selected ? "1px solid black" : "1px solid white",
									}}
								>
									{source}
								</div>
							)
						})}
					</div>
				)
			})

		return <div style={{ display: "flex" }}>{columns}</div>
	}
}
