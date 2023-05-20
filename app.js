import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
const audio = document.getElementById("audio");
audio.src = "./sample0.mp3"; // initial sample

let source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

const canvas = document.getElementById("canvas")
const playButton = document.getElementById("play");
const nextButton = document.getElementById("next");

const gui = new GUI();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(80, sizes.width / sizes.height, 0.1, 100)
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
scene.add(camera)
camera.position.z = 5
camera.position.y = 5
camera.rotation.set(-Math.PI * .15, 0, 0)
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// debug camera height
gui.add(camera.position, "y").min(-20).max(20).step(1).name("camera height")
gui.add(camera.rotation, "x").max(0).min(Math.PI / -2).hide()

// set up scene
const cubeParams = {
  cubeSize: .2,
  logBase: .2,
  cubeSpacing: .1,
  minHeight: .1
}

let logBase = .2;
const sizeDecreaseFactor = .95; // change to using log base
let cubeSpacing = .1;
let minHeight = .1;
let cubesArr = new Array(bufferLength * 2);
let xPos = (cubeParams.cubeSize + cubeSpacing) * .5;
const cube = new THREE.BoxGeometry(1, 1, 1)
let matColor = { color: 0x935353}
const material = new THREE.MeshBasicMaterial(matColor)

// debug material color
gui.addColor(matColor, 'color').onChange(() => 
{
  material.color.set(matColor.color)
}).name("bar color")

setupBars();

const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("./textures/particles/13.png");

const particlesGeometry = new THREE.BufferGeometry()

const particleParams = {
  count: 10000,
  speed: .01
}
gui.add(particleParams, "speed").min(.001).max(10)

const positions = new Float32Array(particleParams.count * 3)
const colors = new Float32Array(particleParams.count * 3)

setupParticles();
// debug
gui.add(cubeParams, "cubeSize").min(0).max(1).step(.01).onChange(() => {
  deleteBars();
  setupBars();
})

const clock = new THREE.Clock();
animate();

function setupBars() 
{
  for (let i = 0; i < bufferLength; i++) 
  {
    const mesh = new THREE.Mesh(cube, material)
    mesh.scale.set(cubeParams.cubeSize, minHeight, cubeParams.cubeSize)
    mesh.position.x = xPos;
    // cubeSize = Math.log(i) / Math.log(logBase)
    xPos += cubeParams.cubeSize + cubeSpacing;
    // cubeParams.cubeSize*=sizeDecreaseFactor;
    const mesh1 = mesh.clone();
    mesh1.position.x = -1 * mesh.position.x;
    scene.add(mesh);
    scene.add(mesh1);
    cubesArr[i] = mesh;
    cubesArr[i + bufferLength] = mesh1;
  }
}

function setupParticles() {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load("./textures/particles/13.png")

  for(let i = 0; i < particleParams.count * 3; i++)
  {
      positions[i] = (Math.random() - 0.5) * 20
      colors[i] = Math.random()
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  // Material
  const particlesMaterial = new THREE.PointsMaterial()

  particlesMaterial.size = 0.1
  particlesMaterial.sizeAttenuation = true

  particlesMaterial.color = new THREE.Color('#ff88cc')

  particlesMaterial.transparent = true
  particlesMaterial.alphaMap = particleTexture
  // particlesMaterial.alphaTest = 0.01
  // particlesMaterial.depthTest = false
  particlesMaterial.depthWrite = false
  particlesMaterial.blending = THREE.AdditiveBlending

  particlesMaterial.vertexColors = true

  // Points
  const particles = new THREE.Points(particlesGeometry, particlesMaterial)
  scene.add(particles)
}

function animateParticles() {
  for(let i = 1; i < particleParams.count * 3; i+=3)
  {
      positions[i]+=particleParams.speed
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

}

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
    heightChange = Math.max(0, heightChange);


    mesh.scale.y = barHeight;
    mesh1.scale.y = barHeight;
  }

  animateParticles();

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(animate)
}

function deleteBars() 
{
  for (let i = 0; i < bufferLength; i++) 
  {
    const mesh = cubesArr[i];
    const mesh1 = cubesArr[i + bufferLength];

    scene.remove(mesh);
    scene.remove(mesh1);
  }
}

function restartAudioAnalyzer() {
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  audioCtx.resume();
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

playButton.addEventListener("click", () => {
  if (audio.paused) {
      audioCtx.resume();
      playButton.innerText = 'pause'
      let playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(function() {
        // Automatic playback started!
        }).catch(function(error) {
        console.log(error)
        });
      }
  } else {
      playButton.innerText = 'play'
      audio.pause();
  }
});

nextButton.addEventListener("click", () => {
  playButton.click();
  audio.src = './sample1.mp3'
  restartAudioAnalyzer();
  playButton.click();
});

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