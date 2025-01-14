import ReactDOM from "react-dom/client";
import React, { useEffect, useRef, useState } from 'react';
import "./index.css";

function App() {
  const socket = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [file, setFile] = useState(null);
  const [midiUrl, setMidiUrl] = useState(null); // For storing the MIDI file URL

  // Setup WebSocket
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws`); // Backend WebSocket URL

    ws.onopen = () => {
      console.log("socket opened");
      setIsReady(true);
    };

    ws.onclose = () => {
      console.log("socket closed");
      setIsReady(false);
    };

    ws.onmessage = (event) => {
		if (typeof event.data === "string") {
			// Parse string messages (e.g., log messages)
			console.log("Message from backend: ", event.data)
		} else {
			// Handle binary data (e.g., MIDI files)
			const blob = new Blob([event.data], { type: "audio/midi" });
			const url = URL.createObjectURL(blob);
			setMidiUrl(url);
      	}
    };

    socket.current = ws;

    return () => {
      ws.close(); // Clean up the socket on component unmount
    };
  }, []);

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Upload the file and send via WebSocket
  const handleFileUpload = () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result;
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(fileData); // Send audio file as binary data
        console.log("File sent successfully");
      } else {
        console.error("WebSocket is not open");
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
    };

    reader.readAsArrayBuffer(file);
  };

  // Play the MIDI file
  const playMidi = () => {
    if (!midiUrl) {
      alert("No MIDI file received");
      return;
    }

    const audio = new Audio(midiUrl); // Use HTML5 Audio for playback
    audio.play();
  };

  return (
    <div className="app-div">
      <h1>Real-Time Note Detection</h1>
      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleFileUpload}>Upload</button>
      </div>
      {midiUrl && (
        <div>
          <button onClick={playMidi}>Play MIDI</button>
          <a href={midiUrl} download="output.mid">
            Download MIDI
          </a>
        </div>
      )}
    </div>
  );
}


const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);

root.render(
    <App />
);
