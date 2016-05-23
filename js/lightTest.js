// Generated by CoffeeScript 1.10.0
(function() {
  var axes, camera, cubeGeo, cubeMat, cubeObj, initScene, light, onWindowResize, planeGeo, planeMat, planeObj, ref, render, renderer, scene;

  onWindowResize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    return renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', onWindowResize, false);

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
    renderer.shadowMap.enabled = true;
    return {
      scene: scene,
      camera: camera,
      renderer: renderer
    };
  };

  ref = initScene(), scene = ref.scene, camera = ref.camera, renderer = ref.renderer;

  document.body.appendChild(renderer.domElement);

  light = new THREE.DirectionalLight(0xdfebff, 1.75);

  light.position.set(50, 200, 100);

  light.position.multiplyScalar(1.3);

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

  cubeMat = new THREE.MeshLambertMaterial({
    color: 0x44ff44
  });

  cubeGeo = new THREE.BoxGeometry(10, 10, 10);

  cubeObj = new THREE.Mesh(cubeGeo, cubeMat);

  cubeObj.position.set(0, 5, 0);

  cubeObj.castShadow = true;

  scene.add(cubeObj);

  planeGeo = new THREE.PlaneGeometry(1000, 1000);

  planeMat = new THREE.MeshLambertMaterial({
    color: 0xeeeeee
  });

  planeObj = new THREE.Mesh(planeGeo, planeMat);

  planeObj.position.set(0, -5, 0);

  planeObj.rotation.x = -Math.PI / 2;

  planeObj.receiveShadow = true;

  scene.add(planeObj);

  axes = new THREE.AxisHelper(20);

  scene.add(axes);

  render = function() {
    requestAnimationFrame(render);
    return renderer.render(scene, camera);
  };

  render();

}).call(this);

//# sourceMappingURL=lightTest.js.map
