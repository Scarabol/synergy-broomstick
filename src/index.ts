import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  CubeTextureLoader,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import {ParametricGeometries} from 'three/examples/jsm/geometries/ParametricGeometries'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment'
import SkyboxPosX from '../assets/skybox/posx.jpg'
import SkyboxNegX from '../assets/skybox/negx.jpg'
import SkyboxPosY from '../assets/skybox/posy.jpg'
import SkyboxNegY from '../assets/skybox/negy.jpg'
import SkyboxPosZ from '../assets/skybox/posz.jpg'
import SkyboxNegZ from '../assets/skybox/negz.jpg'
import GrassTexture from '../assets/grass13.png'
import SphereGeometry = ParametricGeometries.SphereGeometry

export const DEV_MODE = process.env.WEBPACK_MODE === 'development'

const scene = new Scene()
scene.add(new AmbientLight(0x404040))

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

scene.background = new CubeTextureLoader().load([
  SkyboxPosX, SkyboxNegX, SkyboxPosY, SkyboxNegY, SkyboxPosZ, SkyboxNegZ,
])

const geoBroom = new BoxGeometry(0.1, 0.1, 1.5)
const matBroom = [0x663300, 0x331900, 0x663300, 0x663300, 0x331900, 0x663300]
  .map((c) => new MeshBasicMaterial({color: c}))
const broom = new Mesh(geoBroom, matBroom)
broom.position.y = 10
if (DEV_MODE) broom.add(new AxesHelper(0.5))
scene.add(broom)

const geoFloor = new BoxGeometry(100, 1, 100)
const grassTexture = new TextureLoader().load(GrassTexture)
grassTexture.wrapS = RepeatWrapping
grassTexture.wrapT = RepeatWrapping
grassTexture.repeat = new Vector2(5, 5)
const matFloor = new MeshBasicMaterial({color: 0x004000, map: grassTexture})
const floor = new Mesh(geoFloor, matFloor)
if (DEV_MODE) floor.add(new AxesHelper(3))
scene.add(floor)

const snitchSize = 0.2
const geoSnitch = new SphereGeometry(snitchSize, 16, 16)
const matSnitch = new MeshStandardMaterial({color: 0x808000, roughness: 0.3, metalness: 0.9})
const snitch = new Mesh(geoSnitch, matSnitch)
snitch.position.set(0, 10, -2)
scene.add(snitch)

// snitch particles
const geoParticle = new BoxGeometry(0.01, 0.01, 0.01)
const matParticle = new MeshBasicMaterial({color: 0x808000})
setInterval(() => {
  for (let c = 0; c < 20; c++) {
    const particle = new Mesh(geoParticle, matParticle)
    particle.position.copy(snitch.position)
      .sub(new Vector3(1, 1, 1).multiplyScalar(0.75 * snitchSize))
      .add(new Vector3().random().multiplyScalar(2 * 0.75 * snitchSize))
    scene.add(particle)
    setTimeout(() => scene.remove(particle), Math.random() * 1000)
  }
}, 1000 / 60)

const pmremGenerator = new PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

camera.position.y = 2
camera.position.z = 5
camera.lookAt(broom.position)

const animate = () => {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

const broomRotSpeed = new Vector2(0, 0)
const mainLoop = () => {
  broom.rotateOnAxis(xAxis, broomRotSpeed.x)
  broom.rotateOnWorldAxis(yAxis, broomRotSpeed.y)
  updateCamera()
}
setInterval(mainLoop, 1000 / 60)

function updateCamera() {
  const cameraOffset = new Vector3(0, 2, 5)
  cameraOffset.applyEuler(broom.rotation)
  const cameraTargetPos = broom.position.clone().add(cameraOffset)
  const cameraMoveDistance = cameraTargetPos.sub(camera.position)
  const length = cameraMoveDistance.length()
  const scaledLength = ((length > 2) ? 2 : length) / 10
  const cameraSpeed = 0.1 + scaledLength
  const cameraStep = cameraMoveDistance.clampLength(0, cameraSpeed)
  camera.position.add(cameraStep)
  camera.lookAt(broom.position)
}

let broomMaxSpeed = 0.15
let broomMoveInterval: NodeJS.Timer | null = null

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      if (!broomMoveInterval) {
        broomMoveInterval = setInterval(() => {
          broom.position.sub(new Vector3(0, 0, broomMaxSpeed).applyEuler(broom.rotation))
          updateCamera()
        }, 1000 / 60)
      }
      break
    case 's':
      if (!broomMoveInterval) {
        broomMoveInterval = setInterval(() => {
          broom.position.add(new Vector3(0, 0, broomMaxSpeed).applyEuler(broom.rotation))
          updateCamera()
        }, 1000 / 60)
      }
      break
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'w':
      if (broomMoveInterval) {
        clearInterval(broomMoveInterval)
        broomMoveInterval = null
      }
      break
    case 's':
      if (broomMoveInterval) {
        clearInterval(broomMoveInterval)
        broomMoveInterval = null
      }
      break
  }
})

const xAxis = new Vector3(1, 0, 0)
const yAxis = new Vector3(0, 1, 0)
const transpose = new Vector2()
renderer.getSize(transpose)
transpose.multiplyScalar(0.5)
const deadzone = 0.1
window.addEventListener('mousemove', (event) => {
  const dx = (event.pageX - transpose.x) / transpose.x
  const dy = (event.pageY - transpose.y) / transpose.y
  if (Math.abs(dx) < deadzone && Math.abs(dy) < deadzone) {
    broomRotSpeed.y = 0
    broomRotSpeed.x = 0
  } else {
    broomRotSpeed.y = -(dx - Math.sign(dx) * deadzone) / (1 - deadzone) * Math.PI / 60
    broomRotSpeed.x = -(dy - Math.sign(dy) * deadzone) / (1 - deadzone) * Math.PI / 60
  }
})

window.addEventListener('mouseout', () => {
  broomRotSpeed.set(0, 0)
})

// snitch mover
let currentTarget: Vector3 | null = null
let snitchDelay = 1000
const snitchSpeed = 0.1
setInterval(() => {
  if (currentTarget === null || snitch.position.distanceTo(currentTarget) < 0.1) {
    if (snitchDelay > 0) {
      snitchDelay -= 1000 / 60
    } else {
      currentTarget = new Vector3(-50 + Math.random() * 100, 1 + Math.random() * 20, -50 + Math.random() * 100)
      snitchDelay = 1000
    }
  } else {
    snitch.lookAt(currentTarget)
    const step = currentTarget.clone().sub(snitch.position).clampLength(0, snitchSpeed)
    snitch.position.add(step)
  }
}, 1000 / 60)

// catch snitch checker
setInterval(() => {
  const catchDistance = 0.5
  const currentDistance = broom.position.distanceTo(snitch.position)
  if (currentDistance <= catchDistance) {
    currentTarget = null
    snitchDelay = 10000
  }
}, 1000 / 60)

// start rendering
animate()
