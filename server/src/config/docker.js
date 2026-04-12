import Docker from "dockerode"

// On Windows, connect via TCP instead of named pipe
const docker = new Docker({
  host: "127.0.0.1",
  port: 2375,
  protocol: "http"
})

docker.ping((err) => {
  if (err) {
    console.error("Docker not accessible:", err.message)
  } else {
    console.log("Docker connected")
  }
})

export default docker