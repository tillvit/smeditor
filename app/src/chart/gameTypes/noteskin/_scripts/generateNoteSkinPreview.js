
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


async function generateNoteSkinPreview(gameType, skinName, notes = previewNotes) {
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
  const oldSkin = app.options.chart.noteskin
  const oldLastSkin = app.options.chart.lastNoteSkins[gameType]
  cv.swapNoteSkin(skinName)

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


  return new Promise(resolve => {
    setTimeout(() => {
      window.app.renderer.render(window.app.stage)
      app.view.toBlob(blob => {
        const a = document.createElement("a")
        document.body.appendChild(a)
        const url = URL.createObjectURL(blob)
        a.href = url
        a.download = `${skinName}.png`;
        a.click()
        URL.revokeObjectURL(url)

        // Revert options
        a.remove()
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
        window.app.chartManager.chartView.swapNoteSkin(oldSkin.name)
        app.options.chart.lastNoteSkins[gameType] = oldLastSkin
        if (playing) {
          cm.playPause()
        }
        resolve()
      })
    }, 1000)
  })

}

async function generateAllPreviews(gameType, notes = previewNotes) {
  const noteskins = window.NoteSkinRegistry.getNoteSkins().get(gameType).keys()
  for (const skin of noteskins) {
    await generateNoteSkinPreview(gameType, skin, notes)
  }
}