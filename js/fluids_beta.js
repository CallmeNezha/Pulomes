// Generated by CoffeeScript 1.10.0
(function() {
  var animate, camera, fragmentShader, gui, initScene, initStats, onWindowResize, orbitControl, planeGeo, planeMat, planeObj, ref, render, renderer, scene, spotLight, stats, vertexShader;

  vertexShader = 'varying vec3 vWorldPosition;\n\nvoid main() {\n\n	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );\n	vWorldPosition = worldPosition.xyz;\n\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n}';

  fragmentShader = 'uniform vec3 topColor;\nuniform vec3 bottomColor;\nuniform float offset;\nuniform float exponent;\n\nvarying vec3 vWorldPosition;\n\nvoid main() {\n\n	float h = normalize( vWorldPosition + offset ).y;\n	gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );\n\n}';

  initStats = function() {
    var stats;
    stats = new Stats();
    stats.setMode(0);
    return stats;
  };

  initScene = function() {
    var camera, renderer, scene;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5001);
    camera.position.x = 300;
    camera.position.y = 180;
    camera.position.z = 300;
    camera.position.multiplyScalar(1.7);
    camera.lookAt(scene.position);
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    return {
      scene: scene,
      camera: camera,
      renderer: renderer
    };
  };

  stats = initStats();

  ref = initScene(), scene = ref.scene, camera = ref.camera, renderer = ref.renderer;

  if (renderer.extensions.get('ANGLE_instanced_arrays') === false) {
    document.getElementById("notSupported").style.display = "";
    return;
  }

  document.getElementById("stats-output").appendChild(stats.domElement);

  document.getElementById('webgl-output').appendChild(renderer.domElement);

  orbitControl = new THREE.OrbitControls(camera, renderer.domElement);

  orbitControl.maxDistance = 1000;

  orbitControl.minDistance = 1;

  orbitControl.center.copy(scene.position);

  spotLight = new THREE.SpotLight(0xffffff, 1);

  spotLight.position.set(15, 40, 35);

  spotLight.position.multiplyScalar(20);

  spotLight.castShadow = true;

  spotLight.angle = Math.PI / 3;

  spotLight.penumbra = 0.25;

  spotLight.decay = 1;

  spotLight.distance = 2000;

  spotLight.shadow.mapSize.width = 2048;

  spotLight.shadow.mapSize.height = 2048;

  spotLight.shadow.camera.near = 1;

  spotLight.shadow.camera.far = 2000;

  scene.add(spotLight);

  planeGeo = new THREE.CircleGeometry(2000, 16);

  planeMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x050505
  });

  planeMat.color.setHSL(0.095, 1, 0.75);

  planeObj = new THREE.Mesh(planeGeo, planeMat);

  planeObj.position.set(0, 0, 0);

  planeObj.rotation.x = -Math.PI / 2;

  planeObj.receiveShadow = true;

  scene.add(planeObj);

  new THREE.InstancedBufferGeometry();

  gui = new dat.GUI();

  renderer.gammaInput = true;

  renderer.gammaOutput = true;

  render = function() {
    return renderer.render(scene, camera);
  };

  (animate = function() {
    requestAnimationFrame(animate);
    render();
    orbitControl.update();
    return stats.update();
  })();


  /*
    Events Listener
   */

  onWindowResize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    return renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', onWindowResize, false);

}).call(this);

//# sourceMappingURL=fluids_beta.js.map
