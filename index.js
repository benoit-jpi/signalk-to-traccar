const Bacon = require("baconjs");
const debug = require("debug")("signalk:signalk-perf-logger");
const util = require("util");
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
var request = require('request');

/*

Signal K server plugin to log performance data to csv files.

Features:
- Basic logging
- Configurable log directory
- Splitting per hour

TODO:

*/

module.exports = function(app) {
    var plugin = {};
    var timerId
    var period = 300
    
    plugin.id = "sk-traccar-logger"
    plugin.name = "Signal K logger to traccar"
    plugin.description = "Log Signal K data to traccar server."

    plugin.schema = {
	type: "object",
	title: "Position and performance data logging to traccar server",
	description: "Log Signal K position and performance data to traccar server.",
	properties: {
	    deviceid: {
		type: 'string',
		title: 'Device Id in the traccar database',
		default: null
	    },
	    ipaddress: {
		type: 'string',
		title: 'TCP endpoint IP address',
                default: '0.0.0.0'
	    },
            port: {
                type: 'number',
                title: 'Port',
                default: 5055
            },
	    period: {
		type: 'number',
		title: 'Logging period.',
		default: 300
	    },
	    context: {
		type: 'string',
		title: 'Subscription context',
		default: 'vessels.self'
	    },
	}
    }

    plugin.start = function (options) {

	context = options.context
	period = options.period
	ipaddress=options.ipaddress
	port=options.port

	timerId = setInterval(() => { postData() }, period * 1000 )
    }
    
    plugin.stop = function () {

	clearInterval(timerId)

    }
    return plugin

    function postData() {
	//	timestamp,lat,lon,sog,cog,stw,aws,awa
	try {
	    let tunix=Math.round(+new Date())
	    let datetime=app.getSelfPath('navigation.datetime.value')
	    let timestamp=Date.parse(datetime)

	    app.handleMessage(plugin.id, {
		updates: [
		    {
			values: [
			    {
				path: 'environment.wind.speedApparent',
				value: 5.045
			    }
			]
		    },
		    {
			values: [
			    {
				path: 'environment.wind.angleApparent',
				value: 5.64159
			    }
			]
		    },
		    {
			values: [
			    {
				path: 'navigation.speedThroughWater',
				value: 5.64159
			    }
			]
		    },
		    {
			values: [
			    {
				path: 'environment.depth.belowTransducer',
				value: 59
			    }
			]
		    }
		]
	    })

	    if ((tunix-timestamp) < period * 1000) { // only log if age of data < period
		let longitude=Number(app.getSelfPath('navigation.position.value.longitude')).toFixed(6)
		let latitude=Number(app.getSelfPath('navigation.position.value.latitude')).toFixed(6)
		let sog=(Number(app.getSelfPath('navigation.speedOverGround.value'))*0.5144444).toFixed(2)
		let cog=(Number(app.getSelfPath('navigation.courseOverGroundTrue.value'))*(180/Math.PI)).toFixed()
		let stw=(Number(app.getSelfPath('navigation.speedThroughWater.value'))*0.5144444).toFixed(2)
		let aws=(Number(app.getSelfPath('environment.wind.speedApparent.value'))*0.5144444).toFixed(2)
		let awa=(Number(app.getSelfPath('environment.wind.angleApparent.value'))*(180/Math.PI)).toFixed()

		var myJSONObject = {
		    id : deviceid,
		    timestamp: timestamp,
		    lat: latitude,
		    lon: longitude,
		    speed: sog,
		    bearing: cog,
		    stw : stw,
		    aws: aws,
		    awa: awa
		};

		request({
		    url: ipadresse+":"+port,
		    method: "POST",
		    json: true,   // <--Very important!!!
		    body: myJSONObject
		}, (err) => {
		    if (err) throw err;
		})
	    } catch (err) {
		console.log(err)
	    }
	}
    }
