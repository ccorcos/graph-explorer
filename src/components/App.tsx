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

export default class App extends Component<{}> {
	private columns: Value<Array<ColumnType>>
	private anchor: Value<number>

	constructor(props) {
		super(props)
		const root = "src/client/stores/RecordStore.ts"
		const columns: Array<ColumnType> = [
			{ type: "parent", key: root },
			{ type: "root", key: root },
			{ type: "child", key: root },
		]
		const anchor = 1
		this.columns = new Value(columns)
		this.anchor = new Value(anchor)
	}
	view() {
		return (
			<div style={{ display: "flex" }}>
				<div style={{ padding: 12 }}>
					{Array.from(parentMap[this.root.get()]).map(source => {
						return <div key={source}>{source}</div>
					})}
				</div>
				<div style={{ padding: 12 }}>
					<div>{this.root.get()}</div>
				</div>
				<div style={{ padding: 12 }}>
					{Array.from(childMap[this.root.get()]).map(source => {
						return <div key={source}>{source}</div>
					})}
				</div>
			</div>
		)
	}
}
