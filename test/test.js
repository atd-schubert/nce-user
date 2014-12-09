"use strict";

var NCE = require("nce");
var Ext = require("../");

var Logger = require("nce-winston");
var Store = require("nce-mongoose-store");

describe('Basic integration in NCE', function(){
  var nce = new NCE();
  
  it('should be insertable into NCE', function(done){
    var ext = Ext(nce);
    if(ext) return done();
    return done(new Error("Is not able to insert extension into NCE"));
  });
});
describe('Basic functions in NCE', function(){
  var nce = new NCE();
  var ext = Ext(nce);
  
  var logger = Logger(nce);
  var store = Store(nce);
  logger.install();
  logger.activate();
  store.install();
  store.activate();
  
  it('should be installable', function(done){
    if(ext.install()) return done();
    return done(new Error("Can not install extension"));
  });
  it('should be activatable', function(done){
    if(ext.activate()) return done();
    return done(new Error("Can not activate extension"));
  });
  it('should be deactivatable', function(done){
    if(ext.deactivate()) return done();
    return done(new Error("Can not deactivate extension"));
  });
  it('should be uninstallable', function(done){
    if(ext.uninstall()) return done();
    return done(new Error("Can not uninstall extension"));
  });
  describe('Create and change users and their settings', function(){
    it('should create a new user', function(done){
      var user = {
        username: "test",
        password: "!234five",
        email:"ich@was.de"
      };
      
      ext.createUser(user, done);
    });
    it('should not be able to create a user twice', function(done){
      var user = {
        username: "test",
        password: "!234five",
        email:"ich@was.de"
      };
      
      ext.createUser(user, function(err){
        if(err) return done();
        return done(new Error("Create a user twice!"));
      });
    });
    it('should be able to get a user', function(done){
      var user = {
        username: "test",
        email:"ich@was.de"
      };
      
      ext.getUser(user, function(err, doc){
        if(err) return done(err);
        if(doc.get("username") === "test") return done();
        return done(new Error("Get wrong user!"));
      });
    });
    it('should not be able to edit a user', function(done){
      var user = {
        username: "test"
      };
      
      ext.updateUser(user, {email:"another@someplace.com"}, function(err, doc){
        if(err) return done(err);
        ext.getUser(user, function(err, doc){
          if(err) return done(err);
          if(doc.get("email")=== "another@someplace.com") return done();
          return done(new Error("Get wrong user!"));
        });
      });
    });
    it('should not be able to drop a user', function(done){
      var user = {
        username: "test"
      };
      
      ext.removeUser(user, done);
    });
    it('should not be able to find a droped user', function(done){
      var user = {
        username: "test"
      };
      
      ext.getUser(user, function(err, doc){
        if(err) return done(err);
        if(doc) return done(new Error("Got a dropped user"));
        return done();
      });
    });
  });
  /*
  describe('Use the middleware for authentication', function(){
    var user = {
      username: "test",
      password: "!234five",
      email:"ich@was.de"
    };
    var cbs = {
      isAuth: function(){},
      isNotAuth: function(){}
    };
    nce.requestMiddlewares.push(function(req, res, next){
      if(req.url === "/auth") ext.checkAuthentication(req, function(err, user){cbs.isAuth(err, user);}, function(err, user){cbs.isNotAuth(err, user);});
      if(req.url === "/test") ext.checkAuthentication(req, function(err, user){cbs.isAuth(err, user);}, function(err, user){cbs.isNotAuth(err, user);}, {username:"test"});
    });/*
    var testExt = nce.createExtension({package:{name:"testing"}});
    ext.createUser(user, function(err){
      if(err) return ext.logger.error("Error in creating a new user");
      
      
      
      
    });
  });*/
});

/*
  // TODO: 
  createUser verschiedene mit verschiedenen 
  
*/