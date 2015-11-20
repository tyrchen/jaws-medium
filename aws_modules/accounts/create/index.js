/**
 * AWS Module: Action: Modularized Code
 */

var AWS = require('aws-sdk');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var debug = require('debug')('accounts');
var joi = require('joi');
var moment = require('moment');
var Promise = require('bluebird');

var ACCOUNT_TABLE = 'jaws-medium-accounts';
var SALT_ROUND = 10;

var dynamoDb = new AWS.DynamoDB();
Promise.promisifyAll(Object.getPrototypeOf(dynamoDb));

function validate(data) {
  var schema = {
    username: joi.string().alphanum().min(6).max(12).required(),
    password: joi.string().min(8).max(16).required(),
    email: joi.string().email().required(),
    fullname: joi.string().regex(/^[a-zA-Z0-9\.\s]{3,30}$/).required(),
    bio: joi.string()
  };

  return new Promise(function(res, rej) {
    joi.validate(data, schema, function(err, user) {
      if (err) {
        rej(err);
      } else {
        dynamoDb.getItemAsync({
          TableName: ACCOUNT_TABLE,
          Key: {
            username: {S: user.username}
          }
        }).then(function(result) {
          if (result && result.Item) {
            rej(new Error('User ' + user.username + ' has already existed'));
          } else {
            res(user);
          }
        }).catch(function(err) {
          rej(err);
        })
      }
    });
  });
}

function encryptPassword(password) {
  var salt = bcrypt.genSaltSync(SALT_ROUND);
  return {
    salt: salt,
    password: bcrypt.hashSync(password, salt)
  }
}

function generateActivationCode(size) {
  return crypto.randomBytes(size).toString('hex');
}

function createUser(user) {
  debug(ACCOUNT_TABLE + ': Saving user ' + user.username + ' with data: ' + JSON.stringify(user));
  var p = encryptPassword(user.password);
  var dt = moment().unix();
  return dynamoDb.putItemAsync({
    TableName: ACCOUNT_TABLE,
    Item: {
      username: {S: user.username},
      email: {S: user.email},
      password: {S: p.password},
      salt: {S: p.salt},
      fullname: {S: user.fullname},
      bio: {S: user.bio || ''},
      activationCode: generateActivationCode(12),
      createdAt: {N: dt},
      updatedAt: {N: dt}
    }
  });
}

// Export For Lambda Handler
module.exports.run = function(event, context, cb) {
  return validate(event).then(createUser)
    .then(function(result) {
      cb(null, result);
    })
    .error(function(error) {
      cb(error, null);
    })
};
