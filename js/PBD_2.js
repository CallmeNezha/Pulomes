// Generated by CoffeeScript 1.10.0
(function() {
  var DAMPING, DRAG, PBDCloth, PBDVertice, STIFFNESS, TIMESTEP, axes, camera, cloth, clothFrameMaterial, clothGeometry, clothMaterial, clothObj, global, gravity, gui, h, initScene, initStats, light, pins, ref, ref1, ref2, ref3, ref4, render, renderer, scene, stats, t, wind, x1, x2, x3, x4, y1, y2, y3, y4;

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
    windForce: new THREE.Vector3(0, 5, 1)
  };

  TIMESTEP = 18 / 1000;

  STIFFNESS = 1;

  gravity = new THREE.Vector3(0, -98, 0);

  t = 0;

  ref = [Math.cos(t) * 100, Math.sin(t) * 100 + 90], x1 = ref[0], y1 = ref[1];

  ref1 = [Math.cos(t + Math.PI / 2) * 100, Math.sin(t + Math.PI / 2) * 100 + 90], x2 = ref1[0], y2 = ref1[1];

  ref2 = [Math.cos(t + Math.PI) * 100, Math.sin(t * Math.PI) * 100 + 90], x3 = ref2[0], y3 = ref2[1];

  ref3 = [Math.cos(t + Math.PI / 2 * 3) * 100, Math.sin(t * Math.PI / 2 * 3) * 100 + 90], x4 = ref3[0], y4 = ref3[1];

  pins = [
    {
      index: [0, 0],
      position: [-50, 50, 0]
    }, {
      index: [40, 0],
      position: [50, 50, 0]
    }, {
      index: [1640, 0],
      position: [-50, 50, 180]
    }, {
      index: [1680, 0],
      position: [50, 50, 180]
    }, {
      index: [11, 11],
      position: [0, 50, 60]
    }, {
      index: [20, 11],
      position: [20, 50, 70]
    }, {
      index: [11, 22],
      position: [-30, 50, 90]
    }, {
      index: [20, 22],
      position: [-20, 50, 100]
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

    function PBDCloth(restDist, xSegs, ySegs, material) {
      var index, index1, k, l, m, n, o, p, q, ref4, ref5, ref6, ref7, ref8, ref9, u, v;
      this.faces = void 0;
      this.ws = xSegs;
      this.hs = ySegs;
      this.particles = [];
      this.planeFunc = this.plane(restDist, xSegs, ySegs);
      this.collisionProxy = void 0;
      this.constrains = [];
      this.diff = new THREE.Vector3();
      this.bendConstrains = [];
      for (v = k = 0, ref4 = ySegs; 0 <= ref4 ? k <= ref4 : k >= ref4; v = 0 <= ref4 ? ++k : --k) {
        for (u = l = 0, ref5 = xSegs; 0 <= ref5 ? l <= ref5 : l >= ref5; u = 0 <= ref5 ? ++l : --l) {
          p = this.planeFunc(u / xSegs, v / ySegs);
          this.particles.push(new PBDVertice(p.x, p.y, p.z, this.particleMass));
        }
      }
      for (v = m = 0, ref6 = ySegs - 1; 0 <= ref6 ? m <= ref6 : m >= ref6; v = 0 <= ref6 ? ++m : --m) {
        for (u = n = 0, ref7 = xSegs - 1; 0 <= ref7 ? n <= ref7 : n >= ref7; u = 0 <= ref7 ? ++n : --n) {
          index = this.index(u, v);
          index1 = this.index(u, v + 1);
          this.constrains.push([this.particles[index], this.particles[index1], restDist]);
          this.constrains.push([this.particles[this.index(u, v)], this.particles[this.index(u + 1, v)], restDist]);
        }
      }
      u = xSegs;
      for (v = o = 0, ref8 = ySegs - 1; 0 <= ref8 ? o <= ref8 : o >= ref8; v = 0 <= ref8 ? ++o : --o) {
        this.constrains.push([this.particles[this.index(u, v)], this.particles[this.index(u, v + 1)], restDist]);
      }
      v = ySegs;
      for (u = q = 0, ref9 = xSegs - 1; 0 <= ref9 ? q <= ref9 : q >= ref9; u = 0 <= ref9 ? ++q : --q) {
        this.constrains.push([this.particles[this.index(u, v)], this.particles[this.index(u + 1, v)], restDist]);
      }
    }

    PBDCloth.prototype.simulate = function(deltaTime) {
      var bend, bendCorrection, constrain, d0, d1, d2, d3, doot, e, elen, face, faceA, faceB, gForce, invElen, k, l, lambda, len, len1, len2, len3, len4, len5, m, n, n1, n2, normal, o, p0, p1, p2, p3, par0, par1, par2, par3, particle, phi, pin, q, ref10, ref4, ref5, ref6, ref7, ref8, ref9, tmp3, tmp4, tmpForce, x, y;
      tmpForce = new THREE.Vector3();
      if (this.faces == null) {
        console.warn("clothFaces not assigned!");
      }
      if ((wind != null) && (this.faces != null)) {
        ref4 = this.faces;
        for (k = 0, len = ref4.length; k < len; k++) {
          face = ref4[k];
          normal = face.normal;
          tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(wind.windForce));
          this.particles[face.a].addForce(tmpForce);
          this.particles[face.b].addForce(tmpForce);
          this.particles[face.c].addForce(tmpForce);
        }
      }
      gForce = new THREE.Vector3().copy(gravity);
      gForce.multiplyScalar(this.particleMass);
      ref5 = this.particles;
      for (l = 0, len1 = ref5.length; l < len1; l++) {
        particle = ref5[l];
        particle.addForce(gForce);
        particle.integrate(deltaTime, DRAG);
      }
      ref6 = this.constrains;
      for (m = 0, len2 = ref6.length; m < len2; m++) {
        constrain = ref6[m];
        this.applyConstrains(constrain[0], constrain[1], constrain[2], 0);
      }
      for (n = 0, len3 = pins.length; n < len3; n++) {
        pin = pins[n];
        if (pin.index == null) {
          continue;
        }
        ref7 = pin.index, x = ref7[0], y = ref7[1];
        particle = this.particles[this.index(x, y)];
        if (pin.position != null) {
          particle.position.set(pin.position[0], pin.position[1], pin.position[2]);
        } else {
          particle.position.copy(particle.original);
          particle.previous.copy(particle.original);
        }
      }
      ref8 = this.particles;
      for (o = 0, len4 = ref8.length; o < len4; o++) {
        particle = ref8[o];
        if (particle.position.y < -10) {
          particle.position.y = -10;
        }
      }
      bendCorrection = new THREE.Vector3();
      e = new THREE.Vector3();
      n1 = new THREE.Vector3();
      n2 = new THREE.Vector3();
      d0 = new THREE.Vector3();
      d1 = new THREE.Vector3();
      d2 = new THREE.Vector3();
      d3 = new THREE.Vector3();
      ref9 = this.bendConstrains;
      for (q = 0, len5 = ref9.length; q < len5; q++) {
        bend = ref9[q];
        faceA = bend[0], faceB = bend[1], par0 = bend[2], par1 = bend[3], par3 = bend[4], par2 = bend[5];
        ref10 = [par0.position, par1.position, par2.position, par3.position], p0 = ref10[0], p1 = ref10[1], p2 = ref10[2], p3 = ref10[3];
        e.subVectors(p3, p2);
        elen = e.length();
        if (elen < 1e-6) {
          continue;
        }
        invElen = 1 / elen;
        tmp3 = new THREE.Vector3();
        tmp4 = new THREE.Vector3();
        tmp3.subVectors(p3, p0);
        n1.subVectors(p2, p0).cross(tmp3);
        n1.divideScalar(n1.lengthSq());
        tmp3.subVectors(p2, p1);
        n2.subVectors(p3, p1).cross(tmp3);
        n2.divideScalar(n2.lengthSq());
        d0.copy(n1).multiplyScalar(elen);
        d1.copy(n2).multiplyScalar(elen);
        tmp3.copy(n1);
        d2.copy(tmp3.multiplyScalar(d2.subVectors(p0, p3).dot(e) * invElen));
        tmp3.copy(n2);
        d2.add(tmp3.multiplyScalar(tmp4.subVectors(p1, p3).dot(e) * invElen));
        tmp3.copy(n1);
        d3.copy(tmp3.multiplyScalar(d3.subVectors(p2, p0).dot(e) * invElen));
        tmp3.copy(n2);
        d3.add(tmp3.multiplyScalar(tmp4.subVectors(p2, p1).dot(e) * invElen));
        n1.normalize();
        n2.normalize();
        doot = n1.dot(n2);
        if (doot < -1) {
          doot = -1;
        }
        if (doot > 1) {
          doot = 1;
        }
        phi = Math.acos(doot);
        lambda = par0.invmass * d0.lengthSq() + par1.invmass * d1.lengthSq() + par2.invmass * d2.lengthSq() + par3.invmass * d3.lengthSq();
        if (lambda === 0) {
          continue;
        }
        lambda = (phi - global.bendRest) / lambda * global.bendStiff;
        if (n1.cross(n2).dot(e) > 0) {
          lambda = -lambda;
        }
        p0.add(d0.multiplyScalar(-lambda * par0.invmass));
        p1.add(d1.multiplyScalar(-lambda * par1.invmass));
        p2.add(d2.multiplyScalar(-lambda * par2.invmass));
        p3.add(d3.multiplyScalar(-lambda * par3.invmass));
      }
      return this.estimateNewVelocity(deltaTime);
    };

    PBDCloth.prototype.applyConstrains = function(p2, p1, distance, iterTimes) {
      var correction, currectionHalf, currentDist;
      this.diff.subVectors(p2.position, p1.position);
      currentDist = this.diff.length();
      if (currentDist === 0) {
        return;
      }
      correction = this.diff.multiplyScalar(1 - distance / currentDist);
      currectionHalf = correction.multiplyScalar(0.5).multiplyScalar(1 - Math.pow(1 - STIFFNESS, 1 / (iterTimes + 1)));
      p1.position.add(currectionHalf);
      return p2.position.sub(currectionHalf);
    };

    PBDCloth.prototype.estimateNewVelocity = function(deltaTime) {
      var k, len, particle, ref4, results;
      ref4 = this.particles;
      results = [];
      for (k = 0, len = ref4.length; k < len; k++) {
        particle = ref4[k];
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
      var faceA, faceB, i, j, k, l, m, n, o, ref4, ref5, ref6, ref7, ref8, results;
      this.faces = geoFaces;
      for (j = k = 0, ref4 = this.hs - 1; 0 <= ref4 ? k <= ref4 : k >= ref4; j = 0 <= ref4 ? ++k : --k) {
        for (i = l = 0, ref5 = this.ws - 1; 0 <= ref5 ? l <= ref5 : l >= ref5; i = 0 <= ref5 ? ++l : --l) {
          faceA = this.faces[i * 2 + j * this.ws * 2];
          faceB = this.faces[i * 2 + 1 + j * this.ws * 2];
          this.bendConstrains.push([faceA, faceB, this.particles[faceA.a], this.particles[faceB.b], this.particles[faceA.b], this.particles[faceA.c]]);
        }
      }
      for (j = m = 0, ref6 = this.hs - 1; 0 <= ref6 ? m <= ref6 : m >= ref6; j = 0 <= ref6 ? ++m : --m) {
        for (i = n = 0, ref7 = this.ws - 2; 0 <= ref7 ? n <= ref7 : n >= ref7; i = 0 <= ref7 ? ++n : --n) {
          faceA = this.faces[i * 2 + 1 + j * this.ws * 2];
          faceB = this.faces[i * 2 + 2 + j * this.ws * 2];
          this.bendConstrains.push([faceA, faceB, this.particles[faceA.c], this.particles[faceB.b], this.particles[faceA.a], this.particles[faceA.b]]);
        }
      }
      results = [];
      for (i = o = 0, ref8 = this.ws - 1; 0 <= ref8 ? o <= ref8 : o >= ref8; i = 0 <= ref8 ? ++o : --o) {
        results.push((function() {
          var q, ref9, results1;
          results1 = [];
          for (j = q = 0, ref9 = this.hs - 2; 0 <= ref9 ? q <= ref9 : q >= ref9; j = 0 <= ref9 ? ++q : --q) {
            faceA = this.faces[i * 2 + 1 + j * this.ws * 2];
            faceB = this.faces[i * 2 + (j + 1) * this.ws * 2];
            results1.push(this.bendConstrains.push([faceA, faceB, this.particles[faceA.a], this.particles[faceB.c], this.particles[faceB.a], this.particles[faceB.b]]));
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    return PBDCloth;

  })();

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
    renderer.setClearColor(0xEEEEEE);
    renderer.setSize(window.innerWidth, window.innerHeight);
    return {
      scene: scene,
      camera: camera,
      renderer: renderer
    };
  };

  stats = initStats();

  document.getElementById("stats-output").appendChild(stats.domElement);

  ref4 = initScene(), scene = ref4.scene, camera = ref4.camera, renderer = ref4.renderer;

  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x666666));

  light = new THREE.DirectionalLight(0xdfebff, 0.8);

  light.position.set(50, 200, 100);

  scene.add(light);

  cloth = new PBDCloth(3, 40, 40);

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

  h = gui.addFolder("Cloth Coefficient");

  h.add(global, "bendRest", 0, Math.PI);

  h.add(global, "bendStiff", 0, 1.5);

  axes = new THREE.AxisHelper(20);

  scene.add(axes);

  render = function() {
    var i, k, len, particle, ref5;
    cloth.simulate(TIMESTEP);
    ref5 = cloth.particles;
    for (i = k = 0, len = ref5.length; k < len; i = ++k) {
      particle = ref5[i];
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

//# sourceMappingURL=PBD_2.js.map
