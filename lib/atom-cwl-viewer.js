'use babel'

/* global atom */

import {CompositeDisposable} from 'atom'
import url from 'url'
import config from './config.json'

export {activate, deactivate, config}

const ATOM_CWL_VIEWER_URI_PROTOCOL = 'atom-cwl-viewer:'
let AtomCWLViewerView
let disposables

function createAtomCWLViewerView (editorId) {
  if (!AtomCWLViewerView) {
    AtomCWLViewerView = require('./atom-cwl-viewer-view')
  }
  return new AtomCWLViewerView(editorId)
}

atom.deserializers.add({
  name: 'AtomCWLViewerView',
  deserialize: (state) => createAtomCWLViewerView(state.editorId)
})

function activate (state) {
  disposables = new CompositeDisposable()
  disposables.add(atom.commands.add('atom-workspace', {
    'atom-cwl-viewer:toggle': toggle
  }))

  disposables.add(atom.workspace.addOpener(AtomCWLViewerOpener))
}

function deactivate () {
  disposables.dispose()
}

function toggle () {
  if (isAtomCWLViewerView(atom.workspace.getActivePaneItem())) {
    atom.workspace.destroyActivePaneItem()
    return
  }

  const editor = atom.workspace.getActiveTextEditor()
  if (!editor) return

  const grammars = atom.config.get('atom-cwl-viewer.grammars') || []
  if (grammars.indexOf(editor.getGrammar().scopeName) === -1) return

  const uri = createAtomCWLViewerUri(editor)
  const viewer = atom.workspace.paneForURI(uri)

  if (!viewer) addViewerForUri(uri)
  else viewer.destroyItem(viewer.itemForURI(uri))
}

function addViewerForUri (uri) {
  const prevActivePane = atom.workspace.getActivePane()
  const options = { searchAllPanes: true }

  if (atom.config.get('atom-cwl-viewer.openInSplitPane')) {
    options.split = 'right'
  }

  atom.workspace.open(uri, options).then((view) => prevActivePane.activate())
}

function createAtomCWLViewerUri (editor) {
  return ATOM_CWL_VIEWER_URI_PROTOCOL + '//editor/' + editor.id
}

function AtomCWLViewerOpener (uri) {
  let parsedUri

  try {
    parsedUri = url.parse(uri)
  } catch (err) { return }

  if (parsedUri.protocol !== ATOM_CWL_VIEWER_URI_PROTOCOL) return

  const editorId = parsedUri.pathname.substring(1)
  return createAtomCWLViewerView(editorId)
}

function isAtomCWLViewerView (object) {
  if (!AtomCWLViewerView) {
    AtomCWLViewerView = require('./atom-cwl-viewer-view')
  }
  return object instanceof AtomCWLViewerView
}
