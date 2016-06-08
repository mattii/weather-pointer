const lcd = require('./lcd');
const aws = require('./aws');
const board = require('./board');
const sensors = require('./sensors');

lcd.writeText(new Date().toString());
console.log(board.getSerialNumber());


const device = aws.createDevice('4fce8704a5');

device.on('connect', function() {
    console.log('connected');
    device.register(board.getSerialNumber());

    setInterval(function() {
        const m = sensors.getMagnetometer();
        const a = sensors.getAccelerometer();

        const angles = sensors.calculateSimpleAngles(a, m);

        const payload = {
            position: {
                lon: 11.58,
                lat: 48.14,
            },
            distance: 100, // km
            direction: angles.yaw, // 0 - 360
            // direction: angles.pitch, // 0 - 360
            // direction: angles.roll, // 0 - 360
        };

        device.publish(
            'sensordata/' + board.getSerialNumber(),
            JSON.stringify(payload)
        );
    }, 5000);
});

device.on('status', function(thingName, stat, clientToken, stateObject) {
    console.log('status', stat, stateObject);
});

device.on('delta', function(name, shadowObject) {
    console.log('delta', name, shadowObject);
    if (shadowObject) {
        lcd.writeText(shadowObject.state.name + '\n' + shadowObject.state.description + '\n' + shadowObject.state.main.temp);
    }
});

device.on('status', function(evt) {
    console.log('status', evt);
});

/*
setInterval(function() {
    console.log(sensors.getTemperature());
}, 500);
*/

/*
setInterval(function() {
    const accelerometerData = sensors.getAccelerometer();
    console.log(accelerometerData);
}, 1000);
*/
