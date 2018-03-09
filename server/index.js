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

let app = express(),
    data = {},
    port,
    timerJobs = {},
    controller

// Add config from .env to process.env
console.log(path.resolve(__dirname, '.env'))
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

const serverOptions = {
    key: fs.readFileSync(path.resolve(__dirname, './' + nconf.get('server:key'))),
    cert: fs.readFileSync(path.resolve(__dirname, './' + nconf.get('server:cert')))
}

nodeCleanup( (exitCode, signal) => {
    // controller.logout()
    nconf.set('data', data)
    nconf.save();
    debug('Config saved')
})

app.use(morgan('dev'))
app.use(bodyParser.json())

let apiRouter = express.Router()
let apiV1 = express.Router()
let groupsRouter = express.Router()
let blockedClientRouter = express.Router()
let timersRouter = express.Router()
let unifiRouter = express.Router()

app.use('/api', apiRouter)
apiRouter.use('/v1', apiV1)
apiV1.use('/groups', groupsRouter)
apiV1.use('/blocked-clients', blockedClientRouter)
apiV1.use('/timers', timersRouter)
apiV1.use('/unifi-clients', unifiRouter)

app.use(express.static(__dirname + '/../public'))

let GroupsService = require('./services/groups')
let TimersService = require('./services/timers')
let BlockedClientService = require('./services/blocked-clients')

let groupController = require('./controllers/groups')
let blockedClientController = require('./controllers/blocked-clients')
let timersController = require('./controllers/timers')
let unifiController = require('./controllers/unifi-clients')

let gc = new groupController(groupsRouter)
let bc = new blockedClientController(blockedClientRouter)
let tc = new timersController(timersRouter)
let uc = new unifiController(unifiRouter)

let g1 = GroupsService.addGroup({name: 'Group 1'})
let b1 = BlockedClientService.updateBlockedClients(g1.id, ["b8:27:eb:de:91:68", "c8:60:00:9a:ba:ca", "d8:1d:72:c6:20:96", "90:2b:34:05:2f:27", "2c:0e:3d:ad:e7:d4", "50:1a:c5:a9:91:39", "50:1a:c5:a9:91:37"])
let t1 = TimersService.updateTimers(g1.id,[{"day": 0,  "action": 1,  "time": "0700"},{"day": 0,  "action": 0,  "time": "2230"},{"day": 1,  "action": 1,  "time": "0700"},{"day": 1,  "action": 0,  "time": "2230"}])

/* ********************************************************
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
            res.status(200).json(users[0])
        })
    )
})
   ******************************************************** */

spdy.createServer(serverOptions, app)
    .listen(port, (error) => {
        if (error) {
            console.error(error)
            return process.exit(1)
        } else {
            debug('Listening on port', port)          
        }
    })
