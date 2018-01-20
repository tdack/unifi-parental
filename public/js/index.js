document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        // document ready
        var gTimer;

        /**
         * Extract timer data from server into on/off periods
         * @param  {Object} timerdata - data returned from the server
         * @param  {number} timerdata[].action - 1=enable, 0=disable
         * @param  {number} timerdata[].day -  day this action is for Mon=0...Sun=6
         * @param  {string} timerdata[].time - 24hr time that timer is to occur
         */
        function extractTimerData(res) {
            var timers = Object.values(JSON.parse(res)).sort((a, b) => {
                return a.day < b.day ? -1 : a.day > b.day ? 1 : a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action
            })
            var periods = []
            for (var i = 0; i < timers.length; i = i + 2) {
                var day = timers[i].day
                if (typeof periods[day] === 'undefined') {
                    periods[day] = []
                }
                periods[day].push({ on: timers[i].time, off: timers[i + 1].time })
            }
            for (var i = 0; i < 7; i++) {
                if (typeof periods[i] === 'undefined') {
                    periods[i] = []
                }
            }
            return periods
        }
        /*
        * Get items that are selected in a list
        * @param  {Object} select - html <select> element containing <option> items
        */
        function getSelectValues(select) {
            var result = [];
            var options = select && select.options;
            var opt;

            for (var i = 0, iLen = options.length; i < iLen; i++) {
                opt = options[i];

                if (opt.selected) {
                    result.push(opt.value || opt.text);
                }
            }
            return result;
        }

        var form = document.getElementById('uiMainform')
        var handleformSubmit = (event) => {
            event.preventDefault()
            var data = gTimer.save()
            ajaxPostJSON('/api/timer', data, (xhr) => {
                if (xhr.status == 200) {
                    gTimer = createTimer('uiTimer', extractTimerData(xhr.response))
                }
                var blockedClients = getSelectValues(document.forms[0].elements.namedItem('clients'))
                ajaxPostJSON('/api/blocked-clients', blockedClients)
            })
        }
        form.addEventListener('submit', handleformSubmit)

        var uiTimer = getHtmlTimer('uiTimer', { active: 'Internet use allowed', inactive: 'Internet use blocked' })
        document.getElementById('uiTimerArea').append(uiTimer)

        ajaxGet('/api/timer', (res) => {
            gTimer = createTimer('uiTimer', extractTimerData(res.response))
        })

        ajaxGet('/api/unifi-clients', (res) => {
            var clients = JSON.parse(res.response)
            clients.sort((a, b) => {
                var name = (el) => { return typeof (el.name) == 'undefined' ? typeof (el.hostname) == 'undefined' ? el.mac : el.hostname : el.name }
                return name(a) < name(b) ? -1 : name(a) > name(b) ? 1 : 0
            })
            var clientSelect = document.getElementById('clients')
            ajaxGet('/api/blocked-clients', (res) => {
                var blockedClientsSet = new Set(JSON.parse(res.response))
                clients.forEach((client) => {
                    var clientOption = document.createElement('option');
                    clientOption.setAttribute('value', client.mac);
                    clientOption.innerText = typeof (client.name) == 'undefined' ? typeof (client.hostname) == 'undefined' ? client.mac : client.hostname : client.name
                    if (blockedClientsSet.has(client.mac)) {
                        clientOption.selected = true
                    }
                    clientSelect.appendChild(clientOption);
                })
            })
        })
    }
};
