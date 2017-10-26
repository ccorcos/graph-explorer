# Graph Explorer

This is a prototype for a generalized graph explorer. Think of it like Apple's Finder but it works on graphs, not just trees.

The current demo uses a graph of code dependencies.

**Explanation:** The explorer starts with an anchor column with a selected item indicated in with a red box. The columns to the right of the anchor are all children and subchildren. This should feel like a typical file system. The folumns to the left are all parents and grandparents. This prototype starts at the entry point to the program so there are no parents. But you can re-anchor the explorer on another file by pressing space. And that's basically it. Imagine having different types of nodes in the graph that you could filter on. Imagine exploring music and the playlists they live in.
