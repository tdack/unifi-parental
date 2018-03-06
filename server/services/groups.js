'use strict'

const uuidV4 = require('uuid/v4')


class GroupsService {

    constructor(groups) {
        this.groups = groups || []
    }

    getGroups() {
        return this.groups
    }

    getSingleGroup(groupId) {
        let group = this.groups.filter( g => (g.id === groupId) )[0]

        return group || null
    }

    addGroup(detail) {
        if (!detail || this.groups.filter( g => (g.name === detail.name) ).length > 0) {
            return null
        }

        detail.id = uuidV4()
        this.groups.push(detail)

        return detail
    }

    updateGroup(groupId, detail) {
        let group = this.getSingleGroup(groupId)
        if (group) {
            group.name = detail.name ? detail.name : group.name
            return true
        }
        return false
    }

    deleteGroup(groupId) {
        let oldLen = this.groups.length
        this.groups = this.groups.filter( g => (g.id === groupId) )
        return this.groups.length !== oldLen ? true : false  
    }
}

module.exports = new GroupsService()