/*

1. Go to a Roam, ••• > Export All > EDN.
2. Rename to roam.edn and move to the util directory.
3. Run `./node_modules/.bin/ts-node util/compile.ts`

*/

import * as fs from "fs"
import { execSync } from "child_process"

process.chdir(__dirname)
const ednStr = fs.readFileSync("roam.edn", "utf8")

// Remove the DataScript schema heading.
const rest = ednStr
	.split(":datoms ")
	.slice(1)
	.join(":datoms ")
	.split("##NaN")
	.join("0")
fs.writeFileSync("tmp.edn", rest)

// Convert to JSON.
execSync("../node_modules/.bin/edn-to-json tmp.edn > tmp.json")

// REad in the JSON.
const eavt = JSON.parse(fs.readFileSync("tmp.json", "utf8")) as Array<
	[number, string, any, number]
>

type Node = {
	id: number
	title?: string
	refs?: Array<number>
	backlinks?: Array<number>
}

const nodes: Record<string, Node> = {}

for (const [e, a, v, t] of eavt) {
	if (a === "title" || a === "refs") {
		if (!nodes[e]) {
			nodes[e] = { id: e }
		}
		if (a === "title") {
			nodes[e].title = v
		}
		if (a === "refs") {
			if (!nodes[e].refs) {
				nodes[e].refs = []
			}
			nodes[e].refs?.push(v)
			if (!nodes[v]) {
				nodes[v] = { id: v }
			}
			if (!nodes[v].backlinks) {
				nodes[v].backlinks = []
			}
			nodes[v].backlinks?.push(e)
		}
	}
}

const contents = `
export type Node = {
	id: number
	title?: string
	refs?: Array<number>
	backlinks?: Array<number>
}

export const nodes: Record<number, Node> = ${JSON.stringify(nodes, null, 2)}
`

fs.writeFileSync("nodes.ts", contents)
