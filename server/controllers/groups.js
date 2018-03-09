'use strict'
const debug = require('debug')('unifi-parental:groups')

const GroupsService = require('../services/groups')

class GroupsController {

    constructor(router) {
        this.router = router
        this.registerRoutes()
    }

    registerRoutes() {
        this.router.get('/', this.getGroups.bind(this))
        this.router.get('/:id', this.getSingleGroup.bind(this))
        this.router.post('/', this.postGroup.bind(this))
        this.router.put('/:id', this.putGroup.bind(this))
        this.router.delete('/:id', this.deleteGroup.bind(this))
    }

    getGroups(req, res) {
        let groups = GroupsService.getGroups()
        res.send(groups)
    }

    getSingleGroup(req, res) {
        let id = req.params.id
        let group = GroupsService.getSingleGroup(id)

        if (!group) {
            res.sendStatus(404)
        } else {
            res.send(group)
        }
    }

    postGroup(req, res) {
        let groupInfo = req.body

        if (GroupsService.addGroup(groupInfo)) {
            res.send(groupInfo)
        } else {
            res.sendStatus(500)
        }
    }

    putGroup(req, res) {
        let id = req.params.id
        let existingGroup = GroupsService.getSingleGroup(id)
        
        if (!existingGroup) {
            let groupInfo = req.body
            groupInfo.id = id
            if (GroupsService.addGroup(groupInfo)) {
                res.send(groupInfo)
            } else {
                res.sendStatus(500)
            }                
        } else {
            if (GroupsService.updateGroup(id, req.body)) {
                res.sendStatus(204)
            } else {
                res.sendStatus(404)
            }
        }
    }

    deleteGroup(req, res) {
        let id = req.params.id

        if (GroupsService.deleteGroup(id)) {
            res.sendStatus(204)
        } else {
            res.sendStatus(404)
        }
    }
}

module.exports = GroupsController