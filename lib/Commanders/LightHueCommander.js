const inherits = require('util').inherits;
var BaseCommander = require('./BaseCommander');
var colors = require('../util/colors');
var default_gamut = colors.gamut;


LightHueCommander = function (platform, deviceSid, deviceModel, switchName) {
  this.init(platform, deviceSid, deviceModel);
  this.switchName = switchName;
  this.saturation = 255; //色温
}

inherits(LightHueCommander, BaseCommander);

LightHueCommander.prototype.send = function (rgbValue, saturation) {
  if (saturation) {
    this.saturation = saturation;
    console.log('saturation:', saturation);
    return;
  }
  var lastValue = this.getLastValue();
  if (lastValue == rgbValue) {
    platform.log.debug("Value not changed, do nothing");
    return;
  }
  if (!lastValue) {
    lastValue = 0xFFFFFFFF;
  }
  console.log('lastValue:', lastValue);
  var lastBrightness = (lastValue & 0xFF000000) >>> 24; //亮度(去除符号位位移)
  console.log('lastBrightness:', lastBrightness);
  var hue = rgbValue;
  console.log('hue:', hue);
  var rgb = colors.hkhue_to_rgb(hue, this.saturation, default_gamut);
  console.log('rgb:', rgb);
  var r = rgb[0];
  var g = rgb[1];
  var b = rgb[2];
  var targetRgbValue = r << 16 | g << 8 | b;
  console.log('targetRgbValue1:', targetRgbValue);
  targetRgbValue = targetRgbValue | (lastBrightness << 24);
  console.log('targetRgbValue2:', targetRgbValue);
  var data = {
    rgb: targetRgbValue,
    key: this.generateKey()
  }
  this.update(targetRgbValue);
  var command = {
    cmd: "write",
    model: this.deviceModel,
    sid: this.deviceSid,
    data: JSON.stringify(data)
  }
  console.log(command);
  this.sendCommand(JSON.stringify(command));
}

module.exports = LightHueCommander;
