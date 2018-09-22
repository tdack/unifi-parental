const bodyParser = require('body-parser')
const debug = require('debug')('unifi-parental:server')
const dotenv = require('dotenv')
const express = require('express')
const fs = require('fs')
const morgan = require('morgan')
const nconf = require('nconf')
const nodeCleanup = require('node-cleanup')
const path = require('path')
const schedule = require('node-schedule')
const spdy = require('spdy')
const unifi = require('node-unifi')
const moment = require('moment')

let app = express(),
    data = {},
    host,
    port,
    timerJobs = {},
    controller

// Add config from .env to process.env
dotenv.config({ path: path.resolve(__dirname, '.env') })

/* Load config from:
   1. Environment variables
   2. config.json
*/

nconf.argv()
    .env({
        separator: "_",
        match: /^(controller|server|DEBUG)/,
        lowerCase: true
    })

const configFile = nconf.get('server:config') || './config.json'
nconf.file('config', { file: path.resolve(__dirname, configFile) })

/* set initial data from config file */
data = nconf.get('data')
port = nconf.get('server:port') || 4000
host = nconf.get('server:host') || '0.0.0.0'

const serverOptions = {
    key: fs.readFileSync(path.resolve(__dirname, './' + nconf.get('server:key'))),
    cert: fs.readFileSync(path.resolve(__dirname, './' + nconf.get('server:cert')))
}

nodeCleanup( (exitCode, signal) => {
    controller.logout()
    nconf.set('data', data)
    nconf.save();
    debug('Config saved')
})

controller = new unifi.Controller(nconf.get('controller:host'), nconf.get('controller:port'))

function controllerLogin(callback) {
    return controller.getSelf(nconf.get('controller:site'), (err, result) => {
        if (err == 'api.err.LoginRequired') {
            return controller.login(nconf.get('controller:user'), nconf.get('controller:password'), (err) => {
                if (err) {
                    debug('Login error: ', err)
                    return
                }
                callback()
            })
        } else {
            callback()
        }
    })
}

/**
* Consolidates timer data and removes unnecessary midnight disable/enables
* @param  {Object} timerdata
* @param  {number} timerdata[].action - 1=enable, 0=disable
* @param  {number} timerdata[].days - bitmask of days this action is for Mon=0...Sun=6
* @param  {string} timerdata[].time - 24hr time that timer is to occur
*/
function consolidateTimers(timerdata) {
    return timerdata;

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
    return actions.sort( (a,b) => { return a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action})
}

function cancelAllJobs(group) {
    if (timerJobs.hasOwnProperty(group)) {
        for (let i = 0; i< timerJobs[group].length; i++) {
            if (timerJobs[group][i] != null) {
              timerJobs[group][i].cancel();
            }
        }
    }
    timerJobs[group] = [];
}

const job = (group, accessAllowed, date) => {
    const unifiClient = (...args) => {
      if (accessAllowed) {
        return controller.unblockClient(...args);
      } else {
        return controller.blockClient(...args);
      }
    };

    controllerLogin(() => {
        data[group].block.forEach((client) => {
            unifiClient(nconf.get('controller:site'), '' + client, (err, result) => {
                  if (err) {
                      debug('Error: ', err)
                      return
                  }
                  debug(`${group} ${date} ${accessAllowed ? "allowed": "blocked"} for ${client}`)
            })
        })
    })
}

function scheduleJobs(group, scheduleActions) {
    cancelAllJobs(group);
    const jobStates = {};
    const now = moment();
    const nowInt = now.unix();
    scheduleActions.forEach((el) => {
        let hour = parseInt(el.time.slice(0,2))
        let minute = parseInt(el.time.slice(2,4))
        if (el.time == "2400") {
            hour = 23
            minute = 59
        }
        const dayOfWeek = (el.day + 1) % 7;
        const scheduleMoment = moment().day(dayOfWeek).hour(hour).minute(minute);
        jobStates[scheduleMoment.unix()] = el.action;
        timerJobs[group].push(
            schedule.scheduleJob({ hour, minute, dayOfWeek }, () => job(group, el.action == 1, scheduleMoment.format("ddd HH:mm")))
        )
    })
    // look for current state
    const jobTimes = Object.keys(jobStates).map(t => parseInt(t)).sort((a, b) => a - b);
    const currentJob = jobTimes.reduce(( accumulator, currentValue ) => nowInt > currentValue ? currentValue : accumulator,  0);
    if (currentJob != null) {
      // set the current state
      job(group, jobTimes[currentJob], now.format("ddd HH:mm"))
    }
}

app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'))

app.get('/api/timer/:group', (req, res) => {
    let group = req.params.group
    data[group].timers.sort( (a,b) => { return a.day < b.day ? -1 : a.day > b.day ? 1 : a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action })
    res.status(200).json(data[group].timers)
})

app.post('/api/timer/:group', (req, res) => {
    if (!req.is('application/json')) {
        return res.send(400)
    }
    let timerdata = req.body
    let group = req.params.group
    scheduleJobs(group, consolidateTimers(timerdata))
    data[group].timers = timerdata.sort( (a,b) => { return a.day < b.day ? -1 : a.day > b.day ? 1 : a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action })
    return res.json(data[group].timers)
})

app.get('/api/groups', (req,res) => {
    res.status(200).json(Object.assign({}, ...Object.keys(data).map(k => ( {[k]: {'name': data[k].name} })) ))
})

app.post('/api/group/:group', (req, res) => {
    let group = req.params.group.replace(/\W/g, '')
    let groupData = req.body
    let newGroup = {}
    newGroup[group] = {"name": groupData.hasOwnProperty('name') ? groupData.name : group, "timers": [], "block": [] }
    data[group] = newGroup[group]
    return res.json(newGroup)
})

app.delete('/api/group/:group', (req, res) => {
    let group = req.params.group
    if (data.hasOwnProperty(group)) {
        if (timerJobs.hasOwnProperty(group)) {
            for (let i = 0; i< timerJobs[group].length; i++) {
                timerJobs[group][i].cancel()
            }
        }
        delete data[group]
        delete timerJobs[group]
        res.sendStatus(204)
    } else {
        res.sendStatus(404)
    }
})

app.get('/api/blocked-clients/:group', (req, res) => {
    let group = req.params.group
    res.status(200).json(data[group].block)
})

app.post('/api/blocked-clients/:group', (req, res) => {
    let group = req.params.group
    data[group].block = req.body
    return res.json(data[group].block)
})

app.get('/api/unifi-clients', (req, res) => {
    controllerLogin( () =>
        controller.getAllUsers(nconf.get('controller:site'), (err, users) => {
            res.status(200).json(users[0] || [{name: "Error: " + err.code}])
        })
    )
})

spdy.createServer(serverOptions, app)
    .listen(port, host, (error) => {
        if (error) {
            console.error(error)
            return process.exit(1)
        } else {
            debug('Listening on port', port);
            Object.values(data).forEach(group => {
              scheduleJobs(group.name, group.timers);
            });
        }
    })
