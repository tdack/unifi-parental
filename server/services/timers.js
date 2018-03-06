'use strict'

class TimersService {

    constructor(timers) {
        this.timers = timers || {}
    }

    getTimer(groupId) {
        return this.timers.hasOwnProperty(groupId) ? this.timers[groupId] : null
    }

    updateTimer(groupId, timers) {
        this.timers[groupId] = timers
        return true
    }

    deleteTimer(groupId) {
        if (this.timers.hasOwnProperty(groupId)) {
            delete this.timers[groupId]
            return true
        } else {
            return false
        }
    }
}

module.exports = new TimersService()