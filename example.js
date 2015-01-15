"use strict";

var NCE = require("nce");
var FacebookStrategy = require('passport-facebook').Strategy;

var nce = new NCE({user:{defaultAdminPassword: "admin!23",logger:{level:"verbose"}}});
var extMgr = require("nce-extension-manager")(nce);
extMgr.activateExtension(extMgr);
extMgr.getActivatedExtension("server");

var fbs = new FacebookStrategy({
    clientID: "-- your client id here... --",
    clientSecret: "-- your client secret here... --",
    callbackURL: "http://localhost:3000/authcb/facebook"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken, refreshToken, profile);
    return done(null, user);
    /*User.findOrCreate(..., function(err, user) {
      if (err) { return done(err); }
      done(null, user);
    });*/
  }
);

// Load core and insert user extension
var ext = extMgr.getActivatedExtension("user");

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

// ext.useStrategy(fbs);

nce.requestMiddlewares.push(function(req, res, next){
  if(req.url === "/") {
    res.writeHead(200, {"content-type":"text/plain"});
    res.end("Index...")
  }
  if(req.url === "/auth") return ext.checkAuthentication(req, res, function(err, user){
    // Authenticated
    if(err) return next(err);
    res.writeHead(200, {"content-type": "text/plain"});
    return res.end("You are logged in");
  }, function(err, user){
    // Not authenticated
    if(err) return next(err);
    if(!user) {
      res.writeHead(403, {"content-type":"text/html"});
      return res.end('<html><body><form action="'+req.url+'" method="POST"><input type="hidden" name="strategy" value="facebook"/><input type="submit" value="Login with Facebook"/></form><form action="'+req.url+'" method="POST"><input type="text" name="username" placeholder="username"/><input type="password" name="password" placeholder="password"/><input type="submit" value="Login"/></form></body></html>');
    }
    res.writeHead(403, {"content-type": "text/plain"});
    return res.end("You are not allowed to access this resource");
  });
  if(req.url === "/test") return ext.checkAuthentication(req, res, function(err, user){
    // Authenticated
    if(err) return next(err);
    res.writeHead(200, {"content-type": "text/plain"});
    return res.end("You are logged in");
  }, function(err, user){
    // Not authenticated
    if(err) return next(err);
    if(!user) {
      res.writeHead(403, {"content-type":"text/html"});
      return res.end('<html><body><form action="'+req.url+'" method="POST"><input type="hidden" name="strategy" value="facebook"/><input type="submit" value="Login with Facebook"/></form><form action="'+req.url+'" method="POST"><input type="text" name="username" placeholder="username"/><input type="password" name="password" placeholder="password"/><input type="submit" value="Login"/></form></body></html>');
    }
    res.writeHead(403, {"content-type": "text/plain"});
    return res.end("You are not allowed to access this resource");
  }, {username:"test", usergroups:"admin"});
  if(req.url === "/logout") {
    req.logout();
    res.writeHead(301, {location:"/"});
    res.end();
  }
  return next();
});