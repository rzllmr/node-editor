# Releases

:small_blue_diamond: __NEW__: Drag & drop images to create image notes
> Image notes can be created via drag & drop of an image file onto the board or an empty note. That note's aspect ratio is then constrained to that of the image and can only be resized accordingly. To change the image you can drag another file onto it and to remove it use the 'x' button in the upper right corner. All images are referenced with a relative path to the file, so they can be moved along with the project to stay intact.

:small_blue_diamond: __NEW__: Copy/cut & paste notes
> Selected notes, be it single or multiple, can be cut ('ctrl'/'meta' + 'x') or copied cut ('ctrl'/'meta' + 'c') to pasted ('ctrl'/'meta' + 'v') some where else, even another board. For that the mouse pointer will mark the center of the inserted note collection.

:small_blue_diamond: __NEW__: Copy/cut & paste note content
> ⚠ **WIP**: Works in its most basic form, but is currently still work in progress.

:small_blue_diamond: __NEW__: Create note at mouse position with 'ctrl'/'meta' + 'n'

:small_blue_diamond: __NEW__: Delete link with 'backspace'/'delete'

:small_orange_diamond: __IMPROVED__: Implement user-oriented terminology
> Replaced common terms like node -> note and graph -> link.

:small_orange_diamond: __IMPROVED__: Allow moving/resizing beyond window borders

:small_orange_diamond: __IMPROVED__: Resize all selected notes synchronously

:small_orange_diamond: __IMPROVED__: Use theme colors for text selection

:small_red_triangle: __FIXED__: Prevent board actions interfering with menu or mini-map

:small_red_triangle: __FIXED__: Reset tree-view hovering on project change

:small_red_triangle: __FIXED__: Use command key '⌘' on Mac instead of 'ctrl'

:small_red_triangle: __FIXED__: Sync link highlighting consistently

## 0.1.126 (preliminary)

:small_blue_diamond: __NEW__: Create tags in text with '#'
> Tags are highlighted with a color and interpreted as a reference to other boards, so that a click on it switches the current view. If that board is not present yet it will be newly created. And a tag can specify a board with a full or relative path of the board tree if the name itself is ambiguous or you want to create the folders along with it.

:small_blue_diamond: __NEW__: Toggle type of link end with 'shift' + 'right click'
> This enables equal links without a direction, that would be highlighted in blue.

:small_blue_diamond: __NEW__: Use modifier keys to complement single mouse button
> The 'right click' can be emulated by 'alt' + 'left click' and the 'middle click' by 'ctrl' + 'left click'.

:small_blue_diamond: __NEW__: Minimize notes with menu button

:small_blue_diamond: __NEW__: Toggle help panel panel with the '?' menu button

:small_blue_diamond: __NEW__: Resize note to fit label on editing

:small_blue_diamond: __NEW__: Implement some basic hotkeys
> Toggle theme: 't', create note: 'insert', delete selection: 'delete'/'backspace' and exit input: 'escape'.

:small_orange_diamond: __IMPROVED__: Enforce unique names in a board tree folder
> Items of different type, board and folder, can still have the same name.

:small_orange_diamond: __IMPROVED__: Overhaul menu structure and make it collapsable

:small_orange_diamond: __IMPROVED__: Enlarge details font and some elements

:small_orange_diamond: __IMPROVED__: Use outline variant for all tool icons

:small_orange_diamond: __IMPROVED__: Use only one save button in menu
> It is handled as 'save as ...', while a quick overwrite is done with 'ctrl'/'meta' + 's'. 

:small_orange_diamond: __IMPROVED__: Remember latest path in open/save dialogs

:small_orange_diamond: __IMPROVED__: Adjust light theme colors and add warm tint

:small_orange_diamond: __IMPROVED__: Adjust font settings to themes

:small_orange_diamond: __IMPROVED__: Move across background in cursor direction with 'shift' + 'middle click'

:small_orange_diamond: __IMPROVED__: Exit editing note details with 'ctrl' + 'enter'

:small_orange_diamond: __IMPROVED__: Reduce size minimum for notes

:small_red_triangle: __FIXED__: Make line breaks in text save/load persistent

:small_red_triangle: __FIXED__: Save renamed boards by their new name

:small_red_triangle: __FIXED__: Ignore menu and minimap during board actions

:small_red_triangle: __FIXED__: Fix direction highlighting for multi-selection

:small_red_triangle: __FIXED__: Fix cursor offset for resizing notes

:small_red_triangle: __FIXED__: Adjust formatting in board tree view

:small_red_triangle: __FIXED__: Restrict moving and deleting a sole board in tree view

:small_red_triangle: __FIXED__: Deselect boards on deletion in tree view

:small_red_triangle: __FIXED__: Make new boards invisible first

:small_red_triangle: __FIXED__: Replace default text editing with custom handling

