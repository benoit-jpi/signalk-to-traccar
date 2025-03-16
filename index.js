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
    const plugin = {};
    var timerId
 
    plugin.id = "sk-to-traccar"
    plugin.name = "Traccar Logger"
    plugin.description = "Log navigation data to Traccar service."

    plugin.schema = {
	type: "object",
	title: "Sailboat position and performance data logging to traccar service",
	description: "Log sailboat position and parameters to traccar service.",
	properties: {
	    deviceid: {
		type: 'string',
		title: 'Device Id',
		default: 'My sailboat traccar id'
	    },
	    protocol: {
		type: 'string',
		title: 'Protocol to use',
		default: 'http',
		enum: ['http','https']
	    },
	    hostname: {
		type: 'string',
		title: 'Host name / address',
                default: null
	    },
            port: {
                type: 'number',
                title: 'Port number',
                default: 5055
            },
	    period: {
		type: 'number',
		title: 'Logging period (s)',
		default: 300
	    }
	}
    }

    plugin.start = function (options) {

	deviceid = options.deviceid
	protocol = options.protocol
	hostname = options.hostname
	port = options.port
        period = options.period

	if (typeof hostname === 'undefined') {
	    app.setProviderStatus('hostname not defined, plugin disabled')
	    return
	}

	const url=protocol+'://'+hostname+":"+port
	timerId = setInterval(() => { sendData(url) }, period * 1000 )
    }
    
    plugin.stop = function () {

	clearInterval(timerId)

    }
    return plugin;

    function sendData(url) {
	//	timestamp,lat,lon,sog,cog,stw,aws,awa
	try {
	    let tunix=Math.round(+new Date())
	    let datetime=app.getSelfPath('navigation.datetime.value')
	    let timestamp=Date.parse(datetime)

	    if ((tunix-timestamp) < period * 1000) { // only log if age of data < period
		let longitude=Number(app.getSelfPath('navigation.position.value.longitude')).toFixed(6)
		let latitude=Number(app.getSelfPath('navigation.position.value.latitude')).toFixed(6)
		let sog=(Number(app.getSelfPath('navigation.speedOverGround.value'))*1.94384).toFixed(2)
		let cog=(Number(app.getSelfPath('navigation.courseOverGroundTrue.value'))*(180/Math.PI)).toFixed()
		let stw=(Number(app.getSelfPath('navigation.speedThroughWater.value'))*1.94384).toFixed(2)
		let aws=(Number(app.getSelfPath('environment.wind.speedApparent.value'))*1.94384).toFixed(2)
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

		const postDataPoint = async () => {
		    try {
			const res = await axios.post(url, params, config)
			app.debug(`req.status: ${res.status}`)
		    } catch (error) {
			// Handle error
			console.error(error);
		    }
		}

		postDataPoint();

	    }
	} catch (err) {
	    console.log(err)
	}
    }
}
