# signalk-to-traccar

A Signal K Node server plugin for logging data to a traccar server

## Configuration

A device id, a host url, a port number have to be defined for the POST request. A period is also necessary for the scheduling.

What is sent ?
- deviceId
- Timestamp
- Latitude WGS84 (decimal degrees)
- Longitude WGS84 (decimal degrees)
- SOG : Speed Over Ground (knots)
- COG : Course Over Ground (degrees/true North)
- STW : Speed Through Water (knots)
- AWS : Apparent Wind Speed (knots)
- AWA : Apparent Wind Angle (degrees/heading line)

## GUI
![](/signalk-to-traccar_config.png)
