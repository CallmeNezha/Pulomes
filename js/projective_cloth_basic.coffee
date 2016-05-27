#//              ______    _____            _________       _____   _____
#//            /     /_  /    /            \___    /      /    /__/    /
#//           /        \/    /    ___        /    /      /            /    ___
#//          /     / \      /    /\__\      /    /___   /    ___     /    /   \
#//        _/____ /   \___ /    _\___     _/_______ / _/___ / _/___ /    _\___/\_
#//        revised on 5/28/2016  All rights reserved by @NeZha

kmath =
  subVectors: (v1, v2) ->
    [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]

  lengthSq: (v) ->
    v[0]*v[0]+v[1]*v[1]+v[2]*v[2]

  length: (v) ->
    Math.sqrt(@lengthSq(v))

  divVector: (v, scalar) ->
    v[0] /= scalar; v[1] /= scalar; v[2] /= scalar;

  mulVector: (v, scalar) ->
    v[0] *= scalar; v[1] *= scalar; v[2] *= scalar;

  createZeroMatrix: (row, column) ->
    mt = []
    for r in [0...row]
      mt.push(tmp = (0 for c in [0...column]))
    mt
  createIndentityMatrix: (row) ->
    mt = @createZeroMatrix(row,row)
    for r in [0...row]
      mt[r][r] = 1
    mt
  diagonalMultiply: (mt, scalar) ->
    for r in [0...mt.length]
      mt[r][r] *= scalar

  getColumn: (mt, c) ->
    (mt[r][c] for r in [0...mt.length])



h_2 =  (18 / 1000)*(18 / 1000) # delta Time


class Solver
  constructor: (points) ->
    @points       = points
    @projections  = undefined
    @constrains   = []
    @ASMtRowId    = 0
    @ASMt_t       = []
    @N            = undefined  # sparse (AS)^T * AS
    @ASSparse     = undefined
    @ASSparse_t   = undefined
    @elements     = []
    @M            = undefined
    @LUP          = undefined

  addConstrain: (constrain) ->
    @constrains.push(constrain)

  initialize: () ->
    for c in @constrains
      @ASMtRowId = c.addConstrainMt(@elements,@ASMtRowId)
    @ASMt_t = kmath.createZeroMatrix(@ASMtRowId,@points.length)
    @projections = kmath.createZeroMatrix(@ASMtRowId,3)

    for e in @elements
      @ASMt_t[e[0]][e[1]] += e[2]


    @ASSparse = numeric.ccsSparse(@ASMt_t)
    @ASMt_t = numeric.transpose(@ASMt_t)
    @ASSparse_t = numeric.ccsSparse(@ASMt_t)
    @N = numeric.ccsDot(@ASSparse_t, @ASSparse)

    @M = kmath.createIndentityMatrix(@points.length)
    kmath.diagonalMultiply(@M, 1/h_2)
    @N = numeric.ccsadd(numeric.ccsSparse(@M), @N)
    @LUP = numeric.ccsLUP(@N)

  solve: () ->
    for c in @constrains
      c.project(@points, @projections)
    sum = numeric.dotMMbig(@ASMt_t, @projections)


    momentum = numeric.dotMMbig(@M, @points)
    rhs = numeric.add(momentum, sum)

    for c in [0...3]
      vs = kmath.getColumn(rhs,c)
      qs = numeric.ccsLUPSolve(@LUP,vs)
      ax = switch c
        when 0 then "x"
        when 1 then "y"
        when 2 then "z"
      for q, i in qs
        @points[i][c] = q
#        ax+=" #{q}"
#      console.log("#{ax}")






class EdgeStrainConstrain
  constructor: (positions, pid1, pid2, weight, rangeMin=1, rangeMax=1) ->
    @pid1     = pid1
    @pid2     = pid2
    @rMin     = rangeMin
    @rMax     = rangeMax


    len = kmath.length( kmath.subVectors(positions[pid2],positions[pid1]) )
    @invRest  = if len is 0 then 0 else 1/len
    @weight   = weight*Math.sqrt( len )
    @cid      = -1


  addConstrainMt: (elements, row) ->
    @cid = row
    elements.push([row,@pid1,-@weight*@invRest]) #*-Math.sqrt(0.5)
    elements.push([row,@pid2, @weight*@invRest]) #* Math.sqrt(0.5)
    ++row

  project: (positions, projections) ->
    edge = kmath.subVectors(positions[@pid2],positions[@pid1])
    l = kmath.length(edge)
    kmath.divVector(edge, l)
    l = THREE.Math.clamp(l*@invRest,@rMin,@rMax)
    kmath.mulVector(edge, l*@weight)             #*Math.sqrt(0.5)
    projections[@cid] = edge


#------ Test Start ------#

