function convert(model_text) {
  const lines = model_text
    .replaceAll(/\/\/.+/g, "")
    .split("\n")
    .map(a => a.trim())
    .filter(a => a != "")
  let idx = lines.findIndex(a => a.includes("Meshes: "))
  let mesh_match = /Meshes: (\d+)/.exec(lines[idx])
  if (mesh_match == null) {
    throw "Invalid mesh count"
  }
  let n_meshes = mesh_match[1]
  idx++

  for (let i = 0; i < n_meshes; i++) {
    idx++

    let mesh = ""

    let n_vertex = parseInt(lines[idx])
    if (n_vertex <= 0) {
      throw "Invalid vertex count"
    }

    mesh += n_vertex + "\n"
    idx++

    for (let j = 0; j < n_vertex; j++) {
      let vert = /(-?[.\d]+) (-?[.\d]+) (-?[.\d]+) (-?[.\d]+) (-?[.\d]+) (-?[.\d]+) (-?[.\d]+)/.exec(lines[idx])
      if (vert == null) {
        throw "Invalid vertex " + j + ": " + lines[idx]
      }
      mesh += `${vert[2]} ${vert[3]} ${vert[5]} ${vert[6]}\n`
      idx++
    }

    let n_normal = parseInt(lines[idx])
    if (n_normal == 0) {
      throw "Invalid normal count: " + lines[idx]
    }
    idx += n_normal + 1

    let n_tris = parseInt(lines[idx])
    if (n_tris <= 0) {
      throw "Invalid triangle count: " + lines[idx]
    }

    mesh += n_tris + "\n"
    idx++

    for (let j = 0; j < n_tris; j++) {
      let tri = /(\d+) (\d+) (\d+) (\d+) (\d+) (\d+) (\d+) (\d+)/.exec(lines[idx])
      if (tri == null) {
        throw "Invalid triangle " + j + ": " + lines[idx]
      }
      mesh += `${tri[2]} ${tri[3]} ${tri[4]}\n`
      idx++
    }

    console.log(mesh)

  }

}
