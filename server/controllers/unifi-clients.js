'use strict'

const UnifiService = require('../services/unifi-clients')
const debug = require('debug')('unifi-parental:unifi-controller')

class UnifiController {

    constructor(router){
        this.router = router
        this.registerRoutes()
    }

    registerRoutes() {
        this.router.get('/', this.getUnifiClients.bind(this))
    }

    getUnifiClients(req, res) {
        let unifiClients = UnifiService.getUnifiClients()
        
        debug(unifiClients)

        if (!unifiClients) {
            res.sendStatus(404)
        } else {
            res.send(unifiClients)
        }
    }

}

module.exports = UnifiController