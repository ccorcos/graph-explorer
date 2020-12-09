import React, {
	useEffect,
	useState,
	useCallback,
	useRef,
	useLayoutEffect,
} from "react"
import { nodes } from "../../util/nodes"

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

export default function App() {
	const [state, setState] = useState(initialState)

	const handleKeyPress = useCallback((event: KeyboardEvent) => {
		if (event.code === "ArrowUp") {
			event.preventDefault()
			setState(up)
		} else if (event.code === "ArrowDown") {
			event.preventDefault()
			setState(down)
		} else if (event.code === "ArrowLeft") {
			event.preventDefault()
			setState(left)
		} else if (event.code === "ArrowRight") {
			event.preventDefault()
			setState(right)
		} else if (event.code === "Space") {
			event.preventDefault()
			setState(reroot)
		}
	}, [])

	useEffect(() => {
		window.addEventListener("keydown", handleKeyPress)
		return () => window.removeEventListener("keydown", handleKeyPress)
	})

	const container = useRef<HTMLDivElement | null>(null)

	const n = useNthRender()

	useLayoutEffect(() => {
		const scroller = container.current
		if (!scroller) {
			return
		}
		const column = scroller.children[state.focusedColumn + 1] as HTMLDivElement

		scroller.scrollLeft =
			column.offsetLeft - scroller.clientWidth / 2 + column.clientWidth / 2
		return
	}, [state.focusedColumn])

	const colWidth = 325
	const height = colWidth * 1.5
	const width = colWidth * 4

	const columns = state.columnTypes
		.map((columnType) => {
			return {
				items: getColumnItems(columnType),
				anchor: columnType.anchor,
			}
		})
		.map(({ items, anchor }, columnIndex) => {
			const focused = columnIndex === state.focusedColumn
			return (
				<div
					key={columnIndex}
					style={{
						boxSizing: "border-box",
						display: "inline-block",
						padding: 12,
						width: 325,
						height: height,
						overflowY: "auto",
						overflowX: "hidden",
						background: focused ? "#e2e2e2" : undefined,
					}}
				>
					{items.map((id, rowIndex) => {
						const selection = state.columnSelection[columnIndex]
						const selected = rowIndex === selection
						return (
							<div
								key={rowIndex}
								style={{
									border: selected
										? anchor
											? "1px solid red"
											: "1px solid black"
										: undefined,
									boxSizing: "border-box",
								}}
							>
								{id}: {nodes[id].title}
							</div>
						)
					})}
				</div>
			)
		})

	const buffer = (
		<div style={{ display: "inline-block", width: 2 * colWidth }}></div>
	)
	return (
		<div
			ref={container}
			style={{
				height: height,
				width: width,
				border: "1px solid black",
				overflowX: "hidden",
				overflowY: "hidden",
				whiteSpace: "nowrap",
				boxSizing: "border-box",
			}}
		>
			{buffer}
			{columns}
			{buffer}
		</div>
	)
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
		state = {
			...state,
			focusedColumn: newFocus,
			columnSelection: newColumnSelection,
		}
		state = updateBounds(state)
	}

	return state
}

function useNthRender() {
	const nth = useRef(-1)
	nth.current += 1
	return nth.current
}

function usePrevious<T>(value: T) {
	const ref = useRef(value)
	useEffect(() => {
		ref.current = value
	}, [value])
	return ref.current
}
