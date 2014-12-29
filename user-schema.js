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
  timestamp: {
    created: Date,
    last: Date
  },
  additional: Object // A place to store other informations from other extensions.
}