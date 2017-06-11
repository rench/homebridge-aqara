const inherits = require('util').inherits;
var BaseCommander = require('./BaseCommander');
var colors = require('../util/colors');
var default_gamut = colors.gamut;


GatewayCommander = function (platform, deviceSid, deviceModel, switchName) {
  this.init(platform, deviceSid, deviceModel);
  this.switchName = switchName;
  this.saturation = 255; //saturation
  this.hue = 255; //hue
  this.brightness = 100; //brightness
  this.on = false;
  this.count = 0; //send count after light on
}

inherits(GatewayCommander, BaseCommander);

GatewayCommander.prototype.send = function (hue, saturation, brightness, on) {
  if (saturation != null) { //update saturation only for hue changed
    this.log.debug('set saturation:' + saturation);
    this.saturation = saturation;
    return;
  }
  var targetRgbValue;
  var lastValue = this.getLastValue(); //the value last write to gateway or update by report cmd
  if (this.hue == hue) {
    this.log.debug("Value not changed, do nothing");
    return;
  }
  if (!lastValue) {
    lastValue = 0xFFFFFFFF; //default value
    this.log.debug('init rgbvalue:' + lastValue);
  }
  this.log.debug('last rgbValue:' + lastValue);
  if (brightness != null) { //if pass brightness just change brightness
    if (!this.on) {
      this.log.debug('the light is off now,brightness adjust will be discard');
      return;
    }
    if (brightness == 100 && this.count == 1) {
      this.log.debug('try to discard the first adjust brightness auto by homekit app .');
      this.count++;
      return;
    }
    this.brightness = brightness;
    targetRgbValue = brightness << 24 | (lastValue & 0x00FFFFFF); //just change the light brightness
    this.log.debug('set brightness:' + brightness);
  } else if (hue != null) { //if pass hue change the hue and sat
    this.hue = hue;
    var lastBrightness = (lastValue & 0xFF000000) >>> 24; // keep the last brightness
    var rgb = colors.hkhue_to_rgb(hue, this.saturation, default_gamut); //convert hue and sat to rgb value
    var r = rgb[0];
    var g = rgb[1];
    var b = rgb[2];
    targetRgbValue = r << 16 | g << 8 | b;
    targetRgbValue = targetRgbValue | (lastBrightness << 24);
    this.log.debug('set hue:' + hue);
    this.log.debug('set brightness:' + lastBrightness);
    this.log.debug('set saturation:' + this.saturation);
  } else if (on != null) {
    if (on == 'on') {
      this.on = true;
      this.count = 1;
      targetRgbValue = lastValue;
      this.log.debug('light on set rgbValue:' + targetRgbValue);
    } else {
      this.on = false;
      this.count = 0;
      targetRgbValue = 0;
      this.log.debug('light off set rgbValue:' + targetRgbValue);
    }
  }
  var data = {
    rgb: targetRgbValue,
    key: this.generateKey()
  }
  var command = {
    cmd: "write",
    model: this.deviceModel,
    sid: this.deviceSid,
    data: JSON.stringify(data)
  }
  this.sendCommand(JSON.stringify(command));
  if (targetRgbValue != 0) {
    this.update(targetRgbValue); //if the gateway light is not off,cache the rgbValue
  }
}

module.exports = GatewayCommander;
