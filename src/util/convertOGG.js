const worker = new Worker("lib/ffmpeg-worker-mp4.js");

const downloadURL = (data, fileName) => {
  const a = document.createElement('a')
  a.href = data
  a.download = fileName
  document.body.appendChild(a)
  a.style.display = 'none'
  a.click()
  a.remove()
}

const downloadBlob = (data, fileName, mimeType) => {

  const blob = new Blob([data], {
    type: mimeType
  })

  const url = window.URL.createObjectURL(blob)

  downloadURL(url, fileName)

  setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}
worker.onmessage = function(e) {
  const msg = e.data;
  switch (msg.type) {
  case "ready":

    break;
  case "stdout":
    console.log(msg.data);
    break;
  case "stderr":
    console.log(msg.data);
    break;
  case "done":
    console.log(msg.data);
    window.output = new Blob([msg.data["MEMFS"][0].data], {
      type: "audio/mp3"
    })
    break;
  }
};

export function convert(file) {
  var arrayBuffer;
  var fileReader = new FileReader();
  fileReader.onload = function(event) {
      arrayBuffer = event.target.result;
      var t = worker.postMessage({
        type: "run",
        MEMFS: [{name: file.name, data: arrayBuffer}],
        arguments: ["-i", file.name, "-c:a", "libmp3lame", "out.mp3"],
      });
      console.log(t)
  };
  fileReader.readAsArrayBuffer(file);
  
}
