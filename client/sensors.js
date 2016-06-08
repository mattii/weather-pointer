const lsm9ds0 = require('jsupm_lsm9ds0');
const sensor = new lsm9ds0.LSM9DS0();

sensor.init();


var declination = 0.0;
exports.calculateSimpleAngles = function(acc, mag) {
    // calculate pitch, rol, yaw
    var zz = acc.z * acc.z;
    //angles->x = -atan2(acc.y, sqrt(acc.x * acc.x + zz)) * (180.0 / M_PI);
    var pitch = -Math.atan2(acc.y,Math.sqrt(acc.x * acc.x + zz)) * (180.0 / Math.PI);
    //angles->y = atan2(acc.x, sqrt(acc.y * acc.y + zz)) * (180.0 / M_PI);
    var roll = Math.atan2(acc.x, Math.sqrt(acc.y * acc.y + zz)) * (180.0 / Math.PI);
    // angles->z = atan2 (mag.x, mag.y) * (180.0 / M_PI) - declination;
    var yaw = Math.atan2(mag.x, mag.y) * (180.0 / Math.PI) - declination;
    if (yaw > 180) {
        yaw -= 360;
    } else if (yaw < -180) {
        yaw += 360;
    }
    //console.log('pitch: '+pitch.toFixed(4)+', roll: '+roll.toFixed(4)+', yaw: '+yaw.toFixed(4));
    return {pitch:pitch, roll:roll, yaw:yaw};
}

function generateSensorPointers() {
  return {
    x: new lsm9ds0.new_floatp(),
    y: new lsm9ds0.new_floatp(),
    z: new lsm9ds0.new_floatp(),
  };
}

exports.getMagnetometer = function() {
  sensor.update();

  const pointers = generateSensorPointers();

  sensor.getMagnetometer(pointers.x, pointers.y, pointers.z);

  return {
    x: lsm9ds0.floatp_value(pointers.x),
    y: lsm9ds0.floatp_value(pointers.y),
    z: lsm9ds0.floatp_value(pointers.z),
  };
}


exports.getAccelerometer = function() {
  sensor.update();

  const pointers = generateSensorPointers();

  sensor.getAccelerometer(pointers.x, pointers.y, pointers.z);

  return {
    x: lsm9ds0.floatp_value(pointers.x),
    y: lsm9ds0.floatp_value(pointers.y),
    z: lsm9ds0.floatp_value(pointers.z),
  };
}

exports.getTemperature = function() {
    return sensor.getTemperature();
}
