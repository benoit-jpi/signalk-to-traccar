const Bacon = require("baconjs");
const debug = require("debug")("signalk:signalk-to-traccar");
const util = require("util");
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const axios = require('axios')

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
    
    plugin.id = "sk-to-traccar"
    plugin.name = "Signal K logger to traccar"
    plugin.description = "Log Signal K data to traccar service."

    plugin.schema = {
	type: "object",
	title: "Position and performance data logging to traccar service",
	description: "Log Signal K position and performance data to traccar service.",
	properties: {
	    deviceid: {
		type: 'string',
		title: 'Device Id in the traccar service database',
		default: null
	    },
	    hosturl: {
		type: 'string',
		title: 'Traccar service host',
                default: null
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
	deviceid = options.deviceid
	period = options.period
	hosturl=options.hosturl
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

		const config = {
		    headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		    }
		}
		
		var params = new URLSearchParams()
		params.append('id', deviceid)
		params.append('timestamp', timestamp)
		params.append('lat', latitude)
		params.append('lon', longitude)
		params.append('speed', sog)
		params.append('bearing', cog)
		params.append('stw', stw)
		params.append('aws', aws)
		params.append('awa', awa)

		const createDataPoint = async () => {

		    const res = await axios.post(hosturl+":"+port, params, config)
		    app.debug(`sk-to-traccar req.status: ${res.status}`)
		}
		
		createDataPoint();

	    }
	} catch (err) {
	    console.log(err)
	}
    }	
}
