"use strict";

module.exports = {
  name: {
    type: String
  },
  email: {
    type: String,
    match: /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
    unique: true,
    sparse: true
  }, // needed only for local, for oauth user not required
  zip: {
    type: String,
    match: /^(\d{5,})?$/
  }, // empty or at least five digits
  phone: {
    type: String
  },
  address: {
    type: String
  },
  usergroups: [{type:String}],
  username: {
    type: String,
    unique: true,
    sparse: true,
    match: /^([a-zA-Z][a-zA-Z_\-\.]{2,})?$/
  },
  password: {
    type: String
  },
  salt: {
    type: String
  },
  gpg: {
    private: String,
    public: String
  },
  oauth: {
    facebook: {
      id: String,
      oauthInfo: Object
    },
    google: {
      id: String,
      oauthInfo: Object
    }
  }, // oauth provider id
  timestamps: {
    created: Date,
    last: Date
  },
  additional: Object // A place to store other informations from other extensions.
/*      tfa: { // TFA AUTH info, based on TOTP Time-Based One-Time Password Algorithm (http://tools.ietf.org/html/rfc6238)
    enabled: {
      type: Boolean,
      default: false
    }, // if enabled, force the user to use tfa after normal login(local/oauth)
    id: {
      type: String,
      unique: true,
      sparse: true
    }, // the TOTP unique id for this prefix/issuer (use email for local or random generated email for oauth providers)
    issuer: {
      type: String,
      default: totpconfig.issuer
    }, // the ISSUER, use also as a prefix
    key: {
      type: String
    }, // the random generated key to pass to google authenticator
    period: {
      type: Number,
      default: totpconfig.period
    }, // optional period for TOTP - Currently, the period parameter is ignored by the Google Authenticator implementations
    lastOtpDate: {
      type: Date
    } // use to compare with ttl to require a new TOTP authentication
  } // Google Authenticator (https://code.google.com/p/google-authenticator/wiki/KeyUriFormat)*/
}