import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
const audio = new Audio("/sample0.mp3");
const canvas = document.getElementById("canvas")
const playButton = document.getElementById("play");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Scene
const scene = new THREE.Scene()

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 10
camera.position.y = 10
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

// set up scene
let cubeSize = .1;
let cubeSpacing = .1;
let minHeight = .1;
let cubesArr = new Array(bufferLength * 2);
const cube = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0x00aa00})
for (let i = 0; i < bufferLength; i++) {
  const mesh = new THREE.Mesh(cube, material)
  mesh.scale.set(cubeSize, minHeight, cubeSize)
  mesh.position.x = (i + .5) * (mesh.scale.x + cubeSpacing)
  const mesh1 = mesh.clone();
  mesh1.position.x = -1 * mesh.position.x;
  scene.add(mesh);
  scene.add(mesh1);
  cubesArr[i] = mesh;
  cubesArr[i + bufferLength] = mesh1;
}

/**
 * Animate
 */
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime()

  // Update controls
  controls.update()

  analyser.getByteFrequencyData(dataArray);
  let barHeight;
  let heightScale = .05;
  for (let i = 0; i < bufferLength; i++) {
    barHeight =  Math.max(minHeight, dataArray[i] * heightScale);
    const mesh = cubesArr[i];
    const mesh1 = cubesArr[i + bufferLength];

    mesh.scale.y = barHeight;
    mesh1.scale.y = barHeight;
  }

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(animate)
}

animate();

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



window.addEventListener('resize', () =>
{
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Fullscreen
 */
window.addEventListener('dblclick', () =>
{
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

    if(!fullscreenElement)
    {
        if(canvas.requestFullscreen)
        {
            canvas.requestFullscreen()
        }
        else if(canvas.webkitRequestFullscreen)
        {
            canvas.webkitRequestFullscreen()
        }
    }
    else
    {
        if(document.exitFullscreen)
        {
            document.exitFullscreen()
        }
        else if(document.webkitExitFullscreen)
        {
            document.webkitExitFullscreen()
        }
    }
})

playButton.addEventListener("click", () => {
  if (audio.paused) {
      audioCtx.resume();
      playButton.innerText = 'pause'
      audio.play()
  } else {
      playButton.innerText = 'play'
      audio.pause();
  }
});