#//              ______    _____            _________       _____   _____
#//            /     /_  /    /            \___    /      /    /__/    /
#//           /        \/    /    ___        /    /      /            /    ___
#//          /     / \      /    /\__\      /    /___   /    ___     /    /   \
#//        _/____ /   \___ /    _\___     _/_______ / _/___ / _/___ /    _\___/\_
#//        revised on 5/27/2016  All rights reserved by @NeZha

#initStats = ->
#  stats = new Stats()
#  stats.setMode(0)
#  stats.domElement.style.position = 'absolute'
#  stats.domElement.style.left = '0px'
#  stats.domElement.style.top = '0px'
#  stats

onWindowResize = ->
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )

window.addEventListener('resize', onWindowResize, false)

initScene = ->
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000)
  camera.position.x = -300
  camera.position.y = 400
  camera.position.z = 300
  camera.lookAt(scene.position)
  renderer = new THREE.WebGLRenderer(antialias: on)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0xEEEEEE)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = on
  {scene, camera, renderer}

#stats = initStats()
#document.getElementById("stats-output").appendChild(stats.domElement)
{scene, camera, renderer} = initScene()
document.body.appendChild(renderer.domElement)

#scene.add( new THREE.AmbientLight( 0x666666 ) )
light = new THREE.DirectionalLight( 0xdfebff, 1.75 )


light.position.set( 50, 200, 100 )
light.position.multiplyScalar(1.3)
#scene.add(new THREE.CameraHelper( light.shadow.camera ))
light.castShadow = true
light.shadow.camera.near = 2
light.shadow.camera.far = 1000
light.shadow.camera.left = -500
light.shadow.camera.right = 500
light.shadow.camera.top= 500
light.shadow.camera.bottom= -500
light.shadow.mapSize.width = 1024
light.shadow.mapSize.height = 1024
scene.add(light)

cubeMat = new THREE.MeshLambertMaterial(color: 0x44ff44)
cubeGeo = new THREE.BoxGeometry(10,10,10)
cubeObj = new THREE.Mesh(cubeGeo,cubeMat)
cubeObj.position.set(0, 5, 0)
cubeObj.castShadow = on

scene.add(cubeObj)

planeGeo = new THREE.PlaneGeometry(1000, 1000)
planeMat = new THREE.MeshLambertMaterial(color: 0xeeeeee)
planeObj = new THREE.Mesh(planeGeo, planeMat)
planeObj.position.set(0, -5, 0)
planeObj.rotation.x = -Math.PI/2
planeObj.receiveShadow = on
scene.add(planeObj)




axes = new THREE.AxisHelper(20)
scene.add(axes)

render = ->

  #stats.update()
  requestAnimationFrame(render)
  renderer.render(scene, camera)

render()