import * as React from "react"
import Component from "reactive-magic/component"
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

const root = "src/client/main.ts"

export default class App extends Component<{}> {
	view() {
		return (
			<div>
				{Array.from(childMap[root]).map(source => {
					return <div key={source}>{source}</div>
				})}
			</div>
		)
	}
}
