'use strict'

const TimersService = require('../services/timers')

class TimersController {

    constructor(router) {
        this.router = router
        this.registerRoutes()
    }
    registerRoutes() {
        this.router.get('/:id', this.getTimers.bind(this))
        this.router.post('/:id', this.updateTimers.bind(this))
        this.router.put('/:id', this.updateTimers.bind(this))
    }

    getTimers(req, res) {
        let groupId = req.params.id
        let timers = TimersService.getTimer(groupId)

        if (!timers) {
            res.sendStatus(404)
        } else {
            res.send(timers)
        }
    }

    updateTimers(req, res) {
        let groupId = req.params.id
        let times = req.body

        if (TimersService.updateTimer(groupId, times)) {
            res.sendStatus(204)
        } else {
            res.sendStatus(404)
        }
    }
}

module.exports = new TimersController