import {
  BitmapText,
  Color,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js"
import { BaseTimelineWidget } from "../../../gui/widget/timeline/BaseTimelineWidget"
import { BetterRoundedRect } from "../../../util/BetterRoundedRect"
import { blendPixiColors } from "../../../util/Color"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import {
  FEET_LABELS,
  Foot,
  Row,
  TECH_ERROR_STRINGS,
  TECH_STRINGS,
} from "../../stats/parity/ParityDataTypes"
import { ParityDebugData } from "../../stats/parity/ParityWebWorkerTypes"

interface ConnectionObject extends Container {
  text: BitmapText
  bg: BetterRoundedRect
}

interface NodeObject extends Container {
  activate: () => void
  deactivate: () => void
  connections: Container<ConnectionObject>
  bg: BetterRoundedRect
  letters: BitmapText[]
  detail: BitmapText
}

interface DebugObject extends Container {
  text: BitmapText
  update: (parityData: ParityDebugData) => string
}

interface RowObject extends Container {
  hitbox: Sprite
  text: BitmapText
  detail: BitmapText
  sideContainer: Container
  nodePool: DisplayObjectPool<NodeObject>
  statusRows: Sprite[][]
  highlights: { col: number; second: number; box: DetailBox }[]
  i: number
}

interface DetailBox extends Container {
  text: BitmapText
  background: Sprite
}

const ROW_DETAILS = {
  fakeMines: {
    boxTint: 0x575757,
    boxOpacity: 0.5,
    textTint: 0xd8d8d8,
    text: "FM",
  },
  mines: { boxTint: 0x693030, boxOpacity: 0.3, textTint: 0xe03434, text: "M" },
  holds: { boxTint: 0x1f4a17, boxOpacity: 0.6, textTint: 0x53d63c, text: "H" },
  holdTails: {
    boxTint: 0x114663,
    boxOpacity: 0.6,
    textTint: 0xb1d7fa,
    text: "HT",
  },
}

export const PARITY_COLORS: Record<Foot, number> = {
  [Foot.NONE]: 0xffffff,
  [Foot.LEFT_HEEL]: 0x0390fc,
  [Foot.LEFT_TOE]: 0x81b5de,
  [Foot.RIGHT_HEEL]: 0xfcad03,
  [Foot.RIGHT_TOE]: 0xf0d190,
}

export class ParityDebug extends Container implements ChartRendererComponent {
  private renderer: ChartRenderer
  private chartDirty = false
  private lastVisible = false

  private debugTexts: DebugObject[] = []
  private debugContainer: Container = new Container()
  private debugBG: Sprite = new Sprite(Texture.WHITE)

  private connections: Graphics = new Graphics()

  private rowMap: Map<Row, RowObject> = new Map()
  private rowPool = new DisplayObjectPool({
    create: () => {
      const newChild = new Container() as RowObject
      const sideContainer = new Container()
      const nodePool = new DisplayObjectPool<NodeObject>({
        create: () => {
          const newChild = new Container() as NodeObject
          const bg = new BetterRoundedRect()
          newChild.addChild(bg)
          newChild.bg = bg
          newChild.letters = []

          let textWidth = 0
          let textHeight = 0
          for (let j = 0; j < this.renderer.chart.getColumnCount(); j++) {
            const text = new BitmapText("", {
              fontName: "Mono",
              fontSize: 13,
            })
            if (!text) continue
            text.alpha = 0
            text.anchor.set(0, 0.5)
            text.x = textWidth
            newChild.addChild(text)
            textWidth += text.width
            textHeight = Math.max(textHeight, text.height)
            newChild.letters.push(text)
          }

          bg.width = textWidth + 10
          bg.height = textHeight + 5
          bg.pivot.set(bg.width / 2, bg.height / 2)

          newChild.letters.forEach(text => {
            text.x -= textWidth / 2
          })

          const detail = new BitmapText("", {
            fontName: "Mono",
            fontSize: 10,
          })
          detail.anchor.set(0.5, 1)
          detail.y -= bg.height / 2 + 5
          detail.visible = false
          newChild.detail = detail
          newChild.addChild(detail)
          newChild.alpha = 0.8

          const connectionsContainer = new Container<ConnectionObject>()
          newChild.connections = connectionsContainer
          newChild.addChild(connectionsContainer)

          return newChild
        },
      })
      nodePool.sortableChildren = true

      const text = new BitmapText("", {
        fontName: "Main",
        fontSize: 35,
      })
      text.tint = 0xff85d2
      text.anchor.set(1, 0.5)

      const detail = new BitmapText("", {
        fontName: "Main",
        fontSize: 15,
      })
      detail.tint = 0xff85d2
      detail.anchor.set(1, 0.5)
      detail.align = "right"
      detail.eventMode = "none"
      detail.visible = false
      detail.text = ""

      const hitbox = new Sprite(Texture.WHITE)
      hitbox.tint = 0xffffff
      hitbox.anchor.set(1, 0.5)
      hitbox.width = text.width + 10
      hitbox.height = text.height + 10
      hitbox.alpha = 0
      hitbox.eventMode = "static"

      sideContainer.addChild(hitbox, text, detail)
      newChild.addChild(sideContainer, nodePool)

      newChild.hitbox = hitbox
      newChild.text = text
      newChild.i = 0
      newChild.detail = detail
      newChild.sideContainer = sideContainer
      newChild.nodePool = nodePool
      newChild.highlights = []
      newChild.statusRows = []

      for (let row = 0; row < Object.keys(ROW_DETAILS).length - 1; row++) {
        const statusRow: Sprite[] = []
        for (let i = 0; i < this.renderer.chart.getColumnCount(); i++) {
          const box = new Sprite(Texture.WHITE)
          box.width = 10
          box.height = 10
          box.anchor.set(1, 0.5)
          box.y = (row - (Object.keys(ROW_DETAILS).length - 1) / 2) * 12 + 5
          box.visible = true
          sideContainer.addChild(box)
          statusRow.push(box)
        }
        newChild.statusRows.push(statusRow)
      }

      return newChild
    },
  })
  private activeNode?: NodeObject

  constructor(renderer: ChartRenderer) {
    super()
    this.visible = true
    this.renderer = renderer

    this.addChild(this.connections)
    this.addChild(this.rowPool)

    this.debugBG.anchor.set(0, 1)
    this.debugBG.alpha = 0.6
    this.debugBG.tint = 0
    this.addChild(this.debugBG)
    this.addChild(this.debugContainer)
    this.rowPool.sortableChildren = true

    const parityListener = () => {
      this.debugTexts.forEach(debugObject => {
        const parityData = this.renderer.chart.stats.parity?.debug
        if (!parityData) return
        debugObject.text.text = debugObject.update(parityData)
      })
      this.chartDirty = true
    }

    const optionListener = (id: string) => {
      if (id == "experimental.parity.limitGraph") {
        this.chartDirty = true
      }
    }

    const deselect = () => {
      if (this.activeNode) {
        this.activeNode.deactivate()
        this.activeNode = undefined
      }
    }

    this.createDebugObject(0xff85d2, parityData => {
      return `Updated ${parityData.stats.lastUpdatedRowEnd - parityData.stats.lastUpdatedRowStart} rows in ${parityData.stats.rowUpdateTime.toFixed(3)}ms`
    })

    this.createDebugObject(0xa8ff6e, parityData => {
      return `Created ${parityData.stats.createdNodes} nodes and ${parityData.stats.createdEdges} edges in ${parityData.stats.nodeUpdateTime.toFixed(3)}ms`
    })

    this.createDebugObject(0x63c9ff, parityData => {
      return `Calculated ${parityData.stats.calculatedEdges} costs (${parityData.stats.cachedEdges} cached) in ${parityData.stats.edgeUpdateTime.toFixed(3)}ms (cache size ${parityData.edgeCacheSize})`
    })

    this.createDebugObject(0xff9a5c, parityData => {
      return `Found best path in ${parityData.stats.pathUpdateTime.toFixed(3)}ms (cached ${parityData.stats.cachedBestRows} rows)`
    })
    this.createDebugObject(0xeeff6b, parityData => {
      return `Calculated row states in ${parityData.stats.rowStatsUpdateTime.toFixed(3)}ms`
    })

    this.createDebugObject(0xffffff, parityData => {
      return `Total calculation time: ${(
        parityData.stats.rowUpdateTime +
        parityData.stats.nodeUpdateTime +
        parityData.stats.edgeUpdateTime +
        parityData.stats.pathUpdateTime +
        parityData.stats.rowStatsUpdateTime
      ).toFixed(3)}ms`
    })
    this.createDebugObject(0xeb4034, parityData => {
      return `Debug data serialization time: ${(
        this.renderer.chart.stats.parity!.debugTime -
        (parityData.stats.rowUpdateTime +
          parityData.stats.nodeUpdateTime +
          parityData.stats.edgeUpdateTime +
          parityData.stats.pathUpdateTime)
      ).toFixed(3)}ms`
    })

    EventHandler.on("parityModified", parityListener)
    EventHandler.on("userOptionUpdated", optionListener)
    this.renderer.on("pointerdown", deselect)
    this.on("destroyed", () => {
      EventHandler.off("parityModified", parityListener)
      EventHandler.off("userOptionUpdated", optionListener)
      this.renderer.off("pointerdown", deselect)
    })
  }

  update(firstBeat: number, lastBeat: number) {
    const parityData = this.renderer.chart.stats.parity!
    this.visible = !!parityData && Options.experimental.parity.enabled
    if (!this.visible) {
      if (this.lastVisible != this.visible) {
        this.rowMap.clear()
        this.rowPool.destroyAll()
        this.lastVisible = this.visible
      }
      return
    }
    this.lastVisible = this.visible

    if (this.chartDirty) {
      this.rowMap.clear()
      this.rowPool.destroyAll()
      this.chartDirty = false
    }

    const LEFT_SAFE = -this.renderer.chartManager.app.STAGE_WIDTH / 2
    const LEFT_MID_SAFE =
      -this.renderer.chart.gameType.notefieldWidth / 2 +
      Options.chart.receptorXPos
    const RIGHT_MID_SAFE =
      this.renderer.chart.gameType.notefieldWidth / 2 +
      Options.chart.receptorXPos
    const RIGHT_SAFE =
      this.renderer.chartManager.app.STAGE_WIDTH / 2 -
      BaseTimelineWidget.getTotalWidgetWidth()

    const LEFT_WIDTH = LEFT_MID_SAFE - LEFT_SAFE
    const RIGHT_WIDTH = RIGHT_SAFE - RIGHT_MID_SAFE

    const align = LEFT_WIDTH > RIGHT_WIDTH + 100 ? "left" : "right"

    // Create all missing rows
    for (let i = 0; i < parityData.debug.notedataRows.length; i++) {
      if (lastBeat < parityData.debug.notedataRows[i - 1]?.beat) break
      if (firstBeat > parityData.debug.notedataRows[i + 1]?.beat) continue
      const row = parityData.debug.notedataRows[i]
      const hasOverrides = row.overrides.some(o => o)

      if (!this.rowMap.has(row)) {
        const rowObj = this.rowPool.createChild()
        if (!rowObj) break
        let tint =
          i >= parityData.debug.stats.lastUpdatedRowStart &&
          i < parityData.debug.stats.lastUpdatedRowEnd
            ? 0xff85d2
            : 0xaf77d1
        if (hasOverrides) {
          tint = blendPixiColors(
            new Color(tint),
            new Color(0xff0000),
            0.4
          ).toNumber()
        }
        rowObj.text.tint = tint
        rowObj.i = i
        rowObj.text.text = i + ""
        rowObj.hitbox.width = rowObj.text.width + 10
        rowObj.hitbox.height = rowObj.text.height + 10
        rowObj.detail.text =
          "Second: " + row.second.toFixed(3) + "\nKey: " + row.id
        rowObj.detail.tint = rowObj.text.tint
        rowObj.detail.visible = false
        rowObj.highlights.forEach(highlight => {
          highlight.box.destroy()
        })
        rowObj.nodePool.children.forEach(nodeObject => {
          nodeObject.deactivate()
        })
        rowObj.nodePool.destroyAll()
        rowObj.highlights = []
        rowObj.hitbox.removeAllListeners()

        const nodeRow = parityData.debug.nodeRows[i]
        if (!nodeRow || nodeRow.nodes.length === 0) {
          console.warn(
            `No permutations found for row ${i} at beat ${row.beat} (${row.id})`
          )
        } else {
          let nodes = nodeRow.nodes
          if (Options.experimental.parity.limitGraph) {
            nodes = nodes.slice(0, 8)
          }
          for (const node of nodes) {
            const nodeObject = rowObj.nodePool.createChild()
            if (!nodeObject) continue
            nodeObject.name = node.key
            const bg = nodeObject.bg

            const setTint = () => {
              let tint = 0xaf77d1
              bg.alpha = 0.2
              if (
                i >= parityData.debug.stats.lastUpdatedNodeStart &&
                i < parityData.debug.stats.lastUpdatedNodeEnd
              ) {
                tint = 0x225900
                bg.alpha = 0.6
              }
              if (parityData.debug.bestPathSet?.has(node.key)) {
                tint = 0xbf4900
                bg.alpha = 0.6
              }

              if (hasOverrides) {
                tint += 0x350000
                bg.alpha += 0.3
              }

              if (active) {
                tint = 0x63c9ff
                bg.alpha = 0.2
              }

              bg.tint = tint
            }

            for (let j = 0; j < node.state.combinedColumns.length; j++) {
              const col = node.state.combinedColumns[j]
              const text = nodeObject.letters[j]
              if (!text) continue
              text.text = FEET_LABELS[col]
              text.alpha = 0.3
              if (node.state.action[j] == node.state.combinedColumns[j]) {
                text.alpha = 1
              }
              text.tint = PARITY_COLORS[col]
            }

            nodeObject.detail.text =
              JSON.stringify(node.state, null, 2) + "\nKey: " + node.key

            let active = false
            setTint()

            const activate = () => {
              if (active) return
              active = true
              nodeObject.alpha = 3
              nodeObject.detail.visible = true
              for (const [outKey, outValue] of node.children.entries()) {
                const nextRow = this.rowMap.get(
                  parityData.debug.notedataRows[i + 1]
                )
                if (!nextRow) return
                const connectedNode = nextRow.nodePool.getChildByName(outKey)
                if (!connectedNode) return

                const connection = new Container() as ConnectionObject
                connection.text = new BitmapText(outValue["TOTAL"].toFixed(2), {
                  fontName: "Mono",
                  fontSize: 10,
                })
                connection.text.anchor.set(0.5, 1)
                connection.text.tint = 0xffffff
                connection.text.y = -bg.height / 2 - 5

                connection.bg = new BetterRoundedRect()
                connection.bg.visible = false
                connection.bg.eventMode = "none"
                connection.bg.tint = 0x383557

                connection.name = outKey
                connection.addChild(connection.bg, connection.text)
                nodeObject.connections.addChild(connection)

                connection.on("pointerover", () => {
                  connection.text.text =
                    JSON.stringify(outValue, null, 2) + "\n"
                  connection.scale.set(1.2)
                  connection.bg.visible = true
                  connection.bg.width = connection.text.width + 10
                  connection.bg.height = connection.text.height + 10
                  connection.bg.alpha = 0.3
                  connection.bg.x = -connection.bg.width / 2
                  connection.bg.y = -connection.bg.height - bg.height / 2 - 10
                })
                connection.on("pointerout", () => {
                  connection.text.text = outValue["TOTAL"].toFixed(2)
                  connection.scale.set(1)
                  connection.bg.visible = false
                })
                connection.text.hitArea = new Rectangle(
                  -connection.text.width / 2,
                  -connection.text.height,
                  connection.text.width,
                  connection.text.height
                )
                connection.zIndex = 1
                nodeObject.zIndex = 1
                rowObj.zIndex = 1
              }
              setTint()
            }

            const deactivate = () => {
              if (!active) return
              active = false
              nodeObject.alpha = 0.8
              nodeObject.zIndex = 0
              nodeObject.detail.visible = false
              nodeObject.connections.children.forEach(connection => {
                connection.destroy()
              })
              nodeObject.connections.removeChildren()
              setTint()
              rowObj.zIndex = 0
            }
            nodeObject.activate = activate
            nodeObject.deactivate = deactivate
            nodeObject.eventMode = "static"

            nodeObject.on("pointerover", () => {
              activate()
            })
            nodeObject.on("pointerout", () => {
              if (this.activeNode != nodeObject) deactivate()
            })
            nodeObject.on("pointerdown", event => {
              if (this.activeNode == nodeObject) {
                this.activeNode = undefined
              } else {
                this.activeNode?.deactivate()
                this.activeNode = nodeObject
                nodeObject.connections.children.forEach(connection => {
                  connection.eventMode = "static"
                })
              }
              event.stopImmediatePropagation()
            })
            nodeObject.cursor = "pointer"
          }
          const nodeWidth = rowObj.nodePool.children[0].bg.width + 5
          const rowWidth = nodeWidth * nodes.length
          // center + layout permutations
          rowObj.nodePool.children.forEach((child, index) => {
            child.x = index * nodeWidth - rowWidth / 2
            child.y = 0
          })
        }

        for (let k = 0; k < this.renderer.chart.getColumnCount(); k++) {
          rowObj.statusRows[0][k].tint = ROW_DETAILS.fakeMines.textTint
          rowObj.statusRows[1][k].tint = ROW_DETAILS.mines.textTint
          rowObj.statusRows[0][k].visible = row.fakeMines[k] !== undefined
          rowObj.statusRows[1][k].visible = row.mines[k] !== undefined

          rowObj.statusRows[2][k].visible = true
          if (row.holdTails.has(k)) {
            rowObj.statusRows[2][k].tint = ROW_DETAILS.holdTails.textTint
          } else if (row.holds[k] !== undefined) {
            rowObj.statusRows[2][k].tint = ROW_DETAILS.holds.textTint
          } else {
            rowObj.statusRows[2][k].visible = false
          }
        }

        rowObj.hitbox.on("pointerover", () => {
          rowObj.detail.visible = true
          row.fakeMines.forEach((second, col) => {
            if (second === undefined) return
            const box = this.createBoxWithText(ROW_DETAILS.fakeMines)
            rowObj.highlights.push({
              col,
              second,
              box,
            })
            rowObj.addChild(box)
          })
          row.mines.forEach((second, col) => {
            if (second === undefined) return
            const box = this.createBoxWithText(ROW_DETAILS.mines)
            rowObj.highlights.push({
              col,
              second,
              box,
            })
            rowObj.addChild(box)
          })
          row.holds.forEach((second, col) => {
            if (second === undefined || row.holdTails.has(col)) return
            const box = this.createBoxWithText(ROW_DETAILS.holds)
            rowObj.highlights.push({
              col,
              second: row.second,
              box,
            })
            rowObj.addChild(box)
          })
          row.holdTails.forEach(col => {
            const box = this.createBoxWithText(ROW_DETAILS.holdTails)
            rowObj.highlights.push({
              col,
              second: row.second,
              box,
            })
            rowObj.addChild(box)
          })
          rowObj.statusRows.forEach(statusRow => {
            statusRow.forEach(box => {
              box.alpha = 0
            })
          })
        })
        rowObj.hitbox.on("pointerout", () => {
          rowObj.detail.visible = false
          rowObj.highlights.forEach(highlight => {
            highlight.box.destroy()
          })
          rowObj.highlights = []
          rowObj.statusRows.forEach(statusRow => {
            statusRow.forEach(box => {
              box.alpha = 1
            })
          })
        })
        this.rowMap.set(row, rowObj)
      }
    }

    // Update boxes

    let i = 0
    const rows = [...this.rowMap.entries()]
    for (const [row, rowObj] of rows) {
      if (
        (row.beat < firstBeat && rows[i + 1]?.[0].beat < firstBeat) ||
        (row.beat > lastBeat && rows[i - 1]?.[0].beat > lastBeat)
      ) {
        this.rowMap.delete(row)
        this.rowPool.destroyChild(rowObj)
        if (this.activeNode && this.activeNode.parent === rowObj.nodePool) {
          this.activeNode.deactivate()
          this.activeNode = undefined
        }
        i++
        continue
      }

      i++

      rowObj.text.text =
        rowObj.i +
        " " +
        parityData.techRows[rowObj.i]
          .values()
          .toArray()
          .map(x => TECH_STRINGS[x] as string)
          .join(", ") +
        " " +
        (parityData.techErrors.has(rowObj.i)
          ? parityData.techErrors
              .get(rowObj.i)!
              .values()
              .toArray()
              .map(x => TECH_ERROR_STRINGS[x] as string)
              .join(", ")
          : "")

      rowObj.visible = Options.experimental.parity.showGraph

      rowObj.highlights.forEach(highlight => {
        const highlightX = this.renderer.getXPosFromColumn(highlight.col)
        const highlightY = this.renderer.getYPosFromSecond(highlight.second)

        const box = highlight.box
        box.x = highlightX
        box.y = highlightY - this.renderer.getYPosFromBeat(row.beat)
      })
      rowObj.y = this.renderer.getYPosFromBeat(row.beat)

      if (align == "left") {
        rowObj.nodePool.x =
          (LEFT_MID_SAFE - LEFT_SAFE) / 2 +
          LEFT_SAFE -
          Options.chart.receptorXPos
      } else {
        rowObj.nodePool.x =
          (RIGHT_SAFE - RIGHT_MID_SAFE) / 2 +
          RIGHT_MID_SAFE -
          Options.chart.receptorXPos
      }
      for (let k = 0; k < this.renderer.chart.getColumnCount(); k++) {
        for (let j = 0; j < 3; j++) {
          if (align == "right") {
            rowObj.statusRows[j][k].x =
              (k - this.renderer.chart.getColumnCount()) * 12 -
              rowObj.text.width -
              12
          } else {
            rowObj.statusRows[j][k].x = k * 12 + rowObj.text.width + 18
          }
        }
      }
      rowObj.sideContainer.x =
        (-this.renderer.chart.gameType.notefieldWidth / 2 - 128) *
        (align == "left" ? -1 : 1)
      rowObj.text.anchor.x = align == "left" ? 0 : 1
      rowObj.hitbox.anchor.x = rowObj.text.anchor.x
      rowObj.nodePool.x /= Options.chart.zoom
      rowObj.detail.x = (rowObj.text.width + 10) * (align == "left" ? 1 : -1)
      rowObj.detail.anchor.x = align == "left" ? 0 : 1
      rowObj.detail.align = align
    }

    // Update debug texts
    if (Options.experimental.parity.showDebug) {
      this.debugTexts.forEach((debugObject, i) => {
        debugObject.x =
          (-this.renderer.chartManager.app.STAGE_WIDTH / 2 +
            10 -
            Options.chart.receptorXPos) /
          Options.chart.zoom
        debugObject.y =
          (this.renderer.chartManager.app.STAGE_HEIGHT / 2 - 10) /
            Options.chart.zoom +
          (i - this.debugTexts.length + 1) * 30
      })

      this.debugBG.x =
        (-this.renderer.chartManager.app.STAGE_WIDTH / 2 -
          Options.chart.receptorXPos) /
        Options.chart.zoom
      this.debugBG.y =
        this.renderer.chartManager.app.STAGE_HEIGHT / 2 / Options.chart.zoom
      this.debugBG.width = this.debugContainer.width + 20 / Options.chart.zoom
      this.debugBG.height = this.debugContainer.height + 15 / Options.chart.zoom
      this.debugContainer.visible = true
      this.debugBG.visible = true
    } else {
      this.debugContainer.visible = false
      this.debugBG.visible = false
    }

    // Create connections
    this.connections.clear()
    if (Options.experimental.parity.showGraph) {
      for (let i = 0; i < parityData.debug.notedataRows.length; i++) {
        if (lastBeat < parityData.debug.notedataRows[i - 1]?.beat) break
        if (firstBeat > parityData.debug.notedataRows[i + 1]?.beat) continue
        const row = parityData.debug.notedataRows[i]
        const nodes = parityData.debug.nodeRows[i].nodes
        const startRowObject = this.rowMap.get(row)
        const endRowObject = this.rowMap.get(
          parityData.debug.notedataRows[i + 1]
        )
        if (!startRowObject || !endRowObject) continue
        for (const node of nodes) {
          const startObject =
            startRowObject.nodePool.getChildByName<NodeObject>(node.key)
          if (!startObject) continue
          for (const [outKey, outValue] of node.children.entries()) {
            const endObject = endRowObject.nodePool.getChildByName(outKey)
            if (!endObject) continue

            let color = 0xaf77d1
            let width = 1.5
            if (
              i >= parityData.debug.stats.lastUpdatedNodeStart &&
              i < parityData.debug.stats.lastUpdatedNodeEnd
            ) {
              color = 0x00ff00
            }
            let alpha = 0.5 - Math.min(0.45, Math.log1p(outValue["TOTAL"]) / 15)
            if (startObject.connections.getChildByName(outKey)) {
              const connection =
                startObject.connections.getChildByName<ConnectionObject>(
                  outKey
                )!
              connection.x =
                endObject.x +
                endRowObject.nodePool.x -
                (startObject.x + startRowObject.nodePool.x)
              connection.y = endRowObject.y - startRowObject.y
              alpha += 0.3
              color = 0x63c9ff
              width = 2.5
            }
            if (
              parityData.debug.bestPathSet?.has(node.key) &&
              parityData.debug.bestPathSet.has(outKey)
            ) {
              color = 0xbf4900
              alpha += 0.4
              width = 4
            }

            this.connections.lineStyle(width, color, alpha)

            this.connections.moveTo(
              startObject.x + startRowObject.nodePool.x,
              startRowObject.y
            )
            this.connections.lineTo(
              endObject.x + endRowObject.nodePool.x,
              endRowObject.y
            )
          }
        }
      }
    }
  }

  createBoxWithText(options: {
    boxWidth?: number
    boxHeight?: number
    boxTint?: number
    boxOpacity?: number

    text: string
    textTint?: number
    textOpacity?: number
  }): DetailBox {
    const box = new Container() as DetailBox
    box.background = new Sprite(Texture.WHITE)
    box.background.width = options.boxWidth || 64
    box.background.height = options.boxHeight || 64
    box.background.tint = options.boxTint || 0xffffff
    box.background.alpha = options.boxOpacity || 0.5
    box.background.anchor.set(0.5, 0.5)
    box.addChild(box.background)

    box.text = new BitmapText(options.text, {
      fontName: "Main",
      fontSize: 25,
    })
    box.text.tint = options.textTint || 0xffffff
    box.text.alpha = options.textOpacity || 1
    box.text.anchor.set(0.5, 0.5)
    box.addChild(box.text)
    return box
  }

  createDebugObject(
    tint: number,
    update: (parityData: ParityDebugData) => string
  ): DebugObject {
    const debugObject = new Container() as DebugObject
    debugObject.text = new BitmapText("", {
      fontName: "Main",
      fontSize: 20,
    })
    debugObject.text.tint = tint
    debugObject.text.anchor.set(0, 1)
    debugObject.addChild(debugObject.text)
    debugObject.update = update

    this.debugTexts.push(debugObject)
    this.debugContainer.addChild(debugObject)

    return debugObject
  }
}
