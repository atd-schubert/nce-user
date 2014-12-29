# NCE user extension
## Description
A user module for nce build with passport

## How to install
Install with npm: `npm install --save nce-user`

Integrate in NCE:

```
var NCE = require("nce");
var nce = new NCE(/*{}*/);
var user = require("nce-user");
var ext = user(nce);
ext.install();
ext.activate();
```

Or use nce-extension-manager...

## How to use
### Basic functions
#### checkAuthentication(request, response, authCb, unauthCb, options)
You can use this function to check for authentication
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