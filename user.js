"use strict";

var bodyParser = require("body-parser");
var crypto = require("crypto");
var complexity = require("complexity");

var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(nce){
  if(!nce) throw new Error("You have to specify the nce object");
  
//# Mandantory Setup:
  var ext = nce.createExtension({package: require("./package.json")});
  
  ext.on("install", function(event){ // set options, but don't run or make available in nce
    //# Seting extension-config:
    ext.config.logger = ext.config.logger || {};
    
    ext.config.authenticationCallbackURL = ext.config.authenticationCallbackURL || "/authcb";
    ext.config.defaultAdminPassword = ext.config.defaultAdminPassword || false;
    ext.config.modelName = ext.config.modelName || ext.name;
    
    ext.config.local = ext.config.local || {};
    ext.config.local.usernameField = ext.config.local.usernameField || "username";
    ext.config.local.passwordField = ext.config.local.passwordField || "password";
    ext.config.local.saltlen = ext.config.local.saltlen || 32;
    ext.config.local.iterations = ext.config.local.iterations || 25000;
    ext.config.local.keylen = ext.config.local.keylen || 512;
    ext.config.local.encoding = ext.config.local.encoding || "hex";
    
    ext.config.passwordComplexity = ext.config.complexity || {
      uppercase    : 1,  // A through Z
      lowercase    : 1,  // a through z
      special      : 1,  // ! @ # $ & *
      digit        : 1,  // 0 through 9
      alphaNumeric : 1,  // a through Z
      min          : 8,  // minumum number of characters
      //max          : 16, // silly idea to have maximum...
      //exact        : 20  // also kinda silly
    };

    //# Declarations and settings:
    ext.logger = nce.getExtension("winston").createLogger(ext.name, ext.config.logger);
    
    var store = nce.getExtension("mongoose-store");
    var schema = store.createSchema(require("./user-schema"));
    schema.methods.setPassword = function (password, cb) {
      if (!password) {
        return cb(new Error('Missing password'));
      }
      if (!complexity.check(password, ext.config.complexity)) {
        return cb(new Error('Your password is not complex enough'));
      }
          
      var self = this;
      
      crypto.randomBytes(ext.config.local.saltlen, function (err, buf) {
        if (err) return cb(err);

        var salt = buf.toString(ext.config.local.encoding);
        crypto.pbkdf2(password, salt, ext.config.local.iterations, ext.config.local.keylen, function (err, hashRaw) {
          if (err) return cb(err);

          self.set('password', new Buffer(hashRaw, 'binary').toString(ext.config.local.encoding));
          self.set('salt', salt);

          cb(null, self);
        });
      });
    };
    schema.methods.authenticate = function (password, cb) {
      var self = this;

      if (!this.get('salt')) return cb(new Error('No Saltvalue'));

      crypto.pbkdf2(password, this.get('salt'), ext.config.local.iterations, ext.config.local.keylen, function (err, hashRaw) {
        if (err) return cb([err.message]);

        var hash = new Buffer(hashRaw, 'binary').toString(ext.config.local.encoding);

        if (hash === self.get('password')) {
          self.timestamp.last = new Date();
          ext.logger.verbose("User '"+self.username+"' authenticated.", self.timestamp.last);
          cb(null, self);
  
          self.save(function(err){
            if(err) ext.logger.error("Error while saving last login timestamp", err);
          });
          return;
        } else {
          return cb(new Error("Incorrect Password for user '"+(self.username || self.email)+"'"));
        }
      });
    };
    schema.methods.setAdditionalValue = function (name, value, cb) {
      this.additional[name] = value;
      this.save(cb);
    };
    schema.methods.getAdditionalValue = function (name, value, cb) {
      cb = cb || function(){};
      cb(null, this.additional[name]);
      return this.additional[name];
    };
    schema.statics.authenticate = function (username, password, cb) {
      var self = this;
      var query;
      if(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(username)) query = {email: username};
      else query = {username: username};

      self.findOne(query, function (err, user) {
        if (err) return cb(err);
        if (user) user.authenticate(password, cb);
        else return cb(new Error("Unknown user: '"+username+"'"));
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

    passport.serializeUser(function(user, done) {
      done(null, user._id);
    });
    passport.deserializeUser(function(id, done) {
      ext.model.findById(id, done);
    });
  });

  ext.on("uninstall", function(event){ // undo installation
    //# Undeclare:
    nce.getExtension("winston").removeLogger(ext.name);
    nce.getExtension("mongoose-store").removeModel(ext.config.modelName);
    delete ext.model;
    delete ext.logger;
  });
  
  ext.on("activate", function(event){ // don't set options, just run, make available in nce or register.
	  if(nce.requestMiddlewares.indexOf(router) === -1) {
		  nce.requestMiddlewares.push(router);
	  }
	  ext.model.findOne({username:"admin"}, function(err, doc){
      if(err) ext.logger.error(err);
      if(!doc) {
        var passwd = ext.config.defaultAdminPassword || crypto.randomBytes(32).toString('hex');
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
    var localStrategy = new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: ext.config.local.usernameField,
      passwordField: ext.config.local.passwordField,
      //passReqToCallback : true // allows us to pass back the entire request to the callback
    }, function (email, password, done) {
      ext.model.authenticate(email, password, function (err, user) {
        if (err) return done(null, false, {
          message: err.toString()
        });
        else return done(null, user);
      });
    });
    passport.use(localStrategy);
    passportStrategies[localStrategy.name] = localStrategy;
  });
  
  ext.on("deactivate", function(event){ // undo activation
	  if(nce.requestMiddlewares.indexOf(router) !== -1) {
		  nce.requestMiddlewares.splice(nce.requestMiddlewares.indexOf(router), 1);
	  }
  });
  
  //# Private declarations:
  var passportStrategies = {};

  var router = function(req, res, next){
    return passport.initialize()(req, res, function(err){
      if(err) return next(err);
      passport.session()(req, res, function(err){
        if(err) return next(err);
        if(req.url.substr(0, ext.config.authenticationCallbackURL.length) === ext.config.authenticationCallbackURL) {
          var strategyName = req.url.substr(ext.config.authenticationCallbackURL.length).split("/")[1];

          ext.logger.verbose("Authentication callback for "+strategyName);
          if(req.user) ext.logger.info("Logged User '"+(req.user.username || req.user.email)+"' uses the authentication callback '"+strategyName+"'");

          if(passportStrategies[strategyName]) return passport.authenticate(strategyName)(req, res, function(err){
            if(err) return next(err);
            if(req.user) ext.logger.info("Logged User '"+(req.user.username || req.user.email)+"' was authenticated by '"+strategyName+"'");
          });
          else ext.logger.warn("Try to authenticate with unknown strategy '"+strategyName+"'");
        }
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
    if(opts.usergroups) {
      if(RegExp.prototype.isPrototypeOf(opts.usergroups)) {
        var i;
        for (i=0; i<user.usergroups.length; i++) if(opts.usergroups.test(user.usergroups[i])) return authCb(null, user);
        return unauthCb(null, user);
      } else if(typeof opts.usergroups === "string") {
        if(user.usergroups.indexOf(opts.usergroups)>=0) return authCb(null, user);
        else return unauthCb(null, user);
      } else if(Array.prototype.isPrototypeOf(opts.usergroups)) {
        for (i=0; i<user.usergroups.length; i++) if(opts.usergroups.indexOf(user.usergroups[i])>=0) return authCb(null, user);
        if(opts.usergroups.indexOf(user.usergroups) >= 0) return authCb(null, user);
        else return unauthCb(null, user);
      }
    }
    if(opts.id || opts.username || opts.email || opts.usergroups) return unauthCb(null, user);
    return authCb(null, user);
  };

//# Public declarations and exports:
  ext.checkAuthentication = function(req, res, authCb, unauthCb, opts){
    opts = opts || {};
    if(req.user) return proofUser(req.user, opts, authCb, unauthCb);
    else { // !req.user
      if(req.method === "POST") {
        return bodyParser.urlencoded({extended:false})(req, null, function(err){
          if (err) return next(err);
          if(!req.body) return unauthCb();
          if(req.body.strategy) {
            if(passportStrategies[req.body.strategy]) {
              ext.logger.verbose("Authenticating with strategy '"+req.body.strategy+"'");
              return passport.authenticate(req.body.strategy)(req, res);
            }
            ext.logger.warn("Try to authenticate with unknown strategy '"+req.body.strategy+"'", req);
          }
          
          if(!req.body[ext.config.local.usernameField] || !req.body[ext.config.local.passwordField]) return unauthCb();
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
    data.timestamp = data.timestamp || {};
    data.timestamp.created = new Date();
    ext.model.createUser(data, function(err, doc){
      if(err) ext.logger.error("Error while creating user '"+(data.username || data.email)+"'", err);
      else {
        ext.logger.info("Created user '"+(doc.username || doc.email)+"'");
        ext.emit("create", doc);
      }
      return cb(err, doc);
    });
  };
  ext.removeUser = function(id, cb){
    ext.model.remove(id, function(err){
      if(!err) ext.logger.info("Droped userId '"+id+"'");
      ext.emit("remove", id);
      return cb(err);
    });
  };
  ext.getUser = function(query, cb){
    ext.model.findOne(query, cb);
  };
  ext.updateUser = function(query, data, cb){
    ext.model.findOneAndUpdate(query, data, function(err, doc){
      if(!err) ext.logger.info("Updated user '"+(doc.username || doc.email)+"'");
      ext.emit("update", doc);
      return cb(err, doc);
    });
  };
  ext.useStrategy = function(strategy){
    if(!strategy.name) throw new Error("Your strategy has no name! Maybe it is not a correct Strategy!");
    if(passportStrategies[strategy.name]) throw new Error("Your already use a strategy with the name '"+strategy.name+"'!");

    passport.use(strategy);
    passportStrategies[strategy.name] = strategy;
    ext.emit("use", strategy);
  };
  return ext;
}