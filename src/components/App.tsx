import React from "react"
import { nodes } from "../../util/nodes"
import { select } from "glamor"

interface ColumnType {
	type: "parent" | "child" | "root"
	id: number
	anchor: boolean
}

function getColumnItems({ type, id }: ColumnType) {
	if (type === "parent") {
		return nodes[id]?.backlinks || []
	} else if (type === "child") {
		return nodes[id]?.refs || []
	} else {
		return [id]
	}
}

const root = 21

type AppState = {
	focusedColumn: number
	columnSelection: Array<number | undefined>
	columnTypes: Array<ColumnType>
}

const initialState: AppState = {
	focusedColumn: 1,
	columnSelection: [undefined, 0, undefined],
	columnTypes: [
		{ type: "parent", anchor: false, id: root },
		{ type: "root", anchor: true, id: root },
		{ type: "child", anchor: false, id: root },
	],
}

export default class App extends React.PureComponent {
	state: AppState = initialState

	componentDidMount() {
		window.addEventListener("keyup", this.handleKeyPress)
	}

	componentWillUnmount() {
		window.removeEventListener("keyup", this.handleKeyPress)
	}

	private handleKeyPress = (event: KeyboardEvent) => {
		if (event.code === "ArrowUp") {
			event.preventDefault()
			this.setState(up(this.state))
		} else if (event.code === "ArrowDown") {
			event.preventDefault()
			this.setState(down(this.state))
		} else if (event.code === "ArrowLeft") {
			event.preventDefault()
			this.setState(left(this.state))
		} else if (event.code === "ArrowRight") {
			event.preventDefault()
			this.setState(right(this.state))
		} else if (event.code === "Space") {
			event.preventDefault()
			this.setState(reroot(this.state))
		}
	}

