'use strict';
const request = require('request');
const geolib = require('geolib');
const AWS = require('aws-sdk');

console.log('Loading function');

const OPEN_WEATHER_API_KEY = 'XXX';

// example event:
// { position: {
// 		lon: 11.58,
// 		lat: 48.14,
// 	 },
// 	 distance: 0, // km
// 	 direction: 0, // 0 - 360
// };
exports.handler = (event, context, callback) => {

    console.log(event);

    // calculate target
    const destination = geolib.computeDestinationPoint(
    	{
    		longitude: event.position.lon,
    		latitude: event.position.lat,
    	},
    	event.distance * 1000, // conversion to meters
    	event.direction
    );
    console.log(destination);
    console.log(`http://api.openweathermap.org/data/2.5/weather?lat=${destination.latitude}&lon=${destination.longitude}&units=metric&APPID=${OPEN_WEATHER_API_KEY}`);
    // make request
    request(
    	`http://api.openweathermap.org/data/2.5/weather?lat=${destination.latitude}&lon=${destination.longitude}&units=metric&APPID=${OPEN_WEATHER_API_KEY}`,
    	(error, response, body) => {
    		console.log('request done');

    		var iotdata = new AWS.IotData({
    			endpoint: 'A2TXC1IEKV70LT.iot.eu-west-1.amazonaws.com',
    			region: 'eu-west-1',
    		});


    		const bodyObject = JSON.parse(body);
    		if (bodyObject.cod !== 200) {
    			return callback(bodyObject.message, null);
    		}



    		const result = {
    			state: {
    				desired: {
		    			name: bodyObject.name,
		    			main: bodyObject.main,
		    			wind: bodyObject.wind,
		    			rain: bodyObject.rain,
		    			description: bodyObject.weather[0].description,
    				},
    			},
    		};
    		console.log(result);

    		iotdata.updateThingShadow({
			  payload: JSON.stringify(result),
			  thingName: 'FZEDB604D00AJ9501',
			}, (err, data) => {
				if (err) console.log(err, err.stack); // an error occurred
				else     console.log(data);           // successful response
    			callback(error, data);  // Echo back the first key value
			});


    	}
    )
};