# NCE user extension
## Description
A user module for the [nce framework](https://github.com/atd-schubert/node-nce) build with [passport](https://github.com/jaredhanson/passport).

## How to install
Install with npm: `npm install --save nce-user`


Integrate in NCE with the [extension-manager](https://github.com/atd-schubert/nce-extension-manager):

```
var NCE = require("nce");
var nce = new NCE(/*{}*/);
var extMgr = require("nce-extension-manager")(nce);

var user = extMgr.getActivatedExtension("user");
```

## How to use

### Config settings
You are able to use the following [config-settings](https://github.com/atd-schubert/node-nce/wiki/Extension-Class#configuration) (listed with their defaults):

* `authenticationCallbackURL: "/authcb"`: URL-prefix to listen for authentication callbacks (e.g. OAuth-Callbacks)
* `defaultAdminPassword: false`: In general a function generate a admin password, but you can pass one here.
* `modelName: "user"`: The name for the model in [mongoose store for nce](https://github.com/atd-schubert/nce-mongoose-store).
* `local: {...}`: Object for settings of the [local strategy for passport](https://github.com/jaredhanson/passport-local).
    * `usernameField: "username"`: Fieldname for username for [local passport-strategy](https://github.com/jaredhanson/passport-local).
    * `passwordField: "password"`: Fieldname for the password of the user for [local passport-strategy](https://github.com/jaredhanson/passport-local).
    * `saltLength: 32`: Length of the salt generated for a user.
    * `iterations: 25000`: Numbers of interactions to get a "random" salt.
    * `keyLength: 512`: Length of a stored hashed key.
    * `encoding: "hex"`: Encoding for salts, keys and hashes.
* `complexity: {uppercase:1, lowercase:1, special:1, digit:1, alphaNumeric:1, min:8}`: Set complexity of passwords with the module [complexity](https://www.npmjs.com/package/complexity) look at its documentation for further informations.
* `logger: {}`: Settings for [logger-extension](https://github.com/atd-schubert/nce-winston).

### Schema of users
The schema and model of users are build with mongoose and has the following structure:
* `name`[String]: A name representing a user (not unique!).
* `email`[String]: An email address of an user (unique!).
* `usergroups`[Array of Strings]: Groups of an user.
* `username`[String]: A unique username.
* `password`[String]: You can set a cleartext password but it will be saved salt-hashed.
* `salt`[String]: The salt used for hashing the password (can not be set!).
* `timestamp`[Object]: Timestamps:
    * `created`[Date]: Timestamp of the creation of an user.
    * `last`[Date]: Last login of a user.
* `additional`[Object]: A place to store additional data for an user. Use `user.setAdditionalValue(name, value, cb)` to set additional data and `user.getAdditionalValue(name, value, cb)` to get additional data.

### Basic functions
#### checkAuthentication(request, response, authCb, unauthCb, options)
You can use this function to check for authentication.

##### Arguments
1. `request`[Object]: The request from http(s)-server.
1. `response`[Object]: The response from http(s)-server.
1. `authCb`[Function]: Callback-function if a user is granted:
    1. `error`[Error]: (Not really) used for exceptions. All exceptions goes over the unauthCb!
    1. `user`[Object]: The user-object from passport (`request.user`).
1. `opts`[Object]: Authentication options (one of them have to match to get authenticated, if nothing is set, someone have to be logged in):
    * `id`[String, RegExp or Array]: Only allow users with a matching id.
    * `username`[String, RegExp or Array]: Only allow users with a matching username.
    * `usergroups`[String, RegExp or Array]: Only allow users with a matching usergroup.
    * `email`[String, RegExp or Array]: Only allow users with a matching email-address.

#### createUser(data, callback)
Create a user according to its schema with values for:
* `name`: The (full-)name for a user (it is not possible to authenticate a user with its name!)
* `email`: The email-address of an user
* `username`: The username
* `usergroups`: An array of strings representing groups for users.

#### removeUser(id, callback)
Delete a user account with its internal (mongoose-object-)id.
#### getUser = function(query, callback)
Get the first user matching a query. You are also able to query to "additional values" with "additional".
#### updateUser = function(query, data, callback)
Update user data.
#### useStrategy = function(strategy)
Add other strategies, like facebook or google oauth.
### User Object
#### setAdditionalValue(name, callback)
You are able to set additional values to an user object. This might be a oauth information, a gpg key or an address. You are free to use this values as you and the other modules want.
#### getAdditionalValue(name, callback)
Get the value set by setAdditionalValue
#### authenticate(password, callback)
The password ist hashed with a salt, so you are not able to proof the password directly. With authenticate you are able to proof the correct password.
#### setPassword
The password ist hashed with a salt, so you are not able to set the password directly. With setPassword you are able to set a password.