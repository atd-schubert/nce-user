"use strict";

var NCE = require("nce");
var Ext = require("./");

var Logger = require("nce-winston");
var Store = require("nce-mongoose-store");
var Server = require("nce-server");

// Load core and insert user extension
var nce = new NCE({server:{logger:{level:1}}});
var ext = Ext(nce);

// activate minimum required extensions
var logger = Logger(nce);
var store = Store(nce);
logger.install();
logger.activate();
store.install();
store.activate();

// add server module to use it productive
var server = Server(nce);
server.install();
server.activate();

// now add the user module
ext.install();
ext.activate();

var user = {
  username: "test",
  password: "!234five"
};
ext.createUser(user, function(err){if(err) ext.logger.error(err)});
var user = {
  username: "other",
  password: "!234five"
};
ext.createUser(user, function(err){if(err) ext.logger.error(err)});

nce.requestMiddlewares.push(function(req, res, next){
  if(req.url === "/") {
    res.writeHead(200, {"content-type":"text/plain"});
    if(req.user && req.user.username) res.write("You are logged in as "+req.user.username+"\n");
    res.end("Index...")
  }
  if(req.url === "/auth") return ext.checkAuthentication(req, function(err, user){
    // Authenticated
    if(err) return next(err);
    res.writeHead(200, {"content-type": "text/plain"});
    return res.end("You are logged in as "+req.user.username);
  }, function(err, user){
    // Not authenticated
    if(err) return next(err);
    if(!user) {
      res.writeHead(403, {"content-type":"text/html"});
      return res.end('<html><body><form action="'+req.url+'" method="POST"><input type="text" name="username" placeholder="username"/><input type="password" name="password" placeholder="password"/><input type="submit" value="Login"/></form></body></html>');
    }
    res.writeHead(403, {"content-type": "text/plain"});
    return res.end("You are not allowed to access this resource");
  });
  if(req.url === "/test") return ext.checkAuthentication(req, function(err, user){
    // Authenticated
    if(err) return next(err);
    res.writeHead(200, {"content-type": "text/plain"});
    return res.end("You are logged in as "+req.user.username);
  }, function(err, user){
    // Not authenticated
    if(err) return next(err);
    if(!user) {
      res.writeHead(403, {"content-type":"text/html"});
      return res.end('<html><body><form action="'+req.url+'" method="POST"><input type="text" name="username" placeholder="username"/><input type="password" name="password" placeholder="password"/><input type="submit" value="Login"/></form></body></html>');
    }
    res.writeHead(403, {"content-type": "text/plain"});
    return res.end("You are not allowed to access this resource");
  }, {username:"test"});
  if(req.url === "/logout") {
    req.logout();
    console.log(req.logout.toString());
    //res.writeHead(200, {"content-type": "text/plain"});
    //res.end("You are logged out...");
    res.writeHead(302, {"location": "/"});
    res.end();
  }
  return next();
});

module.exports = nce;