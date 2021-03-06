'use strict';

var Service, Characteristic;
var mqtt    = require('mqtt');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-mqtt-temperature", "mqtt-temperature", mqttTemperatureAccessory);
}

function mqttTemperatureAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.url = config['url'];
  this.topic = config['topic'];
  this.client_Id 		= 'mqttjs_' + Math.random().toString(16).substr(2, 8);7
  this.options = {
    keepalive: 10,
    clientId: this.client_Id,
		protocolId: 'MQTT',
    protocolVersion: 4,
		clean: true,
		reconnectPeriod: 1000,
		connectTimeout: 30 * 1000,
		will: {
			topic: 'WillMsg',
			payload: 'Connection closed abnormally.',
			qos: 0,
			retain: false
		},
		username: config["username"],
		password: config["password"],
		rejectUnauthorized: false
	};

  this.service = new Service.TemperatureSensor(this.name);
  this.service
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getState.bind(this));

  // connect to MQTT broker
  this.client  = mqtt.connect(this.url, this.options);
  var that = this;
  this.client.subscribe(this.topic);

  this.client.on('message', function (topic, message) {
    var data = JSON.parse(message);
    if (data === null) { return null; }
    that.temperature = parseFloat(data.value);
    that.log("MQTT Temperature: ", that.temperature);
  });
}

mqttTemperatureAccessory.prototype.getState = function(callback) {
  this.log(this.name, " - MQTT : ", this.temperature);
  callback(null, this.temperature);
}

mqttTemperatureAccessory.prototype.getServices = function() {
  return [this.service];
}
