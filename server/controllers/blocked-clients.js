'use strict'

const BlockedService = require('../services/blocked-clients')

class BlockedController {

    constructor(router){
        this.router = router
        this.registerRoutes()
    }

    registerRoutes() {
        this.router.get('/:id', this.getBlockedClients.bind(this))
        this.router.post('/:id', this.updateBlockedClients.bind(this))
        this.router.put('/:id', this.updateBlockedClients.bind(this))
    }

    getBlockedClients(req, res) {
        let groupId = req.params.id
        let blockedClients = BlockedService.getBlockedClients(groupId)

        if (!blockedClients) {
            res.sendStatus(404)
        } else {
            res.send(blockedClients)
        }
    }

    updateBlockedClients(req, res) {
        let groupId = req.params.id
        let blockedClients = req.body

        if (BlockedService.updateBlockedClients(groupId, blockedClients)) {
            res.sendStatus(204)
        } else {
            res.sendStatus(404)
        }
    }
}

module.exports = new BlockedController