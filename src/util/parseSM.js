import { buildTimingEventCache, getBPM, getSeconds } from "./util"

const sm_regex = /#([A-Z]+):([^;]*);/g
const notes_regex = /([\w\d\-]+):[\s ]*([\w\d\-]*):[\s ]*([\w\d\-]+):[\s ]*([\d]+):[\s ]*([\d.,]+):[\s ]*([\w\d\s, ]+)/g

export async function parseSM(file) {
  let sm = await window.files.getFile(file).text()
  let type = file.split(".").pop()
  let dict = {"NOTES": [], "_type": type}
  try {
    //Remove Comments
    sm = sm.replaceAll(/\/\/.+/g, "")
    let arr = [...sm.matchAll(sm_regex)]
    let ssc_pair = false
    let ssc_notedata = {}
    for (let i = 0; i < arr.length; i++) {
      if ((arr[i][1]=="NOTEDATA" && type == "ssc") || ssc_pair) {
        ssc_pair = true
        ssc_notedata[arr[i][1]] = (arr[i][2])
        if (arr[i][1] == "NOTES") {
          dict["NOTES"].push(ssc_notedata)
          ssc_notedata = {}, ssc_pair = false
        }
      }else if (arr[i][1] == "NOTES") {
        dict[arr[i][1]].push(arr[i][2])
      }else{
        dict[arr[i][1]] = (arr[i][2])
      }
    }
    dict["OFFSET"] = parseFloat(dict["OFFSET"])
    //Parse Timing Data
    let fields = ["BPMS", "STOPS", "DELAYS", "WARPS"]
    for (let i = 0; i < fields.length; i ++) {
      let field = fields[i]
      if (dict[field] == undefined) {
        dict[field] = []
        continue
      }
      let temp = []
      
      let str = dict[field].replaceAll(/[\s]/g,"").split(",")
      for (let i = 0; i < str.length; i++) {
        let entry = str[i].split("=")
        if (entry.length < 2)
          continue
        entry[0] = parseFloat(entry[0])
        entry[1] = parseFloat(entry[1])
        temp.push(entry)
      }
      dict[field] = temp
    }

    dict._events = buildTimingEventCache(dict)
   
    //Parse NOTES
    for (let i = 0; i < dict["NOTES"].length; i++) {
      let chart = {}
      if (type == "ssc") {
        let data = dict["NOTES"][i]
        chart["Type"] = data["STEPSTYPE"] ?? ""
        chart["Description"] = data["DESCRIPTION"] ?? ""
        chart["Difficulty"] = data["DIFFICULTY"] ?? ""
        chart["Meter"] = parseInt(data["METER"]) ?? ""
        chart["Radar"] = data["RADARVALUES"] ?? ""
        chart["Notedata"] = getNotedata(data["NOTES"], dict) ?? {}
        chart["Credit"] = data["CREDIT"] ?? ""
        chart["ChartName"] = data["CHARTNAME"] ?? ""
        chart["ChartStyle"] = data["CHARTSTYLE"] ?? ""
      }else if (type=="sm") {
        let match = /([\w\d\-]+):[\s ]*([\w\d\- \'\"?.]*):[\s ]*([\w\d\-]+):[\s ]*([\d]+):[\s ]*([\d.,]+):[\s ]*([\w\d\s, ]+)/g.exec(dict["NOTES"][i].trim())
        if (match != null) {
          chart["Type"] = match[1] ?? ""
          chart["Description"] = match[2] ?? ""
          chart["Difficulty"] = match[3] ?? ""
          chart["Meter"] = parseInt(match[4]) ?? 1
          chart["Radar"] = match[5] ?? ""
          chart["Notedata"] = getNotedata(match[6], dict) ?? {}
          chart["ChartName"] = ""
          chart["ChartStyle"] = ""
        }
      }
      dict["NOTES"][i] = chart
    }

  } catch (e) {
    console.log(e)
  }
  return dict
}

function getNotedata(str, sm) {
  
  let measures = str.split(",")
  let beat = 0
  let notedata = []
  let holds = [null, null, null, null]
  for (let i = 0; i < measures.length; i++) { 
    let beats = measures[i].trim().split("\n")
    for (let tick = 0; tick < beats.length; tick++) { 
      let row = beats[tick].trim()
      for (let col = 0; col < row.length; col++) { 
        if (row[col] != "0" && row[col] != "3") {
          let item = [beat + tick / beats.length * 4, col, getNoteType(row[col])]
          if (row[col] == "2" || row[col] == "4") {
            if (holds[col] != null) {
              console.log("Missing end of hold/roll for note " + holds[col])
            }
            holds[col] = item
          }
          item[3] = getSeconds(item[0], sm)
          notedata.push(item)
        }
        if (row[col] == "3") {
          if (holds[col] == null) {
            console.log("Extra end of hold/roll at beat " + (beat + tick / beats.length * 4) + " col " + col)
          }else{
            holds[col].hold = (beat + tick / beats.length * 4) - holds[col][0]
            holds[col] = null
          }
        }
      }
    }
    beat += 4
  }

  let nIndex = 0
  for (let i = 0; i < sm["WARPS"].length; i++) {
    while (nIndex < notedata.length && notedata[nIndex][0] < sm["WARPS"][i][0]) {
      nIndex++
    }
    while (nIndex < notedata.length && notedata[nIndex][0] < sm["WARPS"][i][0]+sm["WARPS"][i][1]) {
      notedata[nIndex].warped = true
      nIndex++
    }
  }
  for (let i = 0; i < sm["STOPS"].length; i++) {
    if (sm["STOPS"][i][1] >= 0)
      continue

    while (nIndex < notedata.length && notedata[nIndex][0] < sm["STOPS"][i][0]) {
      nIndex++
    }
    let bpmatstop = getBPM(sm["STOPS"][i][0], sm)
    while (nIndex < notedata.length && notedata[nIndex][0] < sm["STOPS"][i][0]+sm["STOPS"][i][1]*-1*bpmatstop/60) {
      notedata[nIndex].warped = true
      nIndex++
    }
  }
  return (notedata)
}

function getNoteType(type) {
  switch(type) {
    case "1":
      return "Tap"
    case "2":
      return "Hold"
    case "4":
      return "Roll"
    case "M":
      return "Mine"
  }
  return "None"
}