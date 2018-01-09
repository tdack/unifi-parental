var bodyParser = require('body-parser'),
    debug = require('debug')('unifi-timer:server'),
    dotenv = require('dotenv'),
    express = require('express'),
    morgan = require('morgan'),
    nconf = require('nconf'),
    nodeCleanup = require('node-cleanup'),
    path = require('path'),
    schedule = require('node-schedule'),
    unifi = require('node-unifi')

var app = express(),
    data = {}
    port = process.env.PORT || 4000

// Add config from .env to process.env
dotenv.config({ path: path.resolve(__dirname, '.env') })

/* Load config from:
   1. Environment variables
   2. config.json
*/

nconf.argv()
    .env({
        separator: "_",
        match: /^unifi/,
        lowerCase: true
    })
    .file('config', { file: path.resolve(__dirname, './config.json') })
/* set initial data from config file */
data = nconf.get('data')

nodeCleanup( (exitCode, signal) => {
    controller.logout()
    nconf.set('data:timers', data.timers)
    nconf.set('data:blocked', data.blocked)
    nconf.save();
    debug('Config saved')
})

var controller = new unifi.Controller(nconf.get('unifi:host'), nconf.get('unifi:port'))
controller.login(nconf.get('unifi:user'), nconf.get('unifi:password'), (err) => {
    if (err) {
        debug('Login error: ', err)
        return
    }
})

/**
* Consolidates timer data and removes unnecessary midnight disable/enables
* @param  {Object} timerdata
* @param  {number} timerdata[].action - 1=enable, 0=disable
* @param  {number} timerdata[].days - bitmask of days this action is for Mon=0...Sun=6
* @param  {string} timerdata[].time - 24hr time that timer is to occur
*/
function consolidateTimers(timerdata) {
    function addDayToBitmap(mask, day) {
        /*jslint bitwise: true*/
        mask |= 1 << day;
        /*jslint bitwise: false*/
        return mask;
    }
    /* Summarise days */
    var actions = []
    var complete = false
    for (var i = 0, len = timerdata.length; i < len; i += 1) {
        var item = {
            action: timerdata[i].action,
            days: addDayToBitmap(0, timerdata[i].day),
            time: timerdata[i].time
        };
        var j = i + 1;
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
            for (var day = 0; day < 7; day += 1) {
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
    return actions.sort( (a,b) => { return a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action})
}

function scheduleJobs(scheduleActions) {
    for (var job in schedule.scheduledJobs) {
        schedule.scheduledJobs[job].cancel()
    }
    scheduleActions.forEach((el) => {
        for (var day=0; day < 7; day++) {
            if ((el.days & 1 << day)) {
                var hour = parseInt(el.time.slice(0,2))
                var minute = parseInt(el.time.slice(2,4))
                if (el.time == "2400") {
                    hour = 23
                    minute = 59
                }
                var j = schedule.scheduleJob({ hour: hour, minute: minute, dayOfWeek: day < 6 ? day + 1 : 0 }, () => {
                    if (el.action == 1) {
                        debug('Access allowed @ ', hour, ':', minute)
                        data.blocked.forEach((client) => {
                            controller.unblockClient(nconf.get('unifi:site'), '' + client, (err, result) => {
                                if (err) console.log('Error: ', err)
                            })
                        })
                    } else {
                        debug('Access blocked @ ', hour, ':', minute)
                        data.blocked.forEach((client) => {
                            controller.blockClient(nconf.get('unifi:site'), '' + client, (err, result) => {
                                if (err) console.log('Error: ', err)
                            })
                        })
                    }
                })
            }
        }
    })
}

app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'))

app.get('/api/timer', (req, res) => {
    data.timers.sort( (a,b) => { return a.day < b.day ? -1 : a.day > b.day ? 1 : a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action })
    res.status(200).json(data.timers)
})

app.post('/api/timer', (req, res) => {
    if (!req.is('application/json')) {
        return res.send(400)
    }
    var timerdata = req.body
    scheduleJobs(consolidateTimers(timerdata))
    data.timers = timerdata.sort( (a,b) => { return a.day < b.day ? -1 : a.day > b.day ? 1 : a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action })
    return res.json(data.timers)
})

app.get('/api/blocked-clients', (req, res) => {
    res.status(200).json(data.blocked)
})

app.post('/api/blocked-clients', (req, res) => {
    data.blocked = req.body
    return res.json(data.blocked)
})

app.get('/api/unifi-clients', (req, res) => {
    controller.getAllUsers(nconf.get('unifi:site'), (err, users) => {
        res.status(200).json(users[0])
    })
})

app.listen(port, () => {
    debug('Listening on port', port)
})