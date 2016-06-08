/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

var device;
var firstConnectionAtt

function startConnecting2AWSIoT() {

    var awsIot = require('aws-iot-device-sdk');
    //var certId = '1cd07de3c3'; // demo account
    var certId = '6f46ff5e66'; // demo account
    log('start connecting to AWS IoT with certificate id '+certId);
    
    device = awsIot.thingShadow({
       keyPath: '/home/root/.node_app_slot/certs/'+certId+'-private.pem.key',
      certPath: '/home/root/.node_app_slot/certs/'+certId+'-certificate.pem.crt',
        caPath: '/home/root/.node_app_slot/certs/root-CA.crt',
      clientId: seriallNumber,
        region: 'eu-west-1'
    });
    
    var possibleNotActivatedCert = false;
    device.on('error', function(error) {
        var errorStr = ''+error;
        console.log(''+error);
        if (errorStr.indexOf('unknown') !== -1) {
            possibleNotActivatedCert = true;
            log('did you activated the certificate?');
        }
    });
    
    device.on('close', function(error) {
        if (!possibleNotActivatedCert) {
            log('connection closed, did you attach a policy?');
        }
    });
    
    device.on('offline', function(error) {
        console.log('connection offline');
    });

    var firstPublishedData = false;
    device.on('connect', function() {
        log('connected as '+seriallNumber+' with '+ipAddress);
        device.register(seriallNumber);
        setInterval(function() {
            var data = sensors.getSensorData();
            device.publish('sensordata/'+seriallNumber, JSON.stringify(data));
            if (!firstPublishedData) {
                console.log('start publishing data');
                firstPublishedData = true;
            }
        }, 1000);
    });

    device.on('status', function(thingName, stat, clientToken, stateObject) {
        console.log('received '+stat+' on '+thingName+': '+JSON.stringify(stateObject));
    });

    device.on('delta', function(thingName, stateObject) {
        console.log('received delta on '+thingName+': '+JSON.stringify(stateObject));
        if (thingName == seriallNumber) {
            if (stateObject.state.text) {
                sensors.writeText(stateObject.state.text);
                device.update(seriallNumber, {state:{reported:{text:stateObject.state.text},desired:null}});
            } else if (stateObject.state.graphic) {
                if (stateObject.state.graphic == 'on') {
                    sensors.drawCircle();
                } else {
                    sensors.clear();
                }
                device.update(seriallNumber, {state:{reported:{graphic:stateObject.state.graphic},desired:null}});
            }
        }
    });

    device.on('timeout', function(thingName, clientToken) {
        console.log('received timeout on '+thingName+' with token: '+ clientToken);
    });
}

function log(str) {
    console.log(str);
    sensors.writeText(str);
} 

var lcdObj = require('jsupm_i2clcd');
var oled = new lcdObj.EBOLED();
var sensors = {};

sensors.writeText = function(text) {
    oled.clearScreenBuffer();
    oled.setCursor(1,1);
    oled.setTextWrap(1);
    oled.write(text);
    oled.refresh();
}

sensors.clear = function() {
    oled.clearScreenBuffer();
    oled.refresh();
}

sensors.drawCircle = function() {
    oled.clearScreenBuffer();
    oled.drawCircleFilled(32, 24, 23 , 1);
    oled.refresh();
}

oled.clearScreenBuffer();
sensors.writeText('starting...');

var sensorObj = require('jsupm_lsm9ds0');
var sensor = new sensorObj.LSM9DS0();

sensor.init();
var x = new sensorObj.new_floatp();
var y = new sensorObj.new_floatp();
var z = new sensorObj.new_floatp();

sensors.getSensorData = function() {
    var data = {
        acc: {},
        mag: {},
        gyr: {},
        pyr: null,
        temp: -273.15
    }
    sensor.update();
    sensor.getAccelerometer(x, y, z);
    data.acc.x = sensorObj.floatp_value(x);
    data.acc.y = sensorObj.floatp_value(y);
    data.acc.z = sensorObj.floatp_value(z);
    sensor.getGyroscope(x, y, z);
    data.gyr.x = sensorObj.floatp_value(x);
    data.gyr.y = sensorObj.floatp_value(y);
    data.gyr.z = sensorObj.floatp_value(z);
    sensor.getMagnetometer(x, y, z);
    data.mag.x = sensorObj.floatp_value(x);
    data.mag.y = sensorObj.floatp_value(y);
    data.mag.z = sensorObj.floatp_value(z);
    data.pyr = calculateSimpleAngles(data.acc, data.mag);
    data.temp = sensor.getTemperature();
    data.readingTime = new Date().toISOString();
    return data;
}

