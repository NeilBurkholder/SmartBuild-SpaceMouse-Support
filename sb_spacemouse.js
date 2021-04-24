offset = new THREE.Vector3();
// so camera.up is the orbit axis
quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));
quatInverse = quat.clone().invert();
lastPosition = new THREE.Vector3();
lastQuaternion = new THREE.Quaternion();
spherical = new THREE.Spherical();
sphericalDelta = new THREE.Spherical();

function rotate(angle, anglez) {
  angle = angle * Math.PI / 180
  anglez = anglez * Math.PI / 180
  var position = camera.position;
  offset.copy(position).sub(controls.target);
  // rotate offset to "y-axis-is-up" space
  offset.applyQuaternion(quat);
  // angle from z-axis around y-axis
  spherical.setFromVector3(offset);
  spherical.theta -= angle;
  spherical.phi -= anglez;
  // restrict theta to be between desired limits
  spherical.theta = Math.max(controls.minAzimuthAngle, Math.min(controls.maxAzimuthAngle, spherical.theta));
  // restrict phi to be between desired limits
  //spherical.phi = Math.max(controls.minPolarAngle, Math.min(controls.maxPolarAngle, spherical.phi));

  spherical.makeSafe();
  //scope.target.add(panOffset);
  offset.setFromSpherical(spherical);
  // rotate offset back to "camera-up-vector-is-up" space
  offset.applyQuaternion(quatInverse);
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

function pan(deltax, deltay) {
  var element = controls.domElement === document ? controls.domElement.body : controls.domElement;
  var position = camera.position;
  offset.copy(position).sub(controls.target);
  var targetDistance = offset.length();
  // half of the fov is center to top of screen
  targetDistance *= Math.tan((camera.fov / 2) * Math.PI / 180.0);
  distancex = 2 * deltax * targetDistance / element.clientHeight
  var v = new THREE.Vector3();
  v.setFromMatrixColumn(camera.matrix, 0); // get x column of objectMatrix
  v.multiplyScalar(distancex);
  controls.target.add(v);
  camera.position.add(v);
  distancey = 2 * deltay * targetDistance / element.clientHeight
  v.setFromMatrixColumn(camera.matrix, 1); // get x column of objectMatrix
  v.multiplyScalar(distancey);
  controls.target.add(v);
  camera.position.add(v);
}

function updateController() {
  if(document.hasFocus()) {
    gamepads = Array.from(navigator.getGamepads()).filter(function (g) { return g != null && (g.id.toLowerCase().indexOf('spacemouse') >= 0 || g.id.toLowerCase().indexOf('connexion') >= 0) });
    gamepad = Array.from(navigator.getGamepads()).find(function (g) { return g != null && (g.id.toLowerCase().indexOf('spacemouse') >= 0 || g.id.toLowerCase().indexOf('connexion') >= 0) });
    //gamepad = navigator.getGamepads()[1]
    if (gamepads.length == 0 || typeof controls == 'undefined' || typeof camera == 'undefined') {
      requestAnimationFrame(updateController);
      return;
    }
    gamepads.forEach(function (gamepad) {
      axes = gamepad.axes
      pan_lr_delta = axes[0] * 100;
      pan_ud_delta = axes[2] * 100;
      zoom_delta = axes[1] * 25;
      rotate_ud_delta = axes[3] * 10;
      rotate_lr_delta = axes[4] * 10;
      orbit_delta = axes[5] * 10;

      //Set the camera target and position
      camera_direction = new THREE.Vector3();
      camera_direction.subVectors(camera.position, controls.target);
      distance = camera_direction.length();
      distance_factor = (distance / 100) + 0.1
      //zoom
      if (zoom_delta !== 0){
        camera_direction.setLength(0 - (distance_factor * zoom_delta));
        camera.position.add(camera_direction);
        if (distance < 10 && zoom_delta > 0) controls.target.add(camera_direction);
      }
      //pan
      if (pan_lr_delta !== 0 || pan_ud_delta !== 0) pan(0 - pan_lr_delta, pan_ud_delta);
      //ORBIT
      if (orbit_delta !== 0 || rotate_ud_delta != 0) rotate(0 - orbit_delta, rotate_ud_delta);
      controls.update();
      });
    //set the mouse buttons to match SketchUp - perhaps a user setting would be nice?
    controls.mouseButtons = { ORBIT: 1, ZOOM: 1, PAN: 2 }
  }
  requestAnimationFrame(updateController);
}
updateController();

