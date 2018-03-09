'use strict'

const schedule = require('node-schedule')

class TimersService {

    constructor(timers) {
        this.timers = timers || {}
        this.jobs = {}
    }

    getTimers(groupId) {
        return this.timers.hasOwnProperty(groupId) ? this.timers[groupId] : null
    }

    updateTimers(groupId, timers) {
        this.timers[groupId] = timers.sort((a, b) => { return a.day < b.day ? -1 : a.day > b.day ? 1 : a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action })
        return true
    }

    deleteTimers(groupId) {
        if (this.timers.hasOwnProperty(groupId)) {
            delete this.timers[groupId]
            return true
        } else {
            return false
        }
    }

    getJobs(groupId) {
        return this.jobs.hasOwnProperty(groupId) ? this.jobs[groupId] : null
    }

    updateJobs(groupId, jobs) {
        this.jobs[groupId] = jobs 
    }

    /**
    * Consolidates timer data and removes unnecessary midnight disable/enables
    * @param  {Object} timerdata
    * @param  {number} timerdata[].action - 1=enable, 0=disable
    * @param  {number} timerdata[].days - bitmask of days this action is for Mon=0...Sun=6
    * @param  {string} timerdata[].time - 24hr time that timer is to occur
    */
    consolidateTimers(timerdata) {
        function addDayToBitmap(mask, day) {
            /*jslint bitwise: true*/
            mask |= 1 << day;
            /*jslint bitwise: false*/
            return mask;
        }
        /* Summarise days */
        let actions = []
        let complete = false
        for (let i = 0, len = timerdata.length; i < len; i += 1) {
            let item = {
                action: timerdata[i].action,
                days: addDayToBitmap(0, timerdata[i].day),
                time: timerdata[i].time
            };
            let j = i + 1;
            while (j < timerdata.length && timerdata[j].time === timerdata[i].time && timerdata[j].action === timerdata[i].action) {
                item.days = addDayToBitmap(item.days, timerdata[j].day)
                i = j
                j += 1
            }
            actions.push(item)
        }

        if (actions.length > 1) {
            /* remove unnecessary midnight switching times */
            if (actions[0].time === "0000" && actions[actions.length - 1].time === "2400") {
                for (let day = 0; day < 7; day += 1) {
                    /*jslint bitwise: true*/
                    if ((actions[actions.length - 1].days & 1 << day) && (actions[0].days & 1 << ((day + 1) % 7))) {
                        actions[actions.length - 1].days ^= 1 << day
                        actions[0].days ^= 1 << ((day + 1) % 7)
                    }
                    /*jslint bitwise: false*/
                }
                if (actions.length === 2) {
                    complete = true
                }
                if (actions[actions.length - 1].days === 0) {
                    actions.pop()
                }
                if (actions[0].days === 0) {
                    actions.shift()
                }
                if (complete && actions.length !== 0) {
                    complete = false
                }
            }
        }
        return actions.sort((a, b) => { return a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action })
    }

    scheduleJobs(groupId) {
        let jobs = this.getJobs(groupId)
        let scheduleActions = this.consolidateTimers(this.getTimers(groupId))
        for (let i = 0; i < jobs.length; i++) {
            jobs[i].cancel()
        }
        jobs = []
        scheduleActions.forEach((el) => {
            for (let day = 0; day < 7; day++) {
                if ((el.days & 1 << day)) {
                    let hour = parseInt(el.time.slice(0, 2))
                    let minute = parseInt(el.time.slice(2, 4))
                    if (el.time == "2400") {
                        hour = 23
                        minute = 59
                    }
                    jobs.push(schedule.scheduleJob({ hour: hour, minute: minute, dayOfWeek: day < 6 ? day + 1 : 0 }, () => {
                        if (el.action == 1) {
                            controllerLogin(() => {
                                data.blocked.forEach((client) => {
                                    controller.unblockClient(nconf.get('controller:site'), '' + client, (err, result) => {
                                        if (err) {
                                            debug('Error: ', err)
                                            return
                                        }
                                        debug('Access allowed @ ', hour, ':', minute, 'for', client)
                                    })
                                })
                            })
                        } else {
                            controllerLogin(() => {
                                data.blocked.forEach((client) => {
                                    controller.blockClient(nconf.get('controller:site'), '' + client, (err, result) => {
                                        if (err) {
                                            debug('Error: ', err)
                                            return
                                        }
                                        debug('Access blocked @ ', hour, ':', minute, 'for', client)
                                    })
                                })
                            })
                        }
                    }))
                }
            }
        })
        this.updateJobs(jobs)
    }
}

module.exports = new TimersService()