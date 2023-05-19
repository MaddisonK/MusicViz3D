import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import song from "/sample0.mp3";
import GUI from 'lil-gui';

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
let audio = new Audio(song);

let source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 128;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function restartAudioAnalyzer() {
  source.disconnect()
  analyser.disconnect()
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
}

const canvas = document.getElementById("canvas")
const playButton = document.getElementById("play");
const nextButton = document.getElementById("next");

/**
 * Debug
 */
const gui = new GUI();

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
const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.1, 100)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

scene.add(camera)
camera.position.z = 5
camera.position.y = 9
camera.rotation.set(-1, 0, 0)

// debug camera height
gui.add(camera.position, "y").min(-20).max(20).step(1).name("camera height")
gui.add(camera.rotation, "x").max(0).min(Math.PI / -2).hide()


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// set up scene
let cubeSize = .2;
const sizeDecreaseFactor = .95; // change to using log base
let cubeSpacing = .1;
let minHeight = .1;
let cubesArr = new Array(bufferLength * 2);
let xPos = (cubeSize + cubeSpacing) * .5;
const cube = new THREE.BoxGeometry(1, 1, 1)
let matColor = { color: 0xa94747}
const material = new THREE.MeshBasicMaterial(matColor)
const light = new THREE.PointLight().position.set(0, 100, 10);
scene.add(light);
// debug material color
gui.addColor(matColor, 'color').onChange(() => 
{
  material.color.set(matColor.color)
}).name("bar color")

for (let i = 0; i < bufferLength; i++) {
  const mesh = new THREE.Mesh(cube, material)
  mesh.scale.set(cubeSize, minHeight, cubeSize)
  mesh.position.x = xPos;
  xPos += cubeSize + cubeSpacing;
  cubeSize *= sizeDecreaseFactor;
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
  // controls.update()

  analyser.getByteFrequencyData(dataArray);
  let barHeight;
  let heightScale = .05;
  let heightChange;
  for (let i = 0; i < bufferLength; i++) {
    barHeight =  Math.max(minHeight, dataArray[i] * heightScale);
    const mesh = cubesArr[i];
    const mesh1 = cubesArr[i + bufferLength];
    
    heightChange = barHeight - mesh.scale.y;
    if (i == 0) {
      console.log(mesh.scale.y);
    }
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

// window.addEventListener('dblclick', () =>
// {
//     const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

//     if(!fullscreenElement)
//     {
//         if(canvas.requestFullscreen)
//         {
//             canvas.requestFullscreen()
//         }
//         else if(canvas.webkitRequestFullscreen)
//         {
//             canvas.webkitRequestFullscreen()
//         }
//     }
//     else
//     {
//         if(document.exitFullscreen)
//         {
//             document.exitFullscreen()
//         }
//         else if(document.webkitExitFullscreen)
//         {
//             document.webkitExitFullscreen()
//         }
//     }
// })

playButton.addEventListener("click", () => {
  if (audio.paused) {
      audioCtx.resume();
      playButton.innerText = 'pause'
      playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(function() {
        // Automatic playback started!
        }).catch(function(error) {
        console.log('playback failed')
        });
      }
  } else {
      playButton.innerText = 'play'
      audio.pause();
  }
});

nextButton.addEventListener("click", () => {
  playButton.click();
  audio = new Audio("/sample1.mp3");
  playButton.click();
  restartAudioAnalyzer();
});