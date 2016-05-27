#//              ______    _____            _________       _____   _____
#//            /     /_  /    /            \___    /      /    /__/    /
#//           /        \/    /    ___        /    /      /            /    ___
#//          /     / \      /    /\__\      /    /___   /    ___     /    /   \
#//        _/____ /   \___ /    _\___     _/_______ / _/___ / _/___ /    _\___/\_
#//        revised on 5/27/2016  All rights reserved by @NeZha

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



h_2 = 1/900  # delta Time


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
        ax+=" #{q}"
      console.log("#{ax}")




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

massSpring = [[0,0,0], [1,0,0]]
positions = massSpring

eSC1 = new EdgeStrainConstrain(positions,0,1,10000)


solver = new Solver(positions)
solver.addConstrain(eSC1)
solver.initialize()
solver.solve()

massSpring[1][0] = 5
for i in [0...1]
  solver.solve()

console.log(kmath.length(kmath.subVectors(massSpring[0],massSpring[1])))