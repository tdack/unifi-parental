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
        let timers = TimersService.getTimers(groupId)

        if (!timers) {
            res.sendStatus(404)
        } else {
            res.send(timers)
        }
    }

    updateTimers(req, res) {
        let groupId = req.params.id
        let timers = req.body

        if (TimersService.updateTimers(groupId, timers)) {
            switch (req.method) {
                case "POST": {
                    res.setHeader('Location', req.baseUrl + '/' + groupId);
                    res.sendStatus(201)
                    break
                }
                case "PUT": {
                    res.sendStatus(204)
                    break
                }
                default: res.sendStatus(500)
            }
        } else {
            res.sendStatus(404)
        }
    }
}

module.exports = TimersController