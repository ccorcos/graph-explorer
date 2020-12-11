# Graph Explorer

This is a prototype for a generalized graph explorer. Think of it like Apple's Finder but it works on graphs, not just trees.

The current demo uses Roam as a source for exploring.

**Explanation:** The explorer starts with an anchor column with a selected item indicated in with a red box. The columns to the right of the anchor are all children and subchildren. The columns to the left are all parents and grandparents. You can "re-anchor" the explorer on another node by pressing space. And that's basically it. Imagine having different types of nodes in the graph that you could filter on. Imagine exploring music and the playlists they live in.

To run this project, `npm install && npm start`.

# To Do

- Parent columns are the backlinks. Should render the parent path as well.
- 35878 parent missing.