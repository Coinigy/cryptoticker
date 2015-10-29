var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");
var ss = require("sdk/simple-storage");
ss.storage.data = { 'apiKey': null, 'apiSecret': null, 'confirmed': false };

var button = ToggleButton({
  id: "cryptoticker",
  label: "Coinigy Cryptoticker",
  icon: {
    "16": "./icon16.png",
    "19": "./icon19.png",
    "48": "./icon48.png",
    "128": "./icon128.png"
  },
  onClick: handleChange
});

function handleChange(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
    var data = ss.storage.data;
    panel.port.emit("checkUserDataResp", data);
  }
}

function handleHide() {
  button.state('window', {checked: false});
}


var panel = panels.Panel({
  contentURL: self.data.url("browser_action.html"),
  onHide: handleHide,
  width: 406,
  height: 273,
  contentScriptFile: [self.data.url("js/jquery/jquery.min.js"), 
                      self.data.url("js/bootstrap.min.js"), 
                      self.data.url("js/socketcluster/socketcluster2.3.15.min.js"), 
                      self.data.url("main.js")]
});

panel.port.on("windowSize", function(data){
  panel.resize(data.width, data.height);
});

panel.port.on("setConfirmed", function(conf){
  ss.storage.data.confirmed = conf;
  panel.port.emit("setConfirmedResp", conf);
});

panel.port.on("deleteUserData", function(){
  ss.storage.data.apiKey = null;
  ss.storage.data.apiSecret = null;
  ss.storage.data.confirmed = false;
  panel.port.emit("deleteResp");
});

panel.port.on("checkUserData", function(){
  var data = ss.storage.data;
  panel.port.emit("checkUserDataResp", data);
});

panel.port.on("saveApiInfo", function(data){
  ss.storage.data.apiKey = data.apiKey;
  ss.storage.data.apiSecret = data.apiSecret;
  panel.port.emit("saveApiInfoResp");
});

panel.port.on("openTab", function(addr){
  tabs.open(addr);
});