	render() {
		const columns = this.state.columnTypes
			.map((columnType) => {
				return {
					items: getColumnItems(columnType),
					anchor: columnType.anchor,
				}
			})
			.map(({ items, anchor }, columnIndex) => {
				const focused = columnIndex === this.state.focusedColumn
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
						{items.map((id, rowIndex) => {
							const selection = this.state.columnSelection[columnIndex]
							const selected = rowIndex === selection
							return (
								<div
									key={rowIndex}
									style={{
										border: selected
											? anchor
												? "1px solid red"
												: "1px solid black"
											: "1px solid white",
									}}
								>
									{id}: {nodes[id].title}
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

function updateBounds(state: AppState): AppState {
	const { focusedColumn, columnTypes, columnSelection } = state
	const column = columnTypes[focusedColumn]
	const items = getColumnItems(column)
	const selection = columnSelection[focusedColumn]
	if (selection === undefined) {
		return state
	}

	if (focusedColumn === 0) {
		const selectedItem = items[selection]
		state = {
			...state,
			columnTypes: [
				{ type: "parent", anchor: false, id: selectedItem },
				...columnTypes,
			],
			columnSelection: [undefined, ...columnSelection],
			focusedColumn: 1,
		}
	}

	if (focusedColumn === columnTypes.length - 1) {
		const selectedItem = items[selection]
		state = {
			...state,
			columnTypes: [
				...columnTypes,
				{ type: "child", anchor: false, id: selectedItem },
			],
			columnSelection: [...columnSelection, undefined],
		}
	}
	return state
}

function updateNeighbors(state: AppState): AppState {
	return updateLeftNeighbor(updateRightNeighbor(state))
}

function updateRightNeighbor(state: AppState): AppState {
	const { focusedColumn, columnTypes, columnSelection } = state
	const column = columnTypes[focusedColumn]
	const items = getColumnItems(column)
	const selection = columnSelection[focusedColumn]
	if (selection === undefined) {
		return state
	}

	const selectedItem = items[selection]
	const rightNeightbor = columnTypes[focusedColumn + 1]
	if (rightNeightbor.type === "child" && !rightNeightbor.anchor) {
		state = {
			...state,
			// Clear the selection to the right and update the key
			columnSelection: columnSelection
				.map((x, i) => {
					return i === focusedColumn + 1 ? undefined : x
				})
				.slice(0, focusedColumn + 2),
			columnTypes: columnTypes
				.map((x, i) => {
					return i === focusedColumn + 1 ? { ...x, id: selectedItem } : x
				})
				.slice(0, focusedColumn + 2),
		}
	}
	return state
}

function updateLeftNeighbor(state: AppState): AppState {
	const { focusedColumn, columnTypes, columnSelection } = state
	const column = columnTypes[focusedColumn]
	const items = getColumnItems(column)
	const selection = columnSelection[focusedColumn]
	if (selection === undefined) {
		return state
	}

	const selectedItem = items[selection]
	const leftNeighbor = columnTypes[focusedColumn - 1]
	if (leftNeighbor.type === "parent" && !leftNeighbor.anchor) {
		state = {
			...state,
			// Clear the selection to the left and update the key
			columnSelection: columnSelection
				.map((x, i) => {
					return i === focusedColumn - 1 ? undefined : x
				})
				.slice(focusedColumn - 1),
			columnTypes: columnTypes
				.map((x, i) => {
					return i === focusedColumn - 1 ? { ...x, id: selectedItem } : x
				})
				.slice(focusedColumn - 1),
			focusedColumn: 1,
		}
	}

	return state
}

function reroot(state: AppState): AppState {
	const { focusedColumn, columnTypes, columnSelection } = state
	const leftNeighbor = columnTypes[focusedColumn - 1]
	if (leftNeighbor.type !== "parent" || leftNeighbor.anchor) {
		state = {
			...state,
			focusedColumn: 0,
			columnTypes: columnTypes.slice(focusedColumn).map((item, index) => {
				if (index === 0) {
					item.anchor = true
				} else {
					item.anchor = false
				}
				return item
			}),
			columnSelection: columnSelection.slice(focusedColumn),
		}
		state = updateBounds(state)
	}

	const rightNeightbor = columnTypes[focusedColumn + 1]
	if (rightNeightbor.type !== "child" || rightNeightbor.anchor) {
		state = {
			...state,
			columnTypes: columnTypes
				.slice(0, focusedColumn + 1)
				.map((item, index) => {
					if (index === focusedColumn) {
						item.anchor = true
					} else {
						item.anchor = false
					}
					return item
				}),
			columnSelection: columnSelection.slice(0, focusedColumn + 1),
		}
		state = updateBounds(state)
	}

	return state
}

function up(state: AppState): AppState {
	const { focusedColumn, columnSelection } = state
	const selection = columnSelection[focusedColumn]
	if (selection === undefined) {
		state = {
			...state,
			// If there's nothing selection, set it to zero
			columnSelection: columnSelection.map((x, i) => {
				return i === focusedColumn ? 0 : x
			}),
		}
		state = updateNeighbors(state)
	} else if (selection > 0) {
		state = {
			...state,
			// Or decrement the selection but don't go out of bounds
			columnSelection: columnSelection.map((x, i) => {
				return i === focusedColumn ? selection - 1 : x
			}),
		}
		state = updateNeighbors(state)
	}

	return state
}

function down(state: AppState): AppState {
	const { focusedColumn, columnTypes, columnSelection } = state
	const column = columnTypes[focusedColumn]
	const selection = columnSelection[focusedColumn]
	const items = getColumnItems(column)
	if (selection === undefined) {
		// This shouldn't happen...
		state = {
			...state,
			// If there's nothing selection, set it to zero
			columnSelection: columnSelection.map((x, i) => {
				return i === focusedColumn ? 0 : x
			}),
		}
		state = updateNeighbors(state)
	} else if (selection + 1 < items.length) {
		state = {
			...state,
			columnSelection: columnSelection.map((x, i) => {
				return i === focusedColumn ? selection + 1 : x
			}),
		}
		state = updateNeighbors(state)
	}

	return state
}

function left(state: AppState): AppState {
	const { focusedColumn, columnTypes, columnSelection } = state
	const newFocus = focusedColumn - 1
	if (getColumnItems(columnTypes[newFocus]).length !== 0) {
		let newColumnSelection = columnSelection
		if (columnSelection[newFocus] === undefined) {
			newColumnSelection = columnSelection.map((x, i) => {
				return i === newFocus ? 0 : x
			})
		}
		state = {
			...state,
			focusedColumn: newFocus,
			columnSelection: newColumnSelection,
		}
		state = updateBounds(state)
	}

	return state
}

function right(state: AppState): AppState {
	const { focusedColumn, columnTypes, columnSelection } = state
	const newFocus = focusedColumn + 1
	if (getColumnItems(columnTypes[newFocus]).length !== 0) {
		let newColumnSelection = columnSelection
		if (columnSelection[newFocus] === undefined) {
			newColumnSelection = columnSelection.map((x, i) => {
				return i === newFocus ? 0 : x
			})
		}
		console.log("before", state)
		state = {
			...state,
			focusedColumn: newFocus,
			columnSelection: newColumnSelection,
		}
		console.log("after", state)
		state = updateBounds(state)
		console.log("bounds", state)
	}

	return state
}
