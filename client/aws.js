const awsIot = require('aws-iot-device-sdk');
const board = require('./board');


exports.createDevice = function(certId) {
	return awsIot.thingShadow({
		keyPath: '/home/root/.node_app_slot/certs/'+certId+'-private.pem.key',
		certPath: '/home/root/.node_app_slot/certs/'+certId+'-certificate.pem.crt',
		caPath: '/home/root/.node_app_slot/certs/root-CA.crt',
		clientId: board.getSerialNumber(),
		region: 'eu-west-1'
	});
}
