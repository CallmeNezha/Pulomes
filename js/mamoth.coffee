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
document.getElementById("stats-output").appendChild(stats.domElement)
document.getElementById('webgl-output').appendChild(renderer.domElement)
orbitControl = new THREE.OrbitControls(camera, renderer.domElement)
orbitControl.maxDistance = 1000
orbitControl.minDistance = 200
orbitControl.minPolarAngle = Math.PI/4
orbitControl.maxPolarAngle = Math.PI/2


orbitControl.center = new THREE.Vector3(0,150,0)
#translate = (new THREE.Vector3(-1,0,0)).transformDirection(camera.matrix)
#translate.multiplyScalar(250)
#camera.position.add(translate)
#orbitControl.center.add(translate)

#scene.fog = new THREE.Fog( 0xffffff, 1, 5000 )
#scene.fog.color.setHSL( 0.6, 0, 1 )


#scene.add(new THREE.AmbientLight( color:0xffffff, intensity: 0.1 ))

# LIGHTS

spotLight = new THREE.SpotLight( 0xffffff, 1 )
spotLight.position.set( 15, 40, 35 )
spotLight.position.multiplyScalar(20)
spotLight.castShadow = true
spotLight.angle = Math.PI / 3
spotLight.penumbra = 0.25
spotLight.decay = 1
spotLight.distance = 2000
spotLight.shadow.mapSize.width = 2048*2
spotLight.shadow.mapSize.height = 2048*2
spotLight.shadow.camera.near = 1
spotLight.shadow.camera.far = 2000
scene.add(spotLight)
#
#hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.75 )
#hemiLight.color.setHSL( 0.6, 1, 0.6 )
#hemiLight.groundColor.setHSL( 0.095, 1, 0.75 )
#hemiLight.position.set( 0, 100, 0 )
#scene.add( hemiLight )
#
#dirLight = new THREE.DirectionalLight( 0xffffff, 1 )
#dirLight.color.setHSL( 0.1, 1, 0.95 )
#dirLight.position.set( -1, 1.75, 1 )
#dirLight.position.multiplyScalar( 200 )
#scene.add( dirLight )
#
#dirLight.castShadow = on
#
#dirLight.shadow.mapSize.width = 2048
#dirLight.shadow.mapSize.height= 2048
#
#d = 1000;
#
#dirLight.shadow.camera.left = -d
#dirLight.shadow.camera.right = d
#dirLight.shadow.camera.top = d
#dirLight.shadow.camera.buttom = -d
#
#dirLight.shadow.camera.far = 3500
#dirLight.shadow.camera.near = -0.0001
#dirLight.shadow.radius = 5
#

# SKYDOME
#
#uniforms = {
#  topColor: 	 { type: "c", value: new THREE.Color( 0x0077ff ) }
#  bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) }
#  offset:		 { type: "f", value: 33 }
#  exponent:	 { type: "f", value: 0.6 }
#}
#
#scene.fog.color.copy( uniforms.bottomColor.value )
#
#skyGeo = new THREE.SphereGeometry( 4000, 32, 15 )
#skyMat = new THREE.ShaderMaterial( vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide )
#
#sky = new THREE.Mesh( skyGeo, skyMat )
#scene.add( sky )
#
##

sandMat = new THREE.MeshPhongMaterial(color: 0xffffff, specular: 0x050505)
sandMat.color.setHSL(0.095, 1, 0.75)
#loader = new THREE.DDSLoader()
#loader.load('textures/classicSand.dds'
#, (texture) ->
#  texture.wrapS = THREE.RepeatWrapping
#  texture.wrapT = THREE.RepeatWrapping
#  texture.repeat.set(16, 16)
#  texture.anisotropy = 2
#  sandMat.map = texture
#  sandMat.needsUpdate = yes
#  console.log("desertSand.jpg load success")
#, undefined
#, (xhr) ->
#  console.log("desertSand.jpg load failed")
#)