:small_red_triangle: __FIXED__: Ignore special keys that act unintentionally
> Those are 'home', 'end', 'pageup' and 'pagedown'.

## 0.1.35

:small_blue_diamond: __NEW__: Create note with double 'left click'
> The new note is composed of a title, a description and a colored divider.

:small_blue_diamond: __NEW__: Create links by dragging from one note to the other
> Holding 'right click' and dragging from one note another will create a link. Where the graph starts and ends is determined by the sides the mouse leaves one and enters the other note. If there are multiple links on the same side those are evenly distributed. And to sever a link again you grab one anchor of the link with 'right click', drag it out and release the mouse button somewhere on the board.

:small_blue_diamond: __NEW__: Create a comment on a link with 'double click'
> Hovering over a link highlights it, so you can create a sign on it with double 'left click' to comment the connection with.


:small_blue_diamond: __NEW__: Select one or multiple notes
> A single selection is done with a 'left click' and multi-selection with 'ctrl' + 'left click'. It can also be done by dragging a rectangle over the notes to select. To deselect everything you click somewhere on the board.

:small_blue_diamond: __NEW__: Move selected notes synchronously

:small_blue_diamond: __NEW__: Highlight links of selected notes according to direction
> Incoming links are green, outgoing red and those inbetween two selected notes yellow.

:small_blue_diamond: __NEW__: Colorize selected notes with a picker in the menu
> All colors used by some notes are listed below the picker, so you can easily re-use them. New notes automatically get the color used last.

:small_blue_diamond: __NEW__: Edit note content with double 'left click'
> To leave the editing you can hit 'escape' or click somewhere outside the note.

:small_blue_diamond: __NEW__: Resize note with handle in the lower right corner

:small_blue_diamond: __NEW__: Outline all notes of the board in mini-map
> With the mini-map in the lower right corner of the window you can quickly navigate to certain parts of the board by clicking there on the mini-map with 'left click'. Selected notes' highlights are also reflected along with the direction colors.

:small_blue_diamond: __NEW__: Manage multiple boards in a tree-view with folders
> Besides the default first board you can create new ones, rename and delete them in the menu panel. The tree-view also allows to group them with folders and lets you quickly switch between them with 'left click'.

:small_blue_diamond: __NEW__: Save and load elements of all boards to file
> With a button for 'Save as' and 'Save' in the menu's tool bar. The file format is json.


:small_blue_diamond: __NEW__: Zoom board to mouse cursor with scroll wheel
> The current zoom level in percent is displayed in the lower right corner of the mini-map.

:small_blue_diamond: __NEW__: Move around a large board by grabbing it with 'middle click'

:small_blue_diamond: __NEW__: Set clean style in dark and light theme

# Commit history

_The history is regulary updated but lacks some of the latest commits._

### Change categories

- ★ feat - _A feature added to the application_
- ⚠ fix - _A bug fix or adjustment to intent_
- ✳ style - _A feature or update related to styling_
- ♲ refactor - _Refactoring in a section of the codebase_
- ☑ test - _Everything related to testing_
- ❏ docs - _Everything related to documentation_
- ⚐ scm - _Everything related to source control management_

