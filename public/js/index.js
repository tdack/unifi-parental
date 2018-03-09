let unifiParental = {
    gTimer: null,
    clientSelect: null,
    groupSelect: null,

/**
 * Extract timer data from server into on/off periods
 * @param  {Object} timerdata - data returned from the server
 * @param  {number} timerdata[].action - 1=enable, 0=disable
 * @param  {number} timerdata[].day -  day this action is for Mon=0...Sun=6
 * @param  {string} timerdata[].time - 24hr time that timer is to occur
 */
    extractTimerData(res) {
        let timers = Object.values(JSON.parse(res)).sort((a, b) => {
            return a.day < b.day ? -1 : a.day > b.day ? 1 : a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action
        })
        let periods = []
        for (let i = 0; i < timers.length; i = i + 2) {
            let day = timers[i].day
            if (typeof periods[day] === 'undefined') {
                periods[day] = []
            }
            periods[day].push({ on: timers[i].time, off: timers[i + 1].time })
        }
        for (let i = 0; i < 7; i++) {
            if (typeof periods[i] === 'undefined') {
                periods[i] = []
            }
        }
        return periods
    },
/*
* Get items that are selected in a list
* @param  {Object} select - html <select> element containing <option> items
*/
    getSelectValues(select) {
        let result = [];
        let options = select && select.options;
        let opt;

        for (let i = 0, iLen = options.length; i < iLen; i++) {
            opt = options[i];

            if (opt.selected) {
                result.push(opt.value || opt.text);
            }
        }
        return result;
    },

    handleformSubmit(event) {
        event.preventDefault()
        let groupId = unifiParental.groupSelect.getElementsByClassName('checked')[0].dataset.value
        let data = {}
        data = unifiParental.gTimer.save()
        ajaxPostJSON('/api/V1/timers/' + groupId, data, (xhr) => {
            if (xhr.status == 200) {
                unifiParental.gTimer = createTimer('uiTimer', unifiParental.extractTimerData(xhr.response))
            }
            let blockedClients = unifiParental.getSelectValues(document.forms[0].elements.namedItem('clients'))
            ajaxPostJSON('/api/V1/blocked-clients/' + groupId, blockedClients, (xhr) => {
                if (xhr.status == 200) {
                    let editTimeDiv = jxl.getByClass('editTime')[0]
                    let editTimeSpan = editTimeDiv.childNodes[1]
                    editTimeSpan.innerHTML = 'Saved'
                    if (!jxl.hasClass(editTimeDiv, "show")) {
                        jxl.addClass(editTimeDiv, "show");
                        setTimeout(() => {
                            jxl.removeClass(editTimeDiv, 'show')
                        }, 1500)
                    }
                }
            })
        })
    },

    handleGroupClick(event) {
        let groupId = event.target.dataset.value
        let groupItems = event.target.parentNode.getElementsByTagName('li')
        for (let i = 0; i < groupItems.length; i++) {
            groupItems[i].classList.remove('checked')
        }
        event.target.classList.toggle('checked')
        ajaxGet('/api/V1/timers/' + groupId, (res) => {
            let timerData = res.status === 200 ? unifiParental.extractTimerData(res.response) : []
            unifiParental.gTimer = createTimer('uiTimer', timerData)
        })
        ajaxGet('/api/V1/blocked-clients/' + groupId, (res) => {
            let blockedClientsSet = res.status === 200 ? new Set(JSON.parse(res.response)) : new Set([])
            for (let i = 0; i < unifiParental.clientSelect.children.length; i++) {
                let clientOption =  unifiParental.clientSelect.children[i]
                if (blockedClientsSet.has(clientOption.value)) {
                    clientOption.selected = true
                } else {
                    clientOption.selected = false
                }
            }
        })
    },

    handleAddGroup(event) {
        event.preventDefault()
        let name = document.getElementById('groupName').value
        ajaxPost('/api/V1/groups', {name: name}, (res) => {
            if (res.status === 200) {
                let group = JSON.parse(res.response)
                let groupOption = document.createElement('li')
                let span = document.createElement("span")
                groupOption.setAttribute('data-value', group.id)
                groupOption.innerText = group.name
                span.className = "close"
                span.appendChild(document.createTextNode("\u00D7"))
                span.onclick = unifiParental.handleDeleteGroup
                groupOption.appendChild(span)
                groupOption.onclick = unifiParental.handleGroupClick              
                unifiParental.groupSelect.appendChild(groupOption)
                unifiParental.groups.push(group)
                }
        })
},

    handleDeleteGroup(event) {
        event.stopPropagation()
        let groupId = event.target.parentNode.dataset.value
        ajaxDelete('/api/V1/groups/' + groupId, null, (res) => {
            event.target.parentNode.parentNode.removeChild(event.target.parentNode)
        })
    }
}

document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        // document ready

        let form = document.getElementById('uiMainform')
        form.addEventListener('submit', unifiParental.handleformSubmit)

        let uiTimer = getHtmlTimer('uiTimer', { active: 'Internet use allowed', inactive: 'Internet use blocked' })
        document.getElementById('uiTimerArea').append(uiTimer)

        unifiParental.groupSelect = document.getElementById('groups')
        unifiParental.clientSelect = document.getElementById('clients')

        document.getElementById('addGroup').addEventListener('click', unifiParental.handleAddGroup)

        ajaxGet('/api/V1/groups', (res) => {
            unifiParental.groups = JSON.parse(res.response)
            
            for (let group in unifiParental.groups) {
                let groupOption = document.createElement('li')
                let span = document.createElement("span")
                groupOption.setAttribute('data-value',  unifiParental.groups[group].id)
                groupOption.innerText = unifiParental.groups[group].name
                span.className = "close"
                span.appendChild(document.createTextNode("\u00D7"))
                span.onclick = unifiParental.handleDeleteGroup
                groupOption.appendChild(span)
                groupOption.onclick = unifiParental.handleGroupClick              
                unifiParental.groupSelect.appendChild(groupOption)
            }
        })

        ajaxGet('/api/unifi-clients', (res) => {
            unifiParental.clients = JSON.parse(res.response)
            unifiParental.clients.sort((a, b) => {
                let name = (client) => { return typeof (client.name) == 'undefined' ? typeof (client.hostname) == 'undefined' ? client.mac : client.hostname : client.name }
                return name(a) < name(b) ? -1 : name(a) > name(b) ? 1 : 0
            })
            unifiParental.clients.forEach((client) => {
                let clientOption = document.createElement('option');
                clientOption.setAttribute('value', client.mac);
                clientOption.innerText = typeof (client.name) == 'undefined' ? typeof (client.hostname) == 'undefined' ? client.mac : client.hostname : client.name
                unifiParental.clientSelect.appendChild(clientOption);
            })
            // })
        })
    }
};
