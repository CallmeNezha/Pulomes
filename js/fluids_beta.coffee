#//              ______    _____            _________       _____   _____
#//            /     /_  /    /            \___    /      /    /__/    /
#//           /        \/    /    ___        /    /      /            /    ___
#//          /     / \      /    /\__\      /    /___   /    ___     /    /   \
#//        _/____ /   \___ /    _\___     _/_______ / _/___ / _/___ /    _\___/\_
#//        revised on 6/3/2016  All rights reserved by @NeZha

vertexShader =
'''
			varying vec3 vWorldPosition;

			void main() {

				vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
				vWorldPosition = worldPosition.xyz;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}
  '''

fragmentShader =
'''
			uniform vec3 topColor;
			uniform vec3 bottomColor;
			uniform float offset;
			uniform float exponent;

			varying vec3 vWorldPosition;

			void main() {

				float h = normalize( vWorldPosition + offset ).y;
				gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );

			}
  '''


initStats = ->
  stats = new Stats()
  stats.setMode(0)
  stats

initScene = ->
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 5001)
  camera.position.x = 300
  camera.position.y = 180
  camera.position.z = 300
  camera.position.multiplyScalar(1.7)
  camera.lookAt(scene.position)
  renderer = new THREE.WebGLRenderer(antialias: on)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x000000)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = on
  {scene, camera, renderer}





stats = initStats()
{scene, camera, renderer} = initScene()
if renderer.extensions.get('ANGLE_instanced_arrays') is false
  document.getElementById("notSupported").style.display = ""
  return

document.getElementById("stats-output").appendChild(stats.domElement)
document.getElementById('webgl-output').appendChild(renderer.domElement)
orbitControl = new THREE.OrbitControls(camera, renderer.domElement)
orbitControl.maxDistance = 1000
orbitControl.minDistance = 1
orbitControl.center.copy(scene.position)


# LIGHTS

spotLight = new THREE.SpotLight( 0xffffff, 1 )
spotLight.position.set( 15, 40, 35 )
spotLight.position.multiplyScalar(20)
spotLight.castShadow = true
spotLight.angle = Math.PI / 3
spotLight.penumbra = 0.25
spotLight.decay = 1
spotLight.distance = 2000
spotLight.shadow.mapSize.width = 2048
spotLight.shadow.mapSize.height = 2048
spotLight.shadow.camera.near = 1
spotLight.shadow.camera.far = 2000
scene.add(spotLight)

# Ground

planeGeo = new THREE.CircleGeometry( 2000, 16 );
planeMat = new THREE.MeshPhongMaterial(color: 0xffffff, specular: 0x050505)
planeMat.color.setHSL(0.095, 1, 0.75)
planeObj = new THREE.Mesh(planeGeo, planeMat)
planeObj.position.set(0, 0, 0)
planeObj.rotation.x = -Math.PI/2
planeObj.receiveShadow = on
scene.add(planeObj)

#

# Particle system

new THREE.InstancedBufferGeometry()

#

gui = new dat.GUI()


renderer.gammaInput = yes
renderer.gammaOutput = yes

render = ->
    renderer.render(scene, camera)


# animation loop
do animate = ->
  requestAnimationFrame(animate)

  render()

  orbitControl.update()
  stats.update()




###
  Events Listener
###
onWindowResize = ->
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )

window.addEventListener('resize', onWindowResize, false)