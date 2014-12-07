"use strict";

var fs = require("fs");
var bodyParser = require("body-parser");
var crypto = require("crypto");

var passport = require("passport");
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(cms){
  if(!cms) throw new Error("You have to specify the cms object");
  
//# Mandantory Setup:
  var ext = cms.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){ // set options, but don't run or make available in cms
    //# Seting extension-config:
    ext.config.logger = ext.config.logger || {};
    
    ext.config.oauthRoute = ext.config.oauthRoute || "/oauth";
    ext.config.modelName = ext.config.modelName || ext.name;
    
    ext.config.local = ext.config.local || {};
    ext.config.local.usernameField = ext.config.local.usernameField || "username";
    ext.config.local.passwordField = ext.config.local.passwordField || "password";
    ext.config.local.saltlen = ext.config.local.saltlen || 32;
    ext.config.local.iterations = ext.config.local.iterations || 25000;
    ext.config.local.keylen = ext.config.local.keylen || 512;
    ext.config.local.encoding = ext.config.local.encoding || "hex";
    
    ext.config.oauths = ext.config.oauths || {};
    
    // Oauths
    // Facebook
    ext.config.oauths.facebook = ext.config.oauths.facebook || {};
    ext.config.oauths.facebook.clientId = ext.config.oauths.facebook.clientId || null;
    ext.config.oauths.facebook.clientSecret = ext.config.oauths.facebook.clientSecret || null;
    ext.config.oauths.facebook.callbackUrl = ext.config.oauths.facebook.callbackUrl || null; // ext->server->protokol+hostname+port/ oauthRoute + "/facebook/callback"
    ext.config.oauths.facebook.initUrl = ext.config.oauths.facebook.initUrl || null; // ext->server->protokol+hostname+port/ oauthRoute + "/facebook/callback"

    // Google
    ext.config.oauths.google = ext.config.oauths.google || {};
    ext.config.oauths.google.clientId = ext.config.oauths.google.clientId || null;
    ext.config.oauths.google.clientSecret = ext.config.oauths.google.clientSecret || null;
    ext.config.oauths.google.callbackUrl = ext.config.oauths.google.callbackUrl || null; // ext->server->protokol+hostname+port/ oauthRoute + "/google/callback"
    ext.config.oauths.google.initUrl = ext.config.oauths.google.initUrl || null; // ext->server->protokol+hostname+port/ oauthRoute + "/google/callback"

    //# Declarations and settings:
    ext.logger = cms.getExtension("winston").createLogger(ext.name, ext.config.logger);
    
    var store = cms.getExtension("mongoose-store");
    var schema = store.createSchema(require("./user-schema"));
    schema.methods.setPassword = function (password, cb) {
      if (!password) {
        return cb(new Error('Missing password'));
      }
      if (password.length < 8) {
        // NOTE: if needed extend this with custom configurable validators, use https://www.npmjs.org/package/complexity
        return cb(new Error('Password too short, minimum 8 characters'));
      }
      if (/^[a-zA-Z0-9]{1,15}$/.test(password)) {
        // NOTE: if needed extend this with custom configurable validators, use https://www.npmjs.org/package/complexity
        return cb(new Error('Password have no special characters.'));
      }
    
      var self = this;
      
      crypto.randomBytes(ext.config.local.saltlen, function (err, buf) {
        if (err) {
          return cb(err);
        }
    
        var salt = buf.toString(ext.config.local.encoding);
    
        crypto.pbkdf2(password, salt, ext.config.local.iterations, ext.config.local.keylen, function (err, hashRaw) {
          if (err) {
            return cb(err);
          }
    
          self.set('password', new Buffer(hashRaw, 'binary').toString(ext.config.local.encoding));
          self.set('salt', salt);
          
          cb(null, self);
        });
      });
    };
    schema.methods.authenticate = function (password, cb) {
      var self = this;
    
      if (!this.get('salt')) {
        return cb(new Error('No Saltvalue'));
      }
    
      crypto.pbkdf2(password, this.get('salt'), ext.config.local.iterations, ext.config.local.keylen, function (err, hashRaw) {
        if (err) {
          return cb([err.message]);
        }
    
        var hash = new Buffer(hashRaw, 'binary').toString(ext.config.local.encoding);
    
        if (hash === self.get('password')) {
          return cb(null, self);
        } else {
          return cb(new Error('incorrect Password'));
        }
      });
    };
    schema.statics.authenticate = function (username, password, cb) {
      var self = this;
      var query;
      if(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(username)) query = {email: username};
      else query = {username: username};
      
      self.findOne(query, function (err, user) {
        if (err) {
          return cb(err);
        }
        if (user) {
          user.authenticate(password, cb);
          //if (!(user[0] instanceof self)) user = new self(user[0]);
          //user.authenticate(password, cb);
        } else {
          return cb(new Error("Unknown user: '"+username+"'"));
        }
      });
    };
    schema.statics.createUser = function(data, cb) {
      var passwd = data.password;
      delete data.password;
      var user = new this(data);
      user.setPassword(passwd, function(err, doc){
        if(err) return cb(err);
        doc.save(cb);
      });
    };
    ext.model = store.createModel(ext.config.modelName, schema);
    
    ext.model.findOne({username:"admin"}, function(err, doc){
      if(err) ext.logger.error(err);
      if(!doc) {
        var passwd = crypto.randomBytes(32).toString('hex');
        ext.logger.warn("There is no admin! Create one with password '"+passwd+"'.");
        var admin = {
          username:"admin",
          usergroups: ["admin"],
          password: passwd
        };
        ext.createUser(admin, function(err){
          if(err) return ext.logger.error(err);
          ext.logger.warn("User 'admin' created...");
        });
      }
    });
    
    passport.serializeUser(function(user, done) {
      done(null, user._id);
    });
    passport.deserializeUser(function(id, done) {
      ext.model.findById(id, done);
    });
  });
  
  ext.on("uninstall", function(event){ // undo installation
    //# Undeclare:
    
  });
  
  ext.on("activate", function(event){ // don't set options, just run, make available in cms or register.
	  if(cms.requestMiddlewares.indexOf(router) === -1) {
		  cms.requestMiddlewares.push(router);
	  }
    var localStrategy = new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: ext.config.local.usernameField,
      passwordField: ext.config.local.passwordField,
      //passReqToCallback : true // allows us to pass back the entire request to the callback
    }, function (email, password, done) {
  
      ext.model.authenticate(email, password, function (err, user) {
        if (err) {
          return done(null, false, {
            message: err.toString()
          });
        } else {
          return done(null, user);
        }
      });
    });
    passport.use(localStrategy);
  });
  
  ext.on("deactivate", function(event){ // undo activation
	  if(cms.requestMiddlewares.indexOf(router) !== -1) {
		  cms.requestMiddlewares.splice(cms.requestMiddlewares.indexOf(router), 1);
	  }
  });
  
  //# Private declarations:
  var router = function(req, res, next){
    return passport.initialize()(req, res, function(err){
      if(err) return next(err);
      passport.session()(req, res, function(err){
        if(err) return next(err);
        return next();
      });
    });
  };
  
  var proofUser = function(user, opts, authCb, unauthCb) {
    if(opts.id) {
      if(RegExp.prototype.isPrototypeOf(opts.id) && opts.id.test(user._id.toString())) return authCb(null, user);
      else if(typeof opts.id === "string" && opts.id === user._id.toString()) return authCb(null, user);
      else if(Array.prototype.isPrototypeOf(opts.id) && opts.id.indexOf(user._id.toString()) >= 0) return authCb(null, user);
    }
    if(opts.username) {
      if(RegExp.prototype.isPrototypeOf(opts.username) && opts.username.test(user.username)) return authCb(null, user);
      else if(typeof opts.username === "string" && opts.username === user.username) return authCb(null, user);
      else if(Array.prototype.isPrototypeOf(opts.username) && opts.username.indexOf(user.username) >= 0) return authCb(null, user);
    }
    if(opts.email) {
      if(RegExp.prototype.isPrototypeOf(opts.email) && opts.email.test(user.email)) return authCb(null, user);
      else if(typeof opts.email === "string" && opts.email === user.email) return authCb(null, user);
      else if(Array.prototype.isPrototypeOf(opts.email) && opts.email.indexOf(user.email) >= 0) return authCb(null, user);
    }
    if(opts.group) {
      if(RegExp.prototype.isPrototypeOf(opts.group)) {
        var i;
        for (i=0; i<user.group.length; i++) if(opts.group.test(user.group[i])) return authCb(null, user);
        return unauthCb(null, user);
      } else if(typeof opts.group === "string") {
        if(user.group.indexOf(opts.group)>=0) return authCb(null, user);
        else return unauthCb(null, user);
      } else if(Array.prototype.isPrototypeOf(opts.group)) {
        for (i=0; i<user.group.length; i++) if(opts.group.indexOf(user.group[i])) return authCb(null, user);
        if(opts.group.indexOf(user.group) >= 0) return authCb(null, user);
        else return unauthCb(null, user);
      }
    }
    if(opts.id || opts.username || opts.email || opts.group) return unauthCb(null, user);
    return authCb(null, user);
  };