\#  | Hash    |   | Message | Specifics
---:|---------|:-:|---------|----------
150 | 05947c6 | ⚠ | Update height on automatic scaling for label <!----> | branch: develop
149 | 2d29ea3 | ⚠ | Hide overlapping anchors behind image
148 | febe852 | ★ | Create image nodes when dropped on board
147 | 464f35c | ⚠ | Fix relative image paths with backslashes
146 | bf05e10 | ★ | Add support for image nodes
145 | e63f828 | ❏ | Add App icon for Mac builds
144 | 1687d7a | ⚠ | Reset hovered tree-view item on project change
143 | 5785b28 | ★ | Break long words anywhere with hyphens
142 | ef3aac7 | ★ | Delete hovered graph with backspace/delete
141 | 37cf25e | ★ | Support cut/copy & paste for node content
140 | e1ddd26 | ✳ | Brighten faded highlight color
139 | 3842521 | ✳ | Use custom color for text selection
138 | 08e381b | ⚠ | Interpret meta key as ctrl
137 | a0fa535 | ★ | Create node at mouse position with ctrl+n
136 | dd3cecd | ★ | Copy/cut & paste elements through global clipboard
135 | 7618708 | ♲ | Use properties term for export/import
134 | 13d7e1d | ★ | Insert node at mouse position with ctrl+v
133 | 61c951e | ♲ | Define requireds and defaults for import
132 | ec3affb | ⚠ | Disable menu and minimap events during board actions
131 | 1628f68 | ⚠ | Make graph hover effect not vary .selected
130 | 18391a3 | ⚠ | Resize all selected nodes and enable off-window events
129 | b689e28 | ⚠ | Highlight links on connection and severing
128 | 24874ca | ✳ | Use user-friendly terminology for ui
127 | bc7811c | ❏ | Update preview image with new font size
126 | 9593c61 | ♲ | Inherit font weight for link text <!----> | dist: 1.0.126
125 | 0b4b93d | ★ | Resize node to fit label on editing
124 | f43dcd2 | ✳ | Add spacing to menu and enlarge buttons
123 | 261f82d | ✳ | Increase details font size
122 | 6315ca0 | ✳ | Do not color source anchors on highlighting
121 | d41980e | ✳ | Make Graphs more prominent
120 | 10b0ac4 | ♲ | Update dependencies to latest minor versions
119 | dbf0519 | ★ | Remember current file path in open/save dialogs
118 | ba40d8b | ⚠ | Fix direction highlighting for multi-selection
117 | ab76ef5 | ⚠ | Recognize absolute paths in links again
116 | 7c52475 | ✳ | Reduce size minimum for nodes
115 | 290042a | ❏ | Update README to reflect latest product state
114 | a1b7dfa | ⚠ | Ignore menu and minimap during board interactions
113 | 8e8ce09 | ★ | Add back grab movement as default
112 | 86fb66d | ❏ | Fix sticky downloads bar on website
111 | c754fa4 | ❏ | Update window preview on website
110 | 90c6b39 | ❏ | Add vector graphic for network background
109 | d5518e8 | ❏ | Adjust existing website elements
108 | 4e20bde | ❏ | Redesign website's head section
107 | 4a82190 | ❏ | Add sample images to website
106 | 63ddfda | ❏ | Complete general website structure
105 | 66f7105 | ❏ | Update tool website with previews
104 | 99a5463 | ❏ | Set up incomplete tool website
103 | 2f608f2 | ★ | Enable minimizing Nodes from menu
102 | bc077b9 | ⚠ | Disable deletion tool for only board in tree view
101 | 80b9374 | ✳ | Change remaining tool icons to outline variant
100 | 23788d2 | ✳ | Turn warm tint down a bit
 99 | 60aad5d | ♲ | Add slight warmth to colors and refactor variables
 98 | 5562dcc | ⚠ | Handle linebreaks in editable div
 97 | 7d8cd37 | ⚠ | Restrict moving the last tree-view item
 96 | b657187 | ⚠ | Handle caret on focus of editable div
 95 | ceae02a | ★ | Enable node deletion with 'backspace' key
 94 | d5de6d1 | ✳ | Lighten background for themes
 93 | dc9e3ba | ✳ | Adapt minimap colours to theme
 92 | a348608 | ✳ | Change colours of menu elements
 91 | 3f81502 | ✳ | Adjust colours for light theme
 90 | c3f2001 | ⚐ | Merge branch 'develop' into feature/design_overhaul
 89 | 78c9903 | ★ | Overhaul the menu structure and make it collapsable
 88 | a05d96c | ★ | Use only one save button
 87 | 128dd9b | ⚐ | Merge pull request #16 from rzllmr/feature/board_links
 86 | 9449be7 | ♲ | Regard lastType in createItemAtPath() changes
 85 | e87f8f5 | ⚠ | Enforce unique names only for same type
 84 | 63dd85d | ⚠ | Revert to default caret handling on focus
 83 | 6a57ac5 | ★ | Enable links in signs
 82 | 4d09cfa | ♲ | Store Graph end types in file
 81 | a8a2b64 | ⚠ | Fix boardId getter for Graph class
 80 | 669f4d7 | ♲ | Use running numbers for unique board ids
 79 | bb4d824 | ★ | Support sub-paths for links
 78 | 6b56c39 | ⚠ | Ignore '#' and multiple consecutive '/' in emphasis
 77 | 0d695e0 | ⚠ | Adjust position for board deletion prompt
 76 | 0d0496b | ♲ | Ignore some special keys and revise key handling
 75 | 228902b | ♲ | Surround emphasis with "empty" text nodes
 74 | 8cbc62f | ♲ | Adjust import/export of label to editable div
 73 | bf2240c | ⚐ | Merge branch 'develop' into feature/board_links
 72 | 8d73d2f | ★ | Exit editing node details with Ctrl+Enter
 71 | 766df11 | ★ | Make labels editable divs to enable links
 70 | 4feceb2 | ♲ | Respect node id 0 for update of Board.nodeIdxMax
 69 | ede747a | ⚠ | Use new name when saving renamed boards
 68 | f6cfb24 | ⚠ | Deselect boards on deletion
 67 | 582c5bf | ⚠ | Make new boards invisible first
 66 | d9bb8c2 | ★ | Enforce unique names in a folder of treeview
 65 | 0e23e47 | ⚠ | Setup link triggers when loading from file
 64 | a0c9858 | ♲ | Replace uses of createItem() with createItemAtPath()
 63 | e350a1a | ★ | Allow board creation from link paths
 62 | 676fa1b | ♲ | Move expand function to TreeItem
 61 | 2ea0336 | ★ | Rename associated links along with a board
 60 | 7e551b1 | ⚠ | Fix formatting for renaming boards
 59 | caa120e | ✳ | Rename color picker without dash
 58 | be8a471 | ♲ | Hand in emphasis click function from Node
 57 | 44d0040 | ♲ | Manage all emphasis editing cases in DivEdit class
 56 | fa56574 | ★ | Change to (new) board for clicked link
 55 | 1a831c4 | ★ | Create emphasized text in details with '#'
 54 | 85a96d4 | ⚠ | Prevent general hotkeys for editing signs <!----> | branch: master
 53 | f265a3b | ⚐ | Merge pull request #15 from feature/toggle_anchors
 52 | a49bd7f | ★ | Add highlighting for equal links
 51 | 3937876 | ★ | Toggle anchor icon on click
 50 | bad6e73 | ⚐ | Merge pull request #14 from feature/help_panel
 49 | 82bbb00 | ⚐ | Merge branch 'master' into feature/help_panel
 48 | bf34aed | ⚐ | Merge pull request #13 from feature/key_bindings
 47 | 2d64c63 | ★ | Add a toggleable panel with helping instructions
 46 | ac8d763 | ★ | Move around canvas along cursor direction
 45 | 7c535e7 | ♲ | Replace implementation of linebreaks in description divs
 44 | 2707f10 | ★ | Implement some basic hotkey events
 43 | f8b4a7f | ★ | Use modifier keys to complement single mouse button
 42 | 0cd163c | ✳ | Use different font settings for light and dark mode
 41 | 1489e8f | ⚠ | Fix #2 - Resizing node cursor offset
 40 | d500704 | ⚠ | Fix #4 - Newlines not save persistent
 39 | 76c804c | ♲ | Update dialog calls in filehandler
 38 | 8798d9d | ♲ | Update dependencies
 37 | 00c85e8 | ♲ | Move remaining js files to scripts
 36 | 34c404b | ⚠ | Fix paths in README
 35 | 8f1985b | ♲ | Hide dev tools for packaged app <!----> | tag: v0.1.35
 34 | 19d8210 | ❏ | Add GitHub meta files
 33 | 10b99ec | ♲ | Include fonts and background texture
 32 | f7cdf44 | ♲ | Replace font-awesome v5.8 by v4.7
 31 | f981b96 | ⚠ | Handle loading files with wrong item order
 30 | fa4c9b9 | ⚠ | Restore line breaks on loaded files
 29 | 0011982 | ✳ | Decrease node text font size while maintaining readability
 28 | ddaa11f | ★ | Enable saving/loading all boards' contents
 27 | 50a1116 | ⚠ | Update node position in corresponding mini-map
 26 | 28809b4 | ★ | Highlight only selectable leaf items in tree-view
 25 | a2ce567 | ❏ | Add application icon
 24 | 3e4d5f4 | ★ | Allow for multiple boards managed by the tree-view
 23 | db007e5 | ★ | Add editable tree view for menu panel
 22 | b83c37a | ★ | Make color selection part of the menu
 21 | 166abb6 | ★ | Create new board and save as specific file
 20 | e508943 | ★ | Add color selection menu for node divider
 19 | 91c39fe | ⚠ | Move selected nodes synchronously
 18 | 04d8d75 | ★ | Zoom board with mouse cursor in focus
 17 | 33c30da | ★ | Highlight links to selection according to direction
 16 | 08926c7 | ★ | Outline complete desk in minimap
 15 | 07f4df4 | ★ | Save and load elements to file
 14 | d374ce7 | ★ | Draw rectangle for selection by dragging on background
 13 | 14f33c6 | ✳ | Set clean style for dark and light theme
 12 | e39cc02 | ★ | Handle single and multi-selections of elements
 11 | b94bfaa | ♲ | Integrate linking capability to graph of an anchor
 10 | 72c0d44 | ★ | Create graph signs with double click
  9 | 813c8a7 | ★ | Enlarge desk space and move it around by grabbing
  8 | 3a69a93 | ★ | Make nodes resizable by custom handle in the corner
  7 | c3c30ad | ★ | Distribute links to separate anchors on node side
  6 | 934f3a8 | ♲ | Refactor and comment anchor
  5 | d10e5e6 | ★ | Create links by dragging from one node side to another
  4 | c747575 | ★ | Make node content editable on double click
  3 | 138655f | ★ | Use cubic bezier curve to represent links
  2 | 27e10e0 | ♲ | Encapsulate elements to classes with a method to destroy
  1 | ccf84cb | ⚐ | Initial commit
