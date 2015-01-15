"use strict";

var NCE = require("nce");
var ExtMgr = require("nce-extension-manager");
var Ext = require("../");

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
  var extMgr = ExtMgr(nce);
  extMgr.getActivatedExtension("mongoose-store");
  extMgr.activateExtension(extMgr);
  
  it('should be installable', function(done){
    if(extMgr.installExtension(ext) && ext.status === "installed") return done();
    return done(new Error("Can not install extension"));
  });
  it('should be activatable', function(done){
    if(extMgr.activateExtension(ext) && ext.status === "activated") return done();
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
  
  it('should be installable again', function(done){
    if(ext.install()) return done();
    return done(new Error("Can not install extension"));
  });
  it('should be activatable again', function(done){
    if(ext.activate()) return done();
    return done(new Error("Can not activate extension"));
  });
  it('should be deactivatable again', function(done){
    if(ext.deactivate()) return done();
    return done(new Error("Can not deactivate extension"));
  });
  it('should be uninstallable again', function(done){
    if(ext.uninstall()) return done();
    return done(new Error("Can not uninstall extension"));
  });
});

describe('Extension methods', function(){
  var nce = new NCE({user: {modelName:"test1"}});
  var ext = Ext(nce);
  var extMgr = ExtMgr(nce);
  extMgr.activateExtension(extMgr);
  extMgr.activateExtension(ext);
  
  describe('Create and change users and their settings', function(){
    it('should create a new user', function(done){
      this.timeout(5000);
      var user = {
        username: "test",
        password: "!234five",
        email:"test@test.tdl"
      };
      
      ext.createUser(user, done);
    });
    it('should not be able to create a user twice', function(done){
      var user = {
        username: "test",
        password: "!234five",
        email:"test@test.tdl"
      };
      
      ext.createUser(user, function(err){
        if(err) return done();
        return done(new Error("Create a user twice!"));
      });
    });
    it('should not be able to get a user', function(done){
      var user = {
        username: "test",
        email:"test@test.tdl"
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
  var extMgr = ExtMgr(nce);
  extMgr.activateExtension(extMgr);
  extMgr.activateExtension(ext);

  ext.createUser({username:"simple", password: "!234five"}, function(err){
    if(err) return ext.logger.error(err);
  });
  ext.createUser({username:"enhanced", password: "!234five", email:"test@test.tdl"}, function(err){
    if(err) return ext.logger.error(err);
  });
  ext.createUser({username:"group", password: "!234five", usergroups:["first"]}, function(err){
    if(err) return ext.logger.error(err);
  });
  /*ext.createUser({username:"multiplegroups", passowrd: "!234five", usergroups:["first", "second"]}, function(err){
    if(err) return ext.logger.error(err);
  });*/
  
  //# Routes
  //: Informational
  nce.requestMiddlewares = [];
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
      res.writeHead(403, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {username:"enhanced"});
    if(req.url === "/onlyEnhanced/array") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(403, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {username:["enhanced"]});
    if(req.url === "/onlyEnhanced/regex") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(403, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {username: /^enhanced$/});
    
    //: Allowed for usergroups
    if(req.url === "/onlyFirst/string") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(403, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {usergroups:"first"});
    if(req.url === "/onlyFirst/array") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(403, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {usergroups:["first"]});
    if(req.url === "/onlyFirst/regex") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(403, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {usergroups: /^first$/});
    
    //: Allowed for emails
    if(req.url === "/onlyEMail/string") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(403, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {email:"test@test.tdl"});
    if(req.url === "/onlyEMail/array") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(403, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {email:["test@test.tdl"]});
    if(req.url === "/onlyEMail/regex") ext.checkAuthentication(req, res, function(err, user){
      res.writeHead(200, {"content-type": "text/plain"});
      res.end(req.user.username);
    }, function(err, user){
      res.writeHead(403, {"content-type": "text/plain"});
      if(req.user && req.user.username) res.end(req.user.username);
      else res.end("not authenticated");
    }, {email:/^test@test\.tdl$/});
  });
  
  var enhancedUser = {username: "enhanced", usergroups: ["first"], email:"test@test.tdl" };
  var otherUser = {username: "other", usergroups: ["last"], email:"other@was.de"};
  
  describe('Generally authentication', function(){
    it('should be unauthenticated generally', function(done){
      nce.middleware({url:"/getStatus"}, {end:function(str){if(str === "not authenticated") return done(); done(new Error("wrong status"))}, writeHead:function(code, headers){}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should be authenticated generally with user', function(done){
      nce.middleware({user: enhancedUser, url:"/getStatus"}, {end:function(str){if(str === "authenticated") return done(); done(new Error("wrong status: "+str))}, writeHead:function(code, headers){}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
  });
  
  
  describe('Authentication by username', function(){
    it('should authenticate user "enhanced" by string', function(done){
      nce.middleware({user: enhancedUser, url:"/onlyEnhanced/string"}, {end:function(str){}, writeHead:function(code, headers){if(code === 200) return done(); done(new Error("Not authenticated by "));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should not authenticate for other user by string', function(done){
      nce.middleware({user: otherUser, url:"/onlyEnhanced/string"}, {end:function(str){}, writeHead:function(code, headers){if(code === 403) return done(); done(new Error("Authenticated by string"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    
    
    it('should authenticate user "enhanced" by array', function(done){
      nce.middleware({user: enhancedUser, url:"/onlyEnhanced/array"}, {end:function(str){}, writeHead:function(code, headers){if(code === 200) return done(); done(new Error("Not authenticated by array"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should not authenticate for other user by array', function(done){
      nce.middleware({user: otherUser, url:"/onlyEnhanced/array"}, {end:function(str){}, writeHead:function(code, headers){if(code === 403) return done(); done(new Error("Authenticated by array"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    
    it('should authenticate user "enhanced" by regexp', function(done){
      nce.middleware({user: enhancedUser, url:"/onlyEnhanced/regex"}, {end:function(str){}, writeHead:function(code, headers){if(code === 200) return done(); done(new Error("Not authenticated by regexp"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should not authenticate for other user by regexp', function(done){
      nce.middleware({user: otherUser, url:"/onlyEnhanced/regex"}, {end:function(str){}, writeHead:function(code, headers){if(code === 403) return done(); done(new Error("Authenticated by regexp"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
  });
  
  
  describe('Authentication by usergroup', function(){
    it('should authenticate usergroup "first" by string', function(done){
      nce.middleware({user: enhancedUser, url:"/onlyFirst/string"}, {end:function(str){}, writeHead:function(code, headers){if(code === 200) return done(); done(new Error("Not authenticated by "));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should not authenticate for other usergroups by string', function(done){
      nce.middleware({user: otherUser, url:"/onlyFirst/string"}, {end:function(str){}, writeHead:function(code, headers){if(code === 403) return done(); done(new Error("Authenticated by string"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    
    
    it('should authenticate usergroup "first" by array', function(done){
      nce.middleware({user: enhancedUser, url:"/onlyFirst/array"}, {end:function(str){}, writeHead:function(code, headers){if(code === 200) return done(); done(new Error("Not authenticated by array"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should not authenticate for other usergroups by array', function(done){
      nce.middleware({user: otherUser, url:"/onlyFirst/array"}, {end:function(str){}, writeHead:function(code, headers){if(code === 403) return done(); done(new Error("Authenticated by array"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    
    it('should authenticate usergroup "first" by regexp', function(done){
      nce.middleware({user: enhancedUser, url:"/onlyFirst/regex"}, {end:function(str){}, writeHead:function(code, headers){if(code === 200) return done(); done(new Error("Not authenticated by regexp"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should not authenticate for other usergroups by regexp', function(done){
      nce.middleware({user: otherUser, url:"/onlyFirst/regex"}, {end:function(str){}, writeHead:function(code, headers){if(code === 403) return done(); done(new Error("Authenticated by regexp"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
  });
  
  
  describe('Authentication by email', function(){
    it('should authenticate user with email "test@test.tdl" by string', function(done){
      nce.middleware({user: enhancedUser, url:"/onlyEMail/string"}, {end:function(str){}, writeHead:function(code, headers){if(code === 200) return done(); done(new Error("Not authenticated by "));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should not authenticate for other users by email by string', function(done){
      nce.middleware({user: otherUser, url:"/onlyEMail/string"}, {end:function(str){}, writeHead:function(code, headers){if(code === 403) return done(); done(new Error("Authenticated by string"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    
    
    it('should authenticate user with email "test@test.tdl" by array', function(done){
      nce.middleware({user: enhancedUser, url:"/onlyEMail/array"}, {end:function(str){}, writeHead:function(code, headers){if(code === 200) return done(); done(new Error("Not authenticated by array"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should not authenticate for other users by email by array', function(done){
      nce.middleware({user: otherUser, url:"/onlyEMail/array"}, {end:function(str){}, writeHead:function(code, headers){if(code === 403) return done(); done(new Error("Authenticated by array"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    
    it('should authenticate user with email "test@test.tdl" by regexp', function(done){
      nce.middleware({user: enhancedUser, url:"/onlyEMail/regex"}, {end:function(str){}, writeHead:function(code, headers){if(code === 200) return done(); done(new Error("Not authenticated by regexp"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
    it('should not authenticate for other users by email by regexp', function(done){
      nce.middleware({user: otherUser, url:"/onlyEMail/regex"}, {end:function(str){}, writeHead:function(code, headers){if(code === 403) return done(); done(new Error("Authenticated by regexp"));}, write:function(){}}, function(req, res){
        done(new Error("Called unallowed next"));
      });
    });
  });
    
    


});

/*
  // TODO: 
  createUser 
  
*/