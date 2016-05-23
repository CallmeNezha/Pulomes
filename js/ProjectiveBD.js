// Generated by CoffeeScript 1.10.0
(function() {
  var DAMPING, DRAG, EdgeStrainConstrain, PBDCloth, PBDVertice, STIFFNESS, Solver, TIMESTEP, axes, camera, clock, cloth, clothFrameMaterial, clothGeometry, clothMaterial, clothObj, global, gravity, gui, h, h_2, initScene, initStats, kmath, light, orbitControls, pins, positions, projections, ref, render, renderer, scene, solver, stats, wind;

  kmath = {
    subVectors: function(v1, v2) {
      return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
    },
    lengthSq: function(v) {
      return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    },
    length: function(v) {
      return Math.sqrt(this.lengthSq(v));
    },
    divVector: function(v, scalar) {
      v[0] /= scalar;
      v[1] /= scalar;
      return v[2] /= scalar;
    },
    mulVector: function(v, scalar) {
      v[0] *= scalar;
      v[1] *= scalar;
      return v[2] *= scalar;
    },
    createZeroMatrix: function(row, column) {
      var c, j, mt, r, ref, tmp;
      mt = [];
      for (r = j = 0, ref = row; 0 <= ref ? j < ref : j > ref; r = 0 <= ref ? ++j : --j) {
        mt.push(tmp = (function() {
          var k, ref1, results;
          results = [];
          for (c = k = 0, ref1 = column; 0 <= ref1 ? k < ref1 : k > ref1; c = 0 <= ref1 ? ++k : --k) {
            results.push(0);
          }
          return results;
        })());
      }
      return mt;
    },
    createIndentityMatrix: function(row) {
      var j, mt, r, ref;
      mt = this.createZeroMatrix(row, row);
      for (r = j = 0, ref = row; 0 <= ref ? j < ref : j > ref; r = 0 <= ref ? ++j : --j) {
        mt[r][r] = 1;
      }
      return mt;
    },
    diagonalMultiply: function(mt, scalar) {
      var j, r, ref, results;
      results = [];
      for (r = j = 0, ref = mt.length; 0 <= ref ? j < ref : j > ref; r = 0 <= ref ? ++j : --j) {
        results.push(mt[r][r] *= scalar);
      }
      return results;
    },
    getColumn: function(mt, c) {
      var j, r, ref, results;
      results = [];
      for (r = j = 0, ref = mt.length; 0 <= ref ? j < ref : j > ref; r = 0 <= ref ? ++j : --j) {
        results.push(mt[r][c]);
      }
      return results;
    }
  };

  h_2 = (18 / 1000) * (18 / 1000);

  Solver = (function() {
    function Solver(points) {
      this.points = points;
      this.projections = void 0;
      this.constrains = [];
      this.ASMtRowId = 0;
      this.ASMt_t = [];
      this.N = void 0;
      this.ASSparse = void 0;
      this.ASSparse_t = void 0;
      this.elements = [];
      this.M = void 0;
      this.LUP = void 0;
    }

    Solver.prototype.addConstrain = function(constrain) {
      return this.constrains.push(constrain);
    };

    Solver.prototype.initialize = function() {
      var c, e, j, k, len1, len2, ref, ref1;
      ref = this.constrains;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        c = ref[j];
        this.ASMtRowId = c.addConstrainMt(this.elements, this.ASMtRowId);
      }
      this.ASMt_t = kmath.createZeroMatrix(this.ASMtRowId, this.points.length);
      this.projections = kmath.createZeroMatrix(this.ASMtRowId, 3);
      ref1 = this.elements;
      for (k = 0, len2 = ref1.length; k < len2; k++) {
        e = ref1[k];
        this.ASMt_t[e[0]][e[1]] += e[2];
      }
      this.ASSparse = numeric.ccsSparse(this.ASMt_t);
      this.ASMt_t = numeric.transpose(this.ASMt_t);
      this.ASSparse_t = numeric.ccsSparse(this.ASMt_t);
      this.N = numeric.ccsDot(this.ASSparse_t, this.ASSparse);
      this.M = kmath.createIndentityMatrix(this.points.length);
      kmath.diagonalMultiply(this.M, 1 / h_2);
      this.N = numeric.ccsadd(numeric.ccsSparse(this.M), this.N);
      return this.LUP = numeric.ccsLUP(this.N);
    };

    Solver.prototype.solve = function() {
      var ax, c, i, j, k, len1, momentum, q, qs, ref, results, rhs, sum, vs;
      ref = this.constrains;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        c = ref[j];
        c.project(this.points, this.projections);
      }
      sum = numeric.dotMMbig(this.ASMt_t, this.projections);
      momentum = numeric.dotMMbig(this.M, this.points);
      rhs = numeric.add(momentum, sum);
      results = [];
      for (c = k = 0; k < 3; c = ++k) {
        vs = kmath.getColumn(rhs, c);
        qs = numeric.ccsLUPSolve(this.LUP, vs);
        ax = (function() {
          switch (c) {
            case 0:
              return "x";
            case 1:
              return "y";
            case 2:
              return "z";
          }
        })();
        results.push((function() {
          var len2, m, results1;
          results1 = [];
          for (i = m = 0, len2 = qs.length; m < len2; i = ++m) {
            q = qs[i];
            results1.push(this.points[i][c] = q);
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    return Solver;

  })();

  EdgeStrainConstrain = (function() {
    function EdgeStrainConstrain(positions, pid1, pid2, weight, rangeMin, rangeMax) {
      var len;
      if (rangeMin == null) {
        rangeMin = 1;
      }
      if (rangeMax == null) {
        rangeMax = 1;
      }
      this.pid1 = pid1;
      this.pid2 = pid2;
      this.rMin = rangeMin;
      this.rMax = rangeMax;
      len = kmath.length(kmath.subVectors(positions[pid2], positions[pid1]));
      this.invRest = len === 0 ? 0 : 1 / len;
      this.weight = weight * Math.sqrt(len);
      this.cid = -1;
    }

    EdgeStrainConstrain.prototype.addConstrainMt = function(elements, row) {
      this.cid = row;
      elements.push([row, this.pid1, -this.weight * this.invRest]);
      elements.push([row, this.pid2, this.weight * this.invRest]);
      return ++row;
    };

    EdgeStrainConstrain.prototype.project = function(positions, projections) {
      var edge, l;
      edge = kmath.subVectors(positions[this.pid2], positions[this.pid1]);
      l = kmath.length(edge);
      kmath.divVector(edge, l);
      l = THREE.Math.clamp(l * this.invRest, this.rMin, this.rMax);
      kmath.mulVector(edge, l * this.weight);
      return projections[this.cid] = edge;
    };

    return EdgeStrainConstrain;

  })();

  positions = [];

  projections = [];

  solver = new Solver(positions);

  global = {
    lerp: function(s, e, t) {
      if ((1 >= t && t >= 0)) {
        return (e - s) * t + s;
      }
      if (t < 0) {
        return s;
      }
      if (t > 1) {
        return e;
      }
    },
    swap: function(a, b) {
      var c;
      c = a;
      a = b;
      return b = c;
    },
    bendStiff: 0.1,
    bendRest: 0.33,
    wireframe: true
  };

  DAMPING = 0.03;

  DRAG = 1 - 0.03;

  wind = {
    windForce: new THREE.Vector3(0, 5, 15)
  };

  TIMESTEP = 18 / 1000;

  STIFFNESS = 90;

  gravity = new THREE.Vector3(0, -98, 0);

  pins = [
    {
      index: [0, 0]
    }, {
      index: [20, 0]
    }
  ];

  PBDVertice = (function() {
    function PBDVertice(x, y, z, mass) {
      this.previous = new THREE.Vector3(x, y, z);
      this.position = new THREE.Vector3(x, y, z);
      this.original = new THREE.Vector3(x, y, z);
      this.velocity = new THREE.Vector3(0, 0, 0);
      this.tmp = new THREE.Vector3();
      this.tmp2 = new THREE.Vector3();
      this.mass = mass != null ? mass : 0;
      this.invmass = this.mass === 0 ? 0 : 1 / this.mass;
      this.a = new THREE.Vector3(0, 0, 0);
    }

    PBDVertice.prototype.addForce = function(force) {
      this.tmp.copy(force).multiplyScalar(this.invmass);
      return this.a.add(this.tmp);
    };

    PBDVertice.prototype.integrate = function(deltaTime, drag) {
      var diff;
      diff = this.tmp2;
      this.velocity.add(this.a.multiplyScalar(deltaTime));
      diff.copy(this.velocity).multiplyScalar(drag * deltaTime).add(this.position);
      this.tmp2 = this.previous;
      this.previous = this.position;
      this.position = diff;
      return this.a.set(0, 0, 0);
    };

    return PBDVertice;

  })();

  PBDCloth = (function() {
    PBDCloth.prototype.particleMass = 0.1;

    PBDCloth.prototype.lastTime = void 0;

    function PBDCloth(restDist, xSegs, ySegs) {
      var aa, index, index1, j, k, m, n, o, p, ref, ref1, ref2, ref3, ref4, ref5, u, v;
      this.faces = void 0;
      this.ws = xSegs;
      this.hs = ySegs;
      this.particles = [];
      this.planeFunc = this.plane(restDist, xSegs, ySegs);
      this.collisionProxy = void 0;
      this.constrains = [];
      this.diff = new THREE.Vector3();
      this.bendConstrains = [];
      for (v = j = 0, ref = ySegs; 0 <= ref ? j <= ref : j >= ref; v = 0 <= ref ? ++j : --j) {
        for (u = k = 0, ref1 = xSegs; 0 <= ref1 ? k <= ref1 : k >= ref1; u = 0 <= ref1 ? ++k : --k) {
          p = this.planeFunc(u / xSegs, v / ySegs);
          this.particles.push(new PBDVertice(p.x, p.y, p.z, this.particleMass));
          positions.push([p.x, p.y, p.z]);
        }
      }
      for (v = m = 0, ref2 = ySegs; 0 <= ref2 ? m < ref2 : m > ref2; v = 0 <= ref2 ? ++m : --m) {
        for (u = n = 0, ref3 = xSegs; 0 <= ref3 ? n < ref3 : n > ref3; u = 0 <= ref3 ? ++n : --n) {
          index = this.index(u, v);
          index1 = this.index(u, v + 1);
          solver.addConstrain(new EdgeStrainConstrain(positions, index, index1, STIFFNESS));
          index = this.index(u, v);
          index1 = this.index(u + 1, v);
          solver.addConstrain(new EdgeStrainConstrain(positions, index, index1, STIFFNESS));
        }
      }
      u = xSegs;
      for (v = o = 0, ref4 = ySegs; 0 <= ref4 ? o < ref4 : o > ref4; v = 0 <= ref4 ? ++o : --o) {
        index = this.index(u, v);
        index1 = this.index(u, v + 1);
        solver.addConstrain(new EdgeStrainConstrain(positions, index, index1, STIFFNESS));
      }
      v = ySegs;
      for (u = aa = 0, ref5 = xSegs; 0 <= ref5 ? aa < ref5 : aa > ref5; u = 0 <= ref5 ? ++aa : --aa) {
        index = this.index(u, v);
        index1 = this.index(u + 1, v);
        solver.addConstrain(new EdgeStrainConstrain(positions, index, index1, STIFFNESS));
      }
      solver.initialize();
    }

    PBDCloth.prototype.estimateNewVelocity = function(deltaTime) {
      var j, len1, particle, ref, results;
      ref = this.particles;
      results = [];
      for (j = 0, len1 = ref.length; j < len1; j++) {
        particle = ref[j];
        results.push(particle.velocity.subVectors(particle.position, particle.previous).multiplyScalar(1 / deltaTime));
      }
      return results;
    };

    PBDCloth.prototype.plane = function(restDist, xSegs, ySegs) {
      var h, w;
      w = xSegs * restDist;
      h = ySegs * restDist;
      return function(u, v) {
        var xPos, yPos;
        xPos = global.lerp(-w / 2, w / 2, u);
        yPos = global.lerp(h / 2, 3 * h / 2, v);
        return new THREE.Vector3(xPos, yPos, 0);
      };
    };

    PBDCloth.prototype.index = function(u, v) {
      return u + v * (this.ws + 1);
    };

    PBDCloth.prototype.setFaces = function(geoFaces) {
      return this.faces = geoFaces;
    };

    PBDCloth.prototype.simulate = function(deltaTime) {
      var aa, face, gForce, i, j, k, len1, len2, len3, len4, len5, m, n, normal, o, particle, pin, ref, ref1, ref2, ref3, ref4, tmpForce, x, y;
      tmpForce = new THREE.Vector3();
      if (this.faces == null) {
        console.warn("clothFaces not assigned!");
      }
      if ((wind != null) && (this.faces != null)) {
        ref = this.faces;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          face = ref[j];
          normal = face.normal;
          tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(wind.windForce));
          this.particles[face.a].addForce(tmpForce);
          this.particles[face.b].addForce(tmpForce);
          this.particles[face.c].addForce(tmpForce);
        }
      }
      gForce = new THREE.Vector3().copy(gravity);
      gForce.multiplyScalar(this.particleMass);
      ref1 = this.particles;
      for (k = 0, len2 = ref1.length; k < len2; k++) {
        particle = ref1[k];
        particle.addForce(gForce);
        particle.integrate(deltaTime, DRAG);
      }
      for (m = 0, len3 = pins.length; m < len3; m++) {
        pin = pins[m];
        if (pin.index == null) {
          continue;
        }
        ref2 = pin.index, x = ref2[0], y = ref2[1];
        particle = this.particles[this.index(x, y)];
        if (pin.position != null) {
          particle.position.set(pin.position[0], pin.position[1], pin.position[2]);
        } else {
          particle.position.copy(particle.original);
          particle.previous.copy(particle.original);
        }
      }
      ref3 = this.particles;
      for (i = n = 0, len4 = ref3.length; n < len4; i = ++n) {
        particle = ref3[i];
        positions[i][0] = particle.position.x;
        positions[i][1] = particle.position.y;
        positions[i][2] = particle.position.z;
      }
      for (i = o = 0; o < 1; i = ++o) {
        solver.solve();
      }
      ref4 = this.particles;
      for (i = aa = 0, len5 = ref4.length; aa < len5; i = ++aa) {
        particle = ref4[i];
        particle.position.x = positions[i][0];
        particle.position.y = positions[i][1];
        particle.position.z = positions[i][2];
      }
      return this.estimateNewVelocity(deltaTime);
    };

    return PBDCloth;

  })();

  orbitControls = void 0;

  initStats = function() {
    var stats;
    stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    return stats;
  };

  initScene = function() {
    var camera, renderer, scene;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = -300;
    camera.position.y = 400;
    camera.position.z = 300;
    camera.lookAt(scene.position);
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xEEEEEE);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    orbitControls = new THREE.OrbitControls(camera);
    orbitControls.autoRotate = false;
    return {
      scene: scene,
      camera: camera,
      renderer: renderer
    };
  };

  stats = initStats();

  document.getElementById("stats-output").appendChild(stats.domElement);

  ref = initScene(), scene = ref.scene, camera = ref.camera, renderer = ref.renderer;

  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x666666));

  light = new THREE.DirectionalLight(0xdfebff, 1.75);

  light.position.set(50, 200, -100);

  light.castShadow = true;

  light.shadow.camera.near = 2;

  light.shadow.camera.far = 1000;

  light.shadow.camera.left = -500;

  light.shadow.camera.right = 500;

  light.shadow.camera.top = 500;

  light.shadow.camera.bottom = -500;

  light.shadow.mapSize.width = 1024;

  light.shadow.mapSize.height = 1024;

  scene.add(light);

  axes = new THREE.AxisHelper(20);

  scene.add(axes);

  cloth = new PBDCloth(5, 20, 20);

  clothMaterial = new THREE.MeshLambertMaterial({
    color: 0x22b5ff,
    side: THREE.DoubleSide
  });

  clothFrameMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true
  });

  clothGeometry = new THREE.ParametricGeometry(cloth.planeFunc, cloth.ws, cloth.hs);

  cloth.setFaces(clothGeometry.faces);

  clothObj = THREE.SceneUtils.createMultiMaterialObject(clothGeometry, [clothMaterial, clothFrameMaterial]);

  clothObj.position.set(0, 0, 0);

  scene.add(clothObj);

  gui = new dat.GUI();

  gui.add(global, "wireframe").onChange();

  h = gui.addFolder("Wind Force");

  h.add(wind.windForce, "x", -10, 20);

  h.add(wind.windForce, "y", -10, 20);

  h.add(wind.windForce, "z", -10, 20);

  clock = new THREE.Clock();

  render = function() {
    var delta, i, j, len1, particle, ref1;
    delta = clock.getDelta();
    orbitControls.update(delta);
    cloth.simulate(TIMESTEP);
    ref1 = cloth.particles;
    for (i = j = 0, len1 = ref1.length; j < len1; i = ++j) {
      particle = ref1[i];
      clothGeometry.vertices[i].copy(particle.position);
    }
    clothGeometry.computeFaceNormals();
    clothGeometry.computeVertexNormals();
    clothGeometry.normalsNeedUpdate = true;
    clothGeometry.verticesNeedUpdate = true;
    clothFrameMaterial.wireframe = global.wireframe;
    stats.update();
    requestAnimationFrame(render);
    return renderer.render(scene, camera);
  };

  render();

}).call(this);

//# sourceMappingURL=ProjectiveBD.js.map
