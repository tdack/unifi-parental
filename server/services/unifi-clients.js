'use strict'

const unifi = require('node-unifi')
const nconf = require('nconf')
const debug = require('debug')('unifi-parental:unifi-service')

class UnifiService {

    constructor() {
        this.controller = new unifi.Controller(nconf.get('controller:host'), nconf.get('controller:port'))
    }

    controllerLogin(callback) {
        return this.controller.getSelf(nconf.get('controller:site'), (err, result) => {
            if (err == 'api.err.LoginRequired') {
                return this.controller.login(nconf.get('controller:user'), nconf.get('controller:password'), (err) => {
                    if (err) {
                        debug('Login error: ', err)
                        return
                    }
                    return callback()
                })
            } else {
                return callback()
            }
        })
    }
    
    getUnifiClients() {
        return this.controllerLogin( () => {
            this.controller.getAllUsers(nconf.get('controller:site'), function(err, users) {
                debug(users[0])
                return users[0]
            })
        })
    }    
}

module.exports = new UnifiService()