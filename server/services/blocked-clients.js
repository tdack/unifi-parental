'use strict'

class BlockedService {

    constructor(blockedClients) {
        this.blockedClients = blockedClients || {}
    }

    getBlockedClients(groupId) {
        return this.blockedClients.hasOwnProperty(groupId) ? this.blockedClients[groupId] : null
    }

    updateBlockedClients(groupId, blockedClients) {
        this.blockedClients[groupId] = blockedClients
        return true
    }

    deleteBlockedClients(groupId) {
        if (this.blockedClients.hasOwnProperty(groupId)) {
            delete this.blockedClients[groupId]
            return true
        } else {
            return false
        }
    }
}

module.exports = new BlockedService()