var declination = 0.0;
function calculateSimpleAngles(acc, mag) {
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

var mraa = require('mraa');
// GP47 = ping 46
var btnUp = new mraa.Gpio(46);
btnUp.dir(mraa.DIR_IN);
var btnUpPressed = false;
// GP44 = pin 31
var btnDown = new mraa.Gpio(31);
btnDown.dir(mraa.DIR_IN);
var btnDownPressed = false;
// GP165 = pin 15
var btnLeft = new mraa.Gpio(15);
btnLeft.dir(mraa.DIR_IN);
var btnLeftPressed = false;
var btnRight = new mraa.Gpio(45);
btnRight.dir(mraa.DIR_IN);
var btnRightPressed = false;
// GP48 = pin 33
var btnSelect = new mraa.Gpio(33);
btnSelect.dir(mraa.DIR_IN);
var btnSelectPressed = false;
// GP49 = pin 47
var btnA = new mraa.Gpio(47);
btnA.dir(mraa.DIR_IN);
var btnAPressed = false;
// GP46 = pin 32
var btnB = new mraa.Gpio(32);
btnB.dir(mraa.DIR_IN);
var btnBPressed = false;

setInterval(function() {
  if(btnUp.read() == 0) {
    if (!btnUpPressed) {
        console.log('pressed button up');
        btnUpPressed = true;
        if (device != undefined) {
            device.publish('buttons/'+seriallNumber, JSON.stringify({button: 'buttonUp'}));
        }
    }
  } else if (btnUpPressed) {
    btnUpPressed = false;
  }
  if(btnDown.read() == 0) {
    if (!btnDownPressed) {
        console.log('pressed button down');
        btnDownPressed = true;
        if (device != undefined) {
            device.publish('buttons/'+seriallNumber, JSON.stringify({button: 'buttonDown'}));
        }
    }
  } else if (btnDownPressed) {
    btnDownPressed = false;
  }
  if(btnLeft.read() == 0) {
    if (!btnLeftPressed) {
        console.log('pressed button left');
        btnLeftPressed = true;
        if (device != undefined) {
            device.publish('buttons/'+seriallNumber, JSON.stringify({button: 'buttonLeft'}));
        }
    }
  } else if (btnLeftPressed) {
    btnLeftPressed = false;
  }
  if(btnRight.read() == 0) {
    if (!btnRightPressed) {
        console.log('pressed button right');
        btnRightPressed = true;
        if (device != undefined) {
            device.publish('buttons/'+seriallNumber, JSON.stringify({button: 'buttonRight'}));
        }
    }
  } else if (btnRightPressed) {
    btnRightPressed = false;
  }
  if(btnSelect.read() == 0) {
    if (!btnSelectPressed) {
        console.log('pressed button select');
        btnSelectPressed = true;
        if (device != undefined) {
            device.publish('buttons/'+seriallNumber, JSON.stringify({button: 'buttonSelect'}));
        }
    }
  } else if (btnSelectPressed) {
    btnSelectPressed = false;
  }
  if(btnA.read() == 0) {
    if (!btnAPressed) {
        console.log('pressed button a');
        btnAPressed = true;
        if (device != undefined) {
            device.publish('buttons/'+seriallNumber, JSON.stringify({button: 'buttonA'}));
        }
    }
  } else if (btnAPressed) {
    btnAPressed = false;
  }
  if(btnB.read() == 0) {
    if (!btnBPressed) {
        console.log('pressed button b');
        btnBPressed = true;
        if (device != undefined) {
            device.publish('buttons/'+seriallNumber, JSON.stringify({button: 'buttonB'}));
        }
    }
  } else if (btnBPressed) {
    btnBPressed = false;
  }
}, 50);


// get cpuid and use it as a unique identifier
var seriallNumber = require('fs').readFileSync('/factory/serial_number', "utf8").replace(/\n$/, '');
log('serial number: '+seriallNumber);

// check if we have a wifi connection
console.log('check wifi');
var os = require('os');
var ipAddress = null;
var netUpInterval = setInterval(function(){

    log('waiting for wifi');
    if(os.networkInterfaces().wlan0 && os.networkInterfaces().wlan0.length > 0 && os.networkInterfaces().wlan0[0].address) {
        ipAddress = os.networkInterfaces().wlan0[0].address;
        sensors.writeText('ip: '+ipAddress);
        console.log('ip: '+ipAddress);
        clearInterval(netUpInterval);
        startConnecting2AWSIoT();
    }
},500);