//# Public declarations and exports:
  ext.checkAuthentication = function(req, authCb, unauthCb, opts){
    opts = opts || {};
    if(req.user) return proofUser(req.user, opts, authCb, unauthCb);
    else { // !req.user
      if(req.method === "POST") {
        return bodyParser.urlencoded({extended:false})(req, null, function(err){
          if (err) return next(err);
          if(!req.body || !req.body[ext.config.local.usernameField] || !req.body[ext.config.local.passwordField]) return unauthCb();
          ext.model.authenticate(req.body[ext.config.local.usernameField], req.body[ext.config.local.passwordField],function(err, user){
            if(err) return unauthCb(err);
            if(!user) ext.logger.warn("Wrong user credentials!")
            return req.logIn(user, function(err) {
              if(err) return unauthCb(err);
              return proofUser(user, opts, authCb, unauthCb);
            });
          });
          // ext.config.model.  ext.config.model.ext.config.model.ext.config.model.ext.config.model.ext.config.model.ext.config.mod
        });
      }
      else return unauthCb();
    }
  };
  ext.logout = function(req){ // use req.logout directly!
    req.logout();
  };
  ext.createUser = function(data, cb){
    ext.model.createUser(data, function(err, doc){
      if(!err) ext.logger.info("Created user '"+(doc.username || doc.email)+"'");
      return cb(err, doc);
    });
  };
  ext.removeUser = function(id, cb){
    ext.model.remove(id, function(err){
      if(!err) ext.logger.info("Droped userId '"+id+"'");
      return cb(err);
    });
  };
  ext.getUser = function(query, cb){
    ext.model.findOne(query, cb);
  };
  ext.updateUser = function(query, data, cb){
    ext.model.findOneAndUpdate(query, data, function(err, doc){
      if(!err) ext.logger.info("Updated user '"+(doc.username || doc.email)+"'");
      return cb(err, doc);
    });
  };
  
  return ext;
}