#massSpring = [[0,0,0], [1,0,0],[1,-1,0]]
#positions = massSpring
#
#eSC1 = new EdgeStrainConstrain(positions,0,1,1)
#eSC2 = new EdgeStrainConstrain(positions,1,2,1)
#
#solver = new Solver(positions)
#solver.addConstrain(eSC1)
#solver.addConstrain(eSC2)
#solver.initialize()
#solver.solve()
#
#massSpring[1][0] = 5
#for i in [0...100]
#  solver.solve()
#
#console.log(kmath.length(kmath.subVectors(massSpring[0],massSpring[1])))
#console.log(kmath.length(kmath.subVectors(massSpring[2],massSpring[1])))

positions   = []
projections = []
solver = new Solver(positions)

global = {
  lerp: (s, e, t) ->
    if 1 >= t >= 0 then return (e - s) * t + s
    if t < 0 then return s
    if t > 1 then return e

  swap: (a, b) ->
    c = a
    a = b
    b = c
  bendStiff: 0.1
  bendRest:0.33
  wireframe: on
}

DAMPING = 0.03
DRAG    = 1 - 0.03
wind =
  windForce: new THREE.Vector3(5,2.2,10.5)
TIMESTEP = 18 / 1000
STIFFNESS = 90

gravity = new THREE.Vector3(0,-98,0)

pins = [
  {
    index:[0,0]
  }
,{
    index:[30,0]
  }
]

class PBDVertice
  constructor: (x, y, z, mass) -> #position: Three.Vector3, mass: Float
    @previous = new THREE.Vector3(x, y, z)
    @position = new THREE.Vector3(x, y, z)
    @original = new THREE.Vector3(x, y, z)
    @velocity = new THREE.Vector3(0, 0, 0)
    @tmp      = new THREE.Vector3()
    @tmp2     = new THREE.Vector3()
    @mass     = if mass? then mass else 0
    @invmass  = if @mass is 0 then 0 else 1 / @mass #should not be changed after initialization
    @a        = new THREE.Vector3(0, 0, 0)

  addForce: (force) ->
    @tmp.copy(force).multiplyScalar(@invmass)
    @a.add(@tmp)

  integrate: (deltaTime,drag) ->
    diff = @tmp2
    @velocity.add(@a.multiplyScalar(deltaTime))
    #console.log(@velocity.x+","+@velocity.y+","+@velocity.z+",")
    diff.copy(@velocity).multiplyScalar(drag * deltaTime).add(@position)
    @tmp2 = @previous
    @previous = @position
    @position = diff
    @a.set(0, 0, 0)

class PBDCloth
  particleMass:     0.1
  lastTime:         undefined
  constructor: (restDist, xSegs, ySegs) ->
    @faces      = undefined
    @ws         = xSegs
    @hs         = ySegs
    @particles  = []
    @planeFunc  = @plane(restDist, xSegs, ySegs)
    @collisionProxy = undefined
    @constrains = []
    @diff       = new THREE.Vector3()
    @bendConstrains = []

    for v in [0..ySegs]
      for u in [0..xSegs]
        p = @planeFunc( u / xSegs,  v / ySegs )
        @particles.push( new PBDVertice(p.x, p.y, p.z, @particleMass) )
        positions.push([p.x,p.y,p.z])


    # particle 2 particle constrains
    for v in [0...ySegs]
      for u in [0...xSegs]
        index = @index(u, v)
        index1 = @index(u, v+1)
        solver.addConstrain(new EdgeStrainConstrain(positions,index,index1,STIFFNESS))
        index = @index(u, v)
        index1 = @index(u+1, v)
        solver.addConstrain(new EdgeStrainConstrain(positions,index,index1,STIFFNESS))
    u = xSegs
    for v in [0...ySegs]
      index = @index(u, v)
      index1 = @index(u, v+1)
      solver.addConstrain(new EdgeStrainConstrain(positions,index,index1,STIFFNESS))

    v = ySegs
    for u in [0...xSegs]
      index = @index(u, v)
      index1 = @index(u+1, v)
      solver.addConstrain(new EdgeStrainConstrain(positions,index,index1,STIFFNESS))

    solver.initialize()


  estimateNewVelocity: (deltaTime) ->
    for particle in @particles
      particle.velocity.subVectors(particle.position,particle.previous).multiplyScalar(1/deltaTime)

  plane: (restDist, xSegs, ySegs) ->
    w = xSegs*restDist
    h = ySegs*restDist
    (u, v) ->
      xPos = global.lerp(-w/2, w/2, u)
      yPos = global.lerp(h/2, 3*h/2, v)
      new THREE.Vector3(xPos, yPos, 0)

  index: (u, v) ->
    u + v*(@ws + 1)

  setFaces: (geoFaces) ->
    @faces = geoFaces

  simulate: (deltaTime) ->
    #AeroForces
    tmpForce = new THREE.Vector3()
    if not @faces?
      console.warn("clothFaces not assigned!")
    if wind? and @faces?
      for face in @faces
        normal = face.normal
        tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(wind.windForce))
        @particles[face.a].addForce(tmpForce)
        @particles[face.b].addForce(tmpForce)
        @particles[face.c].addForce(tmpForce)

    gForce = new THREE.Vector3().copy(gravity)
    gForce.multiplyScalar(@particleMass)
    for particle in @particles
      particle.addForce(gForce)
      particle.integrate(deltaTime, DRAG)

    #Pin Constrains
    for pin in pins
      if not pin.index? then continue
      [x, y] = pin.index
      particle = @particles[@index(x,y)]
      if pin.position?
        particle.position.set(pin.position[0], pin.position[1], pin.position[2])
      else
        particle.position.copy(particle.original)
        particle.previous.copy(particle.original)

    #since we have integrate Sn , update it
    for particle, i in @particles
      positions[i][0] = particle.position.x; positions[i][1] = particle.position.y; positions[i][2] = particle.position.z;
    for i in [0...1]
      solver.solve()

    for particle, i in @particles
      particle.position.x = positions[i][0]; particle.position.y = positions[i][1]; particle.position.z = positions[i][2];



    @estimateNewVelocity(deltaTime)

