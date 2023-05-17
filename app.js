const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
const audio = new Audio("./samples/sample0.mp3");
const canvas = document.getElementById("canvas")
const canvasCtx = canvas.getContext('2d');
const playButton = document.getElementById("play");
const WIDTH = 300;
const HEIGHT = 150;

playButton.addEventListener("click", () => {
    if (audio.paused) {
        playButton.innerText = 'pause'
        audio.play()
    } else {
        playButton.innerText = 'play'
        audio.pause();
    }
});

const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
console.log(bufferLength)
const dataArray = new Uint8Array(bufferLength);

// draw an oscilloscope of the current audio source

function draw() {
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.fillStyle = "rgb(0, 0, 0)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  
    const barWidth = (WIDTH / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
  
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];
  
      canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
      canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);
  
      x += barWidth + 1;
    }
    requestAnimationFrame(draw);
  }

draw();