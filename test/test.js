"use strict";

var NCE = require("nce");
var Ext = require("../");

var http = require("http");
var request = require("request");

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
    setTimeout(function(){
      if(ext.uninstall()) return done();
      return done(new Error("Can not uninstall extension"));
    }, 100);
  });
});
describe('Extension methods', function(){
  var nce = new NCE({user: {modelName:"test1"}});
  var ext = Ext(nce);
  
  var logger = Logger(nce);
  var store = Store(nce);
  logger.install();
  logger.activate();
  store.install();
  store.activate();
  ext.install();
  ext.activate();
  
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
    it('should not be able to get a user', function(done){
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
    it('should be able to edit a user', function(done){
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
    it('should be able to drop a user', function(done){
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
});

describe('Middleware methods and authentication', function(){
  var nce = new NCE({user: {modelName:"test2"}});
  var ext = Ext(nce);
  
  var logger = Logger(nce);
  var store = Store(nce);
  logger.install();
  logger.activate();
  store.install();
  store.activate();
  
  ext.activate();
  ext.install();
  
  http.createServer(nce.middleware).listen(1337);
  
  ext.createUser({username:"simple", passowrd: "!234five"}, function(err){
    if(err) return ext.logger.error(err);
  });
  ext.createUser({username:"enhanced", passowrd: "!234five", email:"test@test.tdl"}, function(err){
    if(err) return ext.logger.error(err);
  });
  ext.createUser({username:"group", passowrd: "!234five", usergroups:["first"]}, function(err){
    if(err) return ext.logger.error(err);
  });
  /*ext.createUser({username:"multiplegroups", passowrd: "!234five", usergroups:["first", "second"]}, function(err){
    if(err) return ext.logger.error(err);
  });*/
  
  //# Routes
  //: Informational
  nce.requestMiddlewares.push(function(req, res, next){
    if(req.url === "/getStatus") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end("authenticated");
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end("not authenticated");
    });
    if(req.url === "/getUsername") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(403, {"content-type": "text/plain"});
      res.end("not authenticated");
    });
    
    //: Allowed for user
    if(req.url === "/onlyEnhanced/string") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {username:"enhanced"});
    if(req.url === "/onlyEnhanced/array") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {username:["enhanced"]});
    if(req.url === "/onlyEnhanced/regex") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {username: /^enhanced$/});
    
    //: Allowed for usergroups
    if(req.url === "/onlyEnhanced/string") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {usergroups:"first"});
    if(req.url === "/onlyEnhanced/array") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {usergroups:["first"]});
    if(req.url === "/onlyEnhanced/regex") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {usergroups: /^first$/});
    
    //: Allowed for emails
    if(req.url === "/onlyEnhanced/string") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {email:"test@test.tdl"});
    if(req.url === "/onlyEnhanced/array") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {email:["test@test.tdl"]});
    if(req.url === "/onlyEnhanced/regex") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {email:/^test@test.tdl$/});
  });
  
  describe('Basic authentication tests', function(){
    it('should be unauthenticated generally', function(done){
      request("http://localhost:1337/getStatus", function(a,b,c){
        if(c==="not authenticated") return done();
        return done(new Error("Wrong response: "+c));
      });
    });
  });
});

/*
  // TODO: 
  createUser verschiedene mit verschiedenen 
  
*/