onWindowResize = ->
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )

window.addEventListener('resize', onWindowResize, false)

orbitControls = undefined
initStats = ->
  stats = new Stats()
  stats.setMode(0)
  stats.domElement.style.position = 'absolute'
  stats.domElement.style.left = '0px'
  stats.domElement.style.top = '0px'
  stats

initScene = ->
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000)
  camera.position.x = -100
  camera.position.y = 400
  camera.position.z = 300
  camera.lookAt(new THREE.Vector3(300,0,300))
  renderer = new THREE.WebGLRenderer(antialias: on)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0xEEEEEE)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = off
  # the orbit mouse control is often used
  orbitControls = new THREE.OrbitControls(camera)
  orbitControls.center.set(0,0,150)
  orbitControls.autoRotate = off
  {scene, camera, renderer}


stats = initStats()
document.getElementById("stats-output").appendChild(stats.domElement)
{scene, camera, renderer} = initScene()
document.body.appendChild(renderer.domElement)

scene.add( new THREE.AmbientLight( 0x666666, 1.0 ) )
light = new THREE.DirectionalLight( 0xdfebff, 1.0 )
light.position.set( 50, 200, -100 )
light.castShadow = false
light.shadow.camera.near = 2
light.shadow.camera.far = 1000
light.shadow.camera.left = -500
light.shadow.camera.right = 500
light.shadow.camera.top= 500
light.shadow.camera.bottom= -500
light.shadow.mapSize.width = 1024
light.shadow.mapSize.height = 1024
scene.add(light)

axes = new THREE.AxisHelper(20)
axes.position.set(0,0,150)
scene.add(axes)


cloth = new PBDCloth(5,30,30)
clothMaterial = new THREE.MeshLambertMaterial(color: 0x22b5ff, side: THREE.DoubleSide)
clothFrameMaterial = new THREE.MeshBasicMaterial(color:0xff0000, wireframe: on)
clothGeometry = new THREE.ParametricGeometry(cloth.planeFunc, cloth.ws, cloth.hs)
cloth.setFaces(clothGeometry.faces)
clothObj = THREE.SceneUtils.createMultiMaterialObject(clothGeometry,[clothMaterial,clothFrameMaterial])
clothObj.position.set(0, 0, 0)
scene.add(clothObj)



gui = new dat.GUI()
gui.add(global,"wireframe").onChange()
h = gui.addFolder( "Wind Force" )
h.add(wind.windForce,"x",-10,20)
h.add(wind.windForce,"y",-10,20)
h.add(wind.windForce,"z",-10,20)

#h = gui.addFolder( "Cloth Coefficient" )
#h.add(global, "bendRest", 0, Math.PI)
#h.add(global, "bendStiff", 0, 1.5)
clock = new THREE.Clock()
render = ->
  delta = clock.getDelta()
  orbitControls.update(delta)

  cloth.simulate(TIMESTEP)
  for particle, i in cloth.particles
    clothGeometry.vertices[i].copy(particle.position)


  clothGeometry.computeFaceNormals()
  clothGeometry.computeVertexNormals()
  clothGeometry.normalsNeedUpdate = yes
  clothGeometry.verticesNeedUpdate = yes
  clothFrameMaterial.wireframe = global.wireframe



  stats.update()
  requestAnimationFrame(render)
  renderer.render(scene, camera)

document.getElementById("loading").style.display = 'none'
render()