planeGeo = new THREE.CircleGeometry( 2000, 16 );
planeMat = sandMat
planeObj = new THREE.Mesh(planeGeo, planeMat)
planeObj.position.set(0, 0, 0)
planeObj.rotation.x = -Math.PI/2
planeObj.receiveShadow = on
scene.add(planeObj)


ctmLoader = new THREE.CTMLoader()
ctmLoader.load("../models/mammoth.ctm"
, (geometry) ->
  mat = new THREE.MeshLambertMaterial(color: 0xcac7b0)
#  mat.emissive.setHex(0x848484)
  ctmObj = new THREE.Mesh(geometry, mat)
  ctmObj.rotation.x = -Math.PI/2
  ctmObj.position.set(0,170,350)
  ctmObj.castShadow = on
  scene.add(ctmObj)
  document.getElementById("loading").style.display = 'none'
, useWorker: yes
)


renderer.gammaInput = yes
renderer.gammaOutput = yes

#axes = new THREE.AxisHelper(20)
#scene.add(axes)

postprocessing = {
  ssao_enabled : true
  render_mode: 0
} # renderMode: 0('framebuffer'), 1('onlyAO')

# Setup render pass
renderPass = new THREE.RenderPass(scene, camera)

# Setup depth pass
depthMaterial = new THREE.MeshDepthMaterial()
depthMaterial.depthPacking = THREE.RGBADepthPacking
depthMaterial.blending = THREE.NoBlending

pars = {
  minFilter: THREE.LinearFilter
  magFilter: THREE.LinearFilter
}
depthRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars )

# Setup SSAO pass
ssaoPass = new THREE.ShaderPass(THREE.SSAOShader)
ssaoPass.renderToScreen = yes
ssaoPass.uniforms[ "tDepth" ].value = depthRenderTarget.texture
ssaoPass.uniforms[ 'size' ].value.set( window.innerWidth, window.innerHeight )
ssaoPass.uniforms[ 'cameraNear' ].value = camera.near
ssaoPass.uniforms[ 'cameraFar' ].value = camera.far
ssaoPass.uniforms[ 'onlyAO' ].value = ( postprocessing.renderMode == 1 )
ssaoPass.uniforms[ 'aoClamp' ].value = 0.3
ssaoPass.uniforms[ 'lumInfluence' ].value = 0.5

# Add pass to effect composer
effectComposer = new THREE.EffectComposer( renderer )
effectComposer.addPass( renderPass )
effectComposer.addPass( ssaoPass )

renderModeChange = (value) ->
  switch value
    when '0'
      postprocessing.ssao_enabled = yes
      ssaoPass.uniforms['onlyAO'].value = no
    when '1'
      postprocessing.ssao_enabled = no
      ssaoPass.uniforms['onlyAO'].value = no
    when '2'
      postprocessing.ssao_enabled = yes
      ssaoPass.uniforms['onlyAO'].value = yes
    else console.error("Not define renderModeChange type: #{value}")


gui = new dat.GUI()
gui.add( postprocessing, "render_mode", { ssao: 0, orignal: 1, aobuffer: 2 } ).onChange( renderModeChange ).listen()


render = ->
  # Render depth into depthRenderTarget

  if postprocessing.ssao_enabled is on
    scene.overrideMaterial = depthMaterial
    renderer.render( scene, camera, depthRenderTarget, true )

    # Render renderPass and SSAO shaderPass
    scene.overrideMaterial = null
    effectComposer.render()
  else
    renderer.render(scene, camera)


# animation loop
do animate = ->
  requestAnimationFrame(animate)
  time = Date.now()
  orbitControl.update()
  render()
  stats.update()




###
  Events Listener
###
onWindowResize = ->
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )

  # Resize renderTargets
  ssaoPass.uniforms[ 'size' ].value.set( window.innerWidth, window.innerHeight )

  newWidth  = Math.floor( window.innerWidth / window.devicePixelRatio ) || 1
  newHeight = Math.floor( window.innerHeight / window.devicePixelRatio ) || 1
  depthRenderTarget.setSize( newWidth, newHeight )
  effectComposer.setSize( newWidth, newHeight )

window.addEventListener('resize', onWindowResize, false)