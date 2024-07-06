# signalk-to-traccar

A Signal K Node server plugin for logging data to a traccar server

## Configuration

A device id, an IP address and a port have to be defined for the POST request.

What is logged ?
- deviceId
- Timestamp
- Latitude WGS84 (decimal degrees)
- Longitude WGS84 (decimal degrees)
- SOG : Speed Over Ground (knots)
- COG : Course Over Ground (degrees/true North)
- STW : Speed Through Water (knots)
- AWS : Apparent Wind Speed (knots)
- AWA : Apparent Wind Angle (degrees/heading line)
