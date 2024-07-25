
const previewNotes = `ArrowVortex:notes:!"=J[(]]*k"p"]@!?_Fh""8[L8-/fK!]^?DJOi<6Jk/E8!`


const viewOptions = {
  "chart.speed": 400,
  "chart.CMod": false,
  "chart.reverse": false,
  "chart.waveform.enabled": false,
  "chart.zoom": 1.3,
  "chart.receptorYPos": -250,
  "chart.maxDrawBeats": 20,
  "chart.maxDrawBeatsBack": 10,
  "chart.drawNoteFlash": true,
  "chart.drawIcons": true,
  "chart.noteLayout.enabled": false,
  "chart.npsGraph.enabled": false,
  "debug.showFPS": false,
  "debug.showTimers": false,
  "debug.showScroll": false,
  "play.offset": 0,
  "play.visualOffset": 0,
}

const imageOptions = {
  xPadding: 10,
  aspectRatio: 9/21,
  exportWidth: 450,
}

async function generateNoteskinPreview(gameType, skinName, notes = previewNotes) {
  if (!gameType || !skinName) {
    throw "No gameType/skinName provided!"
  }

  const cm = window.app.chartManager
  const sm = cm.loadedSM
  if (!sm) {
    throw "Please load an SM file first"
  }
  const chart = cm.loadedChart
  if (!sm) {
    throw "Please load a chart first"
  }

  const oldSkin = app.options.chart.noteskin
  const oldLastSkin = app.options.chart.lastNoteskins[gameType]

  // Create new chart
  const newChart = new chart.constructor(sm)
  newChart.gameType = window.GameTypeRegistry.getGameType(gameType)
  if (newChart.gameType === undefined) {
    throw "Invalid game type"
  }
  sm.addChart(newChart)
  await cm.loadChart(newChart)
  const playing = app.chartManager.getAudio().isPlaying()
  if (playing) {
    cm.playPause()
  }
  cm.setBeat(0)

  Object.keys(newChart.sm.timingData.columns).forEach(key => {
    newChart.timingData.columns[key] = {type: key, events: []}
  })
  newChart.timingData.reloadCache()

  // Paste notes
  cm.pasteNotes(notes)
  cm.clearSelections()

  // Cache the options

  const optionsCache = Object.keys(viewOptions).map(key => {
    return [key, window.app.options.getOption(key)]
  })

  // Apply options

  const cv = cm.chartView
  cv.swapNoteskin(skinName)

  Object.entries(viewOptions).map(opt => {
    window.app.options.applyOption(opt)
  })

  cv.barlines.alpha = 0
  cv.previewArea.alpha = 0
  cv.snapDisplay.alpha = 0

  cm.mode = 'View Mode'
  document.getElementById("status-widget").style.visibility = "hidden"
  document.getElementById("waterfall").style.visibility = "hidden"
  document.body.classList.remove("animated")

  // Wait for the noteskin to load
  await new Promise(resolve => {
    setTimeout(() => resolve(), 400)
  })

  // Render the image
  window.app.renderer.render(window.app.stage)
  const blob = await new Promise(resolve => window.app.view.toBlob(resolve));

  // Load the image
  const url = URL.createObjectURL(blob)

  const image = document.createElement("img")
  image.src = url
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  const notefieldWidth = newChart.gameType.notefieldWidth

  const imgSourceWidth = (notefieldWidth + imageOptions.xPadding * 2) * 1.3 * window.app.options.performance.resolution
  const imgSourceHeight = imgSourceWidth / imageOptions.aspectRatio

  const cw = app.view.width / window.app.options.performance.resolution
  const ch = app.view.height / window.app.options.performance.resolution

  canvas.width = imageOptions.exportWidth
  canvas.height = imageOptions.exportWidth / imageOptions.aspectRatio

  document.body.appendChild(image)
  document.body.appendChild(canvas)

  await new Promise(resolve => {
    image.onload = () => resolve()
  })

  ctx.fillStyle = "#18191c"

  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.drawImage(image,
    cw - imgSourceWidth / 2, ch - imgSourceHeight / 2,
    imgSourceWidth, imgSourceHeight, 0, 0, canvas.width, canvas.height
  )

  const croppedBlob = await new Promise(resolve => canvas.toBlob(resolve));

  const a = document.createElement("a")
  document.body.appendChild(a)
  const croppedUrl = URL.createObjectURL(croppedBlob)
  a.href = croppedUrl
  a.download = `${skinName}.png`
  a.click()
  a.remove()

  URL.revokeObjectURL(url)
  URL.revokeObjectURL(croppedUrl)

  canvas.remove()
  image.remove()


  // Revert options

  cv.barlines.alpha = 1
  cv.previewArea.alpha = 1
  cv.snapDisplay.alpha = 1

  cm.mode = 'Edit Mode'
  document.getElementById("status-widget").style.visibility = ""
  document.getElementById("waterfall").style.visibility = ""
  optionsCache.forEach(opt => {
    window.app.options.applyOption(opt)
  })

  document.body.classList.toggle("animated", window.app.options.general.smoothAnimations)

  sm.removeChart(newChart)
  cm.loadChart(chart)
  window.app.chartManager.chartView.swapNoteskin(oldSkin.name)
  app.options.chart.lastNoteskins[gameType] = oldLastSkin
  if (playing) {
    cm.playPause()
  }
}

async function generateAllPreviews(gameType, notes = previewNotes) {
  const noteskins = window.NoteskinRegistry.getNoteskins().get(gameType).keys()
  for (const skin of noteskins) {
    await generateNoteskinPreview(gameType, skin, notes)
  }
}