/*
*/
var g_daystr = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    g_dayIDs = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    jxl,
    html2;
/*
*/
function Moment(day, hour, minute) {
    "use strict";
    this.d = day;
    this.h = hour;
    this.m = minute;
    this.isEqualTo = function (other) {
        return (this.d === other.d && this.h === other.h && this.m === other.m);
    };
    this.isSmallerThan = function (other) {
        return (this.d < other.d || (this.d === other.d && (this.h < other.h || (this.h === other.h && this.m < other.m))));
    };
    this.isSmallerThanNoDay = function (other) {
        return (this.h < other.h || (this.h === other.h && this.m < other.m));
    };
    this.isSmallerOrEqualTo = function (other) {
        return (this.d < other.d || (this.d === other.d && (this.h < other.h || (this.h === other.h && this.m <= other.m))));
    };
    this.isGreaterThan = function (other) {
        return (this.d > other.d || (this.d === other.d && (this.h > other.h || (this.h === other.h && this.m > other.m))));
    };
    this.isGreaterThanNoDay = function (other) {
        return (this.h > other.h || (this.h === other.h && this.m > other.m));
    };
    this.isGreaterOrEqualTo = function (other) {
        return (this.d > other.d || (this.d === other.d && (this.h > other.h || (this.h === other.h && this.m >= other.m))));
    };
    this.toString = function () {
        return g_daystr[this.d] + " " + (this.h < 10 ? "0" : "") + this.h + ":" + (this.m < 10 ? "0" : "") + this.m;
    };
    this.toShortString = function () {
        return (this.h < 10 ? "0" : "") + this.h + ":" + (this.m < 10 ? "0" : "") + this.m;
    };
    this.toTimeStr = function () {
        return (this.h < 10 ? "0" : "") + this.h + (this.m < 10 ? "0" : "") + this.m;
    };
    this.toMinutes = function () {
        return this.h * 60 + this.m;
    };
    this.nextQuarter = function () {
        var ret = new Moment(this.d, this.h, this.m + 15);
        if (ret.m > 45) {
            ret.h += 1;
            ret.m = 0;
        }
        if (ret.h >= 24) {
            ret.h = 24;
            ret.m = 0;
        }
        return ret;
    };
    this.prevQuarter = function () {
        var ret = new Moment(this.d, this.h, this.m - 15);
        if (ret.m < 0) {
            ret.h -= 1;
            ret.m = 45;
        }
        if (ret.h < 0) {
            ret.h = 0;
            ret.m = 0;
        }
        return ret;
    };
    this.copy = function () {
        return new Moment(this.d, this.h, this.m);
    };
    this.switchWith = function (other) {
        var tmp = this.d;
        this.d = other.d;
        other.d = tmp;
        tmp = this.h;
        this.h = other.h;
        other.h = tmp;
        tmp = this.m;
        this.m = other.m;
        other.m = tmp;
    };
}
/*
*/
function Period(pStart, pEnd) {
    "use strict";
    this.start = pStart;
    if (!pEnd) {
        this.end = pStart.nextQuarter();
    } else {
        this.end = pEnd;
    }
    this.normalizedCopy = function () {
        if (this.start.isGreaterThan(this.end)) {
            return new Period(this.end, this.start);
        }
        if (this.start.isEqualTo(this.end)) {
            return new Period(this.start, this.start.nextQuarter());
        }
        return new Period(this.start, this.end);
    };
    this.draw = function (dayDiv, leftReserved) {
        var span = document.createElement('span'),
            left = 5 * (this.start.h * 4 + this.start.m / 15) - leftReserved,
            width = 5 * (((this.end.h - this.start.h) * 4) + ((this.end.m - this.start.m) / 15));
        span.style.marginLeft = left + "px";
        span.style.width = width + "px";
        if (this.start.m !== 0 || (this.start.h % 2) === 1) {
            span.className = "b" + String(this.start.h % 2) + String(this.start.m);
        }
        dayDiv.appendChild(span);
        return leftReserved + left + width;
    };
    this.toTimeStr = function () {
        return this.start.toTimeStr() + this.end.toTimeStr();
    };
}
/*
*/
function Timer(pIdContainer, pData, pNamePrefix, pShowOnly) {
    "use strict";
    var i, that = this;
    this.idContainer = pIdContainer;
    this.divContainer = jxl.get(pIdContainer);
    this.msgBox = jxl.get(pIdContainer + "MsgBox");
    this.divWeek = jxl.get(pIdContainer + "Week");
    this.divDay = [];
    this.selecting = false;
    this.curpos = null;
    this.dragPeriod = null;
    this.dragmode = null;
    this.wrapped = false;
    this.blockMode = "block";
    this.data = pData;
    this.disabled = false;
    this.callback = null;
    this.namePrefix = pNamePrefix ? (pNamePrefix + "_") : "";
    /**
    Es wird ein Div mit der Klasse touchDiv erzeugt. Dies wird vor die eigentlichen elemente Gelegt, um touch zu realisieren
    Das wird gemacht, da beim demarkieren bzw. löschen einer gesetzten Zeit genau das Element gelöscht wird an den das TouchEvent
    gebunden ist. Da dies dazu führt, dass keine weitern TouchEvents ausgelöst werden, wird das touchDiv vor alles andere gelegt
    und somit sichergestellt, dass das Element auf das ich touche auch immer da ist.

    A div is created with the class touchDiv. This is laid out before the actual elements to realize touch
    This is done because when you deselect or delete a set time, exactly the item is deleted to the TouchEvent
    is bound. Since this will cause no further TouchEvents to be triggered, the touchDiv will be ahead of anything else
    and thus ensuring that the element I touche is always there.
    */
    if (document.getElementsByClassName('touchDiv').length == 0) {
        this.touchDiv = document.createElement("div");
        this.touchDiv.setAttribute('class', 'touchDiv');
        this.divContainer.appendChild(this.touchDiv);    
    } else {
        this.touchDiv = document.getElementsByClassName('touchDiv')[0]
    }
    /**
    Zur anzeige der Zeit und der Tage die ich gerade bearbeite werden weiter Elemente geschaffen.

    To display the time and the days I am working on elements are created.
    */
    if (document.getElementsByClassName('editTime').length == 0) {
        this.editTimeDiv = document.createElement("div");
        this.editTimeDiv.setAttribute('class', 'editTime');
        this.editDaysSpan = document.createElement("span");
        this.editTimeDiv.appendChild(this.editDaysSpan);
        this.editTimeSpan = document.createElement("span");
        this.editTimeDiv.appendChild(this.editTimeSpan);
        this.divContainer.appendChild(this.editTimeDiv);    
    } else {
        this.editTimeDiv = document.getElementsByClassName('editTime')[0]
        this.editDaysSpan = this.editTimeDiv.childNodes[0]
        this.editTimeSpan = this.editTimeDiv.childNodes[1]
    }
    /**
    Hier kann man eine Callback-Funktion anmelden, die immer bei Mouseup
    bzw. ESC, also wenn der User eine Aktion beendet, aufgerufen wird.
    Nützlich z.B. wenn irgendwas ausgeblendet werden soll, sobald die
    momentanen Daten "immer gesperrt" sagen ....

    Here you can register a callback function, which is always on mouseup
    or ESC, ie when the user finishes an action, is called.
    Useful e.g. if something should be hidden, as soon as the
    current data "always locked" say ....
    **/
    this.setOnChangeCallback = function (cbFunc) {
        this.callback = cbFunc;
    };
    /******* Handler für Ereignisse des Dokumentes *****************************/
    /**
    * wird als dokumentweiter onkeypress Handler installiert.
    *
    * ESC während des Ziehens bricht die Auswahl ab.
    */
    /******* Document handlers *******************************************************
    /**
    * is installed as a document - wide onkeypress handler.
    *
    * ESC while dragging stops the selection.
    */
    this.handleKeyPressed = function (evt) {
        var code;
        evt = evt || window.event;
        code = evt.which || evt.keyCode;
        switch (code) {
            case 27:
                if (this.selecting) {
                    this.drawData();
                    document.onmouseup = null;
                    document.onmousemove = null;
                    document.onkeypress = null;
                    this.selecting = false;
                    if (this.callback) {
                        this.callback();
                    }
                    this.unvisualiseMoment(evt);
                }
                break;
        }
    };
    /**
    * Schaut ob irgendeine Zeit eingestellt wurde. Wenn leer wird ein Hinweis eingeblendet.

    * See if any time has been set. If empty, a hint appears.
    */
    function emptyChart() {
        var i, len;
        for (i = 0, len = that.data.length; i < len; i += 1) {
            if (that.data[i] && 0 < that.data[i].length) {
                jxl.addClass(that.msgBox, "hide");
                return;
            }
        }
        jxl.removeClass(that.msgBox, "hide");
        return;
    }
    /**
    * wird als dokumentweiter onmouseup Handler installiert.
    
    * is installed as a document-wide onmouseup handler.
    */
    this.handleMouseUp = function (evt) {
        var pos;
        evt = evt || window.event;
        if (evt.stopPropagation) {
            evt.stopPropagation();
        }
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        if (this.selecting) {
            if (!evt.targetTouches) {
                pos = this.toTime(evt);
                this.dragPeriod.end = pos;
            } else {
                //bei Toch getriggerten Mouseup muss vor dem Merge selecting auf false gesetzt werden um nicht eine Zeiteinheit zu viel
                //zu markieren oder demarkieren.

                // mouse-click triggered on Toch must be set to false before merge selecting not to take a unit of time too much
                // mark or unmark.
                this.selecting = false;
            }
            this.mergeDrag("drawsave", this.dragMode, this.blockMode);
            this.unvisualiseMoment(evt);
            document.onmouseup = null;
            document.onmousemove = null;
            document.onkeypress = null;
            this.selecting = false;
            emptyChart();
            if (this.callback) {
                this.callback();
            }
        }
    };
    /**
    * wird als dokumentweiter onmousemove Handler installiert.

    * is installed as a document-wide onmousemove handler.
    */
    this.handleMouseMove = function (evt) {
        var pos;
        evt = evt || window.event;
        if (evt.stopPropagation) {
            evt.stopPropagation();
        }
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        if (this.selecting) {
            pos = this.toTime(evt);
            if (!pos.isEqualTo(this.curpos)) {
                this.curpos = pos;
                this.dragPeriod.end = this.curpos;
                this.mergeDrag("draw", this.dragMode, this.blockMode);
                this.visualiseMoment(evt);
            }
        }
    };
    /**
    * wird als onmousedown Handler in den Tages-<div>s installiert.

    * will be installed as an onmousedown handler in the daytime <div> s.
    */
    this.handleMouseDown = function (evt) {
        if (!pShowOnly) {
            evt = evt || window.event;
            if (evt.stopPropagation) {
                evt.stopPropagation();
            }
            if (evt.preventDefault) {
                evt.preventDefault();
            }
            if (evt.button !== 2 && !this.disabled) {
                jxl.addClass(this.msgBox, "hide");
                this.curpos = this.toTime(evt);
                this.dragPeriod = new Period(this.curpos);
                this.dragMode = evt.shiftKey ? "add" : this.getDragMode(this.curpos);
                this.blockMode = evt.ctrlKey ? "fill" : "block";
                this.mergeDrag("draw", this.dragMode, this.blockMode);
                this.visualiseMoment(evt);
                this.selecting = true;
                document.onmouseup = function (evt) {
                    return that.handleMouseUp(evt);
                };
                document.onmousemove = function (evt) {
                    return that.handleMouseMove(evt);
                };
                document.onkeypress = function (evt) {
                    return that.handleKeyPressed(evt);
                };
            }
        }
    };
    /******* Control Hilfsfunktionen *******************************************/
    /******* Control auxiliary functions ***************************************/
    this.unvisualiseMoment = function () {
        if (jxl.hasClass(this.editTimeDiv, "show")) {
            jxl.removeClass(this.editTimeDiv, "show");
        }
    };
    /**
    *
    */
    this.visualiseMoment = function () {
        var startTime, endTime;
        if (this.dragPeriod.start.d === this.dragPeriod.end.d) {
            this.editDaysSpan.innerHTML = g_daystr[this.dragPeriod.start.d];
        } else if (this.dragPeriod.start.d > this.dragPeriod.end.d) {
            this.editDaysSpan.innerHTML = jxl.sprintf("%1%DayFrom% to %2%DayTo%", g_daystr[this.dragPeriod.end.d], g_daystr[this.dragPeriod.start.d]);
        } else {
            this.editDaysSpan.innerHTML = jxl.sprintf("%1%DayFrom% to %2%DayTo%", g_daystr[this.dragPeriod.start.d], g_daystr[this.dragPeriod.end.d]);
        }
        if (this.dragPeriod.start.isEqualTo(this.dragPeriod.end)) {
            this.dragPeriod.end = this.dragPeriod.end.nextQuarter();
        }
        startTime = (this.dragPeriod.start.h < 10 ? "0" : "") + this.dragPeriod.start.h + ":" + (this.dragPeriod.start.m < 10 ? "0" : "") + this.dragPeriod.start.m;
        endTime = (this.dragPeriod.end.h < 10 ? "0" : "") + this.dragPeriod.end.h + ":" + (this.dragPeriod.end.m < 10 ? "0" : "") + this.dragPeriod.end.m;
        if (this.dragPeriod.start.h > this.dragPeriod.end.h || (this.dragPeriod.start.h === this.dragPeriod.end.h && this.dragPeriod.start.m > this.dragPeriod.end.m)) {
            startTime = (this.dragPeriod.end.h < 10 ? "0" : "") + this.dragPeriod.end.h + ":" + (this.dragPeriod.end.m < 10 ? "0" : "") + this.dragPeriod.end.m;
            endTime = (this.dragPeriod.start.h < 10 ? "0" : "") + this.dragPeriod.start.h + ":" + (this.dragPeriod.start.m < 10 ? "0" : "") + this.dragPeriod.start.m;
        }
        this.editTimeSpan.innerHTML = jxl.sprintf("%1%TimeFrom% to %2%TimeTo%", startTime, endTime);
        if (!jxl.hasClass(this.editTimeDiv, "show")) {
            jxl.addClass(this.editTimeDiv, "show");
        }
    };
    /**
    * berechnet aus einem (Maus-)Event den passenden Zeitpunkt

    * calculates the right time from a (mouse) event
    */
    this.toTime = function (evt) {
        var t = this.divWeek,
            x = 0,
            y = 0,
            nx,
            m,
            h,
            ny,
            d;
        evt = evt || window.event;
        if (evt.targetTouches && evt.targetTouches[0] && evt.targetTouches[0].clientX) {
            x = evt.targetTouches[0].clientX + (window.pageXOffset || document.documentElement.scrollLeft || 0);
            y = evt.targetTouches[0].clientY + (window.pageYOffset || document.documentElement.scrollTop || 0);
        } else {
            x = evt.clientX + (window.pageXOffset || document.documentElement.scrollLeft || 0);
            y = evt.clientY + (window.pageYOffset || document.documentElement.scrollTop || 0);
        }
        do {
            x -= t.offsetLeft + parseInt(t.style.borderLeftWidth || 0, 10);
            y -= t.offsetTop + parseInt(t.style.borderTopWidth || 0, 10);
            t = t.offsetParent;
        } while (t);
        nx = x > 0 ? x : 0;
        nx = Math.floor(nx / 5);
        m = 15 * (nx % 4);
        h = Math.floor(nx / 4);
        if (h >= 24) {
            h = 23;
            m = 45;
        }
        ny = y < 3 ? 0 : y;
        /**
        35 gleich 28px höhe und 7px Margin bottom

        35 equals 28px height and 7px margin bottom
        */
        ny = Math.floor((ny - 3) / 35);
        d = ny < 6 ? ny : 6;
        d = d < 0 ? 0 : d;
        return new Moment(d, h, m);
    };
    /**
    * ermittelt den Zustand des geklickten Bereiches und gibt die dazu inverse Operation zurück.

    * determines the state of the clicked area and returns the inverse operation.
    */
    this.getDragMode = function (pos) {
        var day, p, len, tmp;
        for (day = 0; day < 7; day += 1) {
            if (pos.d === day) {
                for (p = 0, len = (this.data[day] && this.data[day].length) || 0; p < len; p += 1) {
                    tmp = pos.isGreaterOrEqualTo(this.data[day][p].end);
                    if (pos.h >= 24 && tmp) {
                        return "remove";
                    }
                    if (!tmp) {
                        if (pos.isSmallerThan(this.data[day][p].start)) {
                            return "add";
                        }
                        return "remove";
                    }
                }
                return "add";
            }
        }
    };
    /**
    * leert ein Tages-<div>
    */
    function clearDay(dayDiv) {
        while (dayDiv.firstChild) {
            dayDiv.removeChild(dayDiv.firstChild);
        }
    }
    /**
    * malt die Bereiche eines Tages neu.

    * empties a day <div>
    */
    function drawDay(dayDiv, data) {
        var leftGap = 0, p, len;
        clearDay(dayDiv);
        for (p = 0, len = (data && data.length) || 0; p < len; p += 1) {
            leftGap = data[p].draw(dayDiv, leftGap);
        }
    }
    /**
    * arbeitet die aktuelle Auswahl in den Datenbestand ein.

    * The current selection works in the database.
    */
    this.mergeDrag = function (mergeMode, dragMode, blockMode) {
        var dragp, wrapped, day, newp, daydata, newpcomplete, daydata2, startindex, endindex, i, len;
        /**
        Zuerst wird die dragPeriod angepasst je nach dem ob wir nach links rechts oder auf dem Punkt sind.
        Aber nur wenn this.selecting == true ist.

        First, the dragPeriod is adjusted according to whether we are to the left or right on the point.
        But only if this.selecting == true.
        */
        if (this.selecting) {
            /**Wenn man schon links draged muss man den start für den Vergleich wieder zurücksetzen.
            Nötig da man immer vom original Zustand ausgeht. Nicht nötig für dragPeriod.end da dieser ja immer
            neu gesetzt und somit automatisch resettet wird. */
            /** If you already draged left you have to reset the start for the comparison.
            Necessary since you always start from the original state. Not necessary for dragPeriod.end since this always
            reset and thus automatically reset. */
            if (this.dragPeriod.direction && this.dragPeriod.direction === "left") {
                this.dragPeriod.start = this.dragPeriod.start.prevQuarter();
            }
            /** Bei den Vergeleichen wird der Tag missachtet. Das ist wichtig da der Vergleich sonst für mehrere Tage nicht funktionieren würde.*/
            /** In the comparison, the day is ignored. This is important because otherwise the comparison would not work for several days. */
            if (this.dragPeriod.start.isGreaterThanNoDay(this.dragPeriod.end)) {
                /**
                Wir draggen nach links
                */
                this.dragPeriod.start = this.dragPeriod.start.nextQuarter();
                this.dragPeriod.direction = "left";
            } else if (this.dragPeriod.start.isSmallerThanNoDay(this.dragPeriod.end)) {
                /**
                Wir draggen nach rechts

                We drag to the right
                */
                this.dragPeriod.end = this.dragPeriod.end.nextQuarter();
                this.dragPeriod.direction = "right";
            } else {
                if (this.dragPeriod.start.d !== this.dragPeriod.end.d) {
                    this.dragPeriod.end = this.dragPeriod.end.nextQuarter();
                }
                this.dragPeriod.direction = null;
            }
        }
        dragp = this.dragPeriod.normalizedCopy();
        if (!blockMode) {
            blockMode = "fill";
        }
        wrapped = (dragp.start.d !== dragp.end.d);
        for (day = 0; day < 7; day += 1) {
            if (day >= dragp.start.d && day <= dragp.end.d) {
                newp = new Period(dragp.start.copy(), dragp.end.copy());
                newp.start.d = day;
                newp.end.d = day;
                if (blockMode === "block") {
                    if (newp.end.isSmallerThan(newp.start)) {
                        newp.end.switchWith(newp.start);
                    }
                } else {
                    if (day !== dragp.start.d) {
                        newp.start = new Moment(day, 0, 0);
                    }
                    if (day !== dragp.end.d) {
                        newp.end = new Moment(day, 24, 0);
                    }
                }
                daydata = [];
                if (dragMode === "add") {
                    newpcomplete = false;
                    for (i = 0, len = (this.data[day] && this.data[day].length) || 0; i < len; i += 1) {
                        if (this.data[day][i].start.isSmallerThan(newp.start) || newpcomplete) {
                            daydata.push(this.data[day][i]);
                        } else {
                            daydata.push(new Period(newp.start, newp.end));
                            newpcomplete = true;
                            daydata.push(this.data[day][i]);
                        }
                    }
                    if (!newpcomplete) {
                        daydata.push(new Period(newp.start, newp.end));
                    }
                    if (daydata.length > 1) {
                        daydata2 = [];
                        startindex = 0;
                        endindex = 0;
                        for (i = 1, len = daydata.length; i < len; i += 1) {
                            if (daydata[i].start.isGreaterThan(daydata[startindex].end) && daydata[i].start.isGreaterThan(daydata[endindex].end)) {
                                daydata2.push(new Period(daydata[startindex].start, daydata[endindex].end));
                                startindex = i;
                            }
                            if (daydata[i].end.isGreaterThan(daydata[endindex].end)) {
                                endindex = i;
                            }
                        }
                        daydata2.push(new Period(daydata[startindex].start, daydata[endindex].end));
                        daydata = daydata2;
                    }
                } else if (dragMode === "remove") {
                    for (i = 0, len = (this.data[day] && this.data[day].length) || 0; i < len; i += 1) {
                        if (this.data[day][i].end.isSmallerThan(newp.start) || this.data[day][i].start.isGreaterThan(newp.end)) {
                            daydata.push(this.data[day][i]);
                        } else if (newp.start.isSmallerOrEqualTo(this.data[day][i].start)) {
                            if (newp.end.isSmallerThan(this.data[day][i].end)) {
                                daydata.push(new Period(newp.end, this.data[day][i].end));
                            }
                        } else {
                            daydata.push(new Period(this.data[day][i].start, newp.start));
                            if (newp.end.isSmallerThan(this.data[day][i].end)) {
                                daydata.push(new Period(newp.end, this.data[day][i].end));
                            }
                        }
                    }
                }
                if (mergeMode.indexOf("draw") !== -1) {
                    drawDay(this.divDay[day], daydata);
                }
                if (mergeMode.indexOf("save") !== -1) {
                    this.data[day] = daydata;
                }
            } else if (this.wrapped && mergeMode.indexOf("draw") !== -1) {
                drawDay(this.divDay[day], this.data[day]);
            }
        }
        this.wrapped = wrapped;
    };
    /**
    * malt das gesamte Control neu

    * repaint the entire control
    */
    this.drawData = function () {
        var day;
        for (day = 0; day < 7; day += 1) {
            drawDay(this.divDay[day], this.data[day]);
        }
    };
    /**
    * speichert die Zeiten im angegebenen Formular

    * saves the times in the specified form
    */
    this.save = function (formId) {
        var name, value, complete, nextAction, day, i, j, len, actions, item, selectors;
        complete = false;
        /* Schaltpunkte sortieren*/
        /* Sort switching points */
        nextAction = [];
        for (day = 0; day < 7; day += 1) {
            for (i = 0, len = (this.data[day] && this.data[day].length) || 0; i < len; i += 1) {
                nextAction.push({
                    day: day,
                    action: 1,
                    time: this.data[day][i].start.toTimeStr()
                });
                nextAction.push({
                    day: day,
                    action: 0,
                    time: this.data[day][i].end.toTimeStr()
                });
            }
        }
        nextAction.sort( (a,b) => { return a.time < b.time ? -1 : a.time > b.time ? 1 : a.action - b.action });
        return nextAction     
    };
    /**
    * Initialisierung
    */
    this.touchStartEv = function (evt) {
        evt = evt || window.event;
        if (evt.stopPropagation) {
            evt.stopPropagation();
        }
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        jxl.addEventHandler(evt.target, "touchmove", function (evt) {
            if (!pShowOnly) {
                evt = evt || window.event;
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                if (evt.preventDefault) {
                    evt.preventDefault();
                }
                that.handleMouseMove(evt);
            }
        });
        jxl.addEventHandler(evt.target, "touchend", function (evt) {
            if (!pShowOnly) {
                evt = evt || window.event;
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                if (evt.preventDefault) {
                    evt.preventDefault();
                }
                emptyChart();
                that.handleMouseUp(evt);
            }
        });
        jxl.addEventHandler(evt.target, "touchcancel", function (evt) {
            if (!pShowOnly) {
                evt = evt || window.event;
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                if (evt.preventDefault) {
                    evt.preventDefault();
                }
                emptyChart();
                that.handleMouseUp(evt);
            }
        });
        this.handleMouseDown(evt);
    };
    jxl.addEventHandler(this.touchDiv, "touchstart", function (evt) {
        jxl.addClass(that.msgBox, "hide");
        that.touchStartEv(evt);
    });
    this.touchDiv.onmousedown = function (evt) {
        return that.handleMouseDown(evt);
    };
    this.touchDiv.onselectstart = function () {
        return false;
    };
    function createHandler(divDay) {
        divDay.onmousedown = function (evt) {
            return that.handleMouseDown(evt);
        };
        divDay.onselectstart = function () {
            return false;
        };
    }
    for (i = 0; i < 7; i += 1) {
        this.divDay[i] = jxl.get(this.idContainer + g_dayIDs[i]);
        /** für alte IE, welche das touchDIV nicht richtig erzeugen können, muss leider die alte Art der Handler mit angelegt werden. */
        if (this.divDay[i]) {
            createHandler(this.divDay[i]);
        }
    }
    emptyChart();
    this.drawData();
}
/*
*/
function createTimer(id, data, namePrefix) {
    "use strict";
    var periods, d, i, len, iLen, on, off;
    periods = [];
    for (d = 0, len = data.length; d < len; d += 1) {
        periods[d] = [];
        for (i = 0, iLen = data[d].length; i < iLen; i += 1) {
            on = data[d][i].on;
            off = data[d][i].off;
            if (!isNaN(off) && !isNaN(on)) {
                periods[d].push(new Period(
                    new Moment(d, parseInt(on.slice(0,2)), parseInt(on.slice(2,4))),
                    new Moment(d, parseInt(off.slice(0,2)), parseInt(off.slice(2,4)))
                ));
            }
        }
    }
    return new Timer(id, periods, namePrefix);
}
/*
*/
function getHtmlTimer(idName, legend) {
    "use strict";
    var timer_container;
    timer_container = html2.div(
        { className: "timer_container", id: idName },
        html2.div(
            { className: "upperHourscale" },
            html2.span({}, "0"),
            html2.span({}, "2"),
            html2.span({}, "4"),
            html2.span({}, "6"),
            html2.span({}, "8"),
            html2.span({}, "10"),
            html2.span({}, "12"),
            html2.span({}, "14"),
            html2.span({}, "16"),
            html2.span({}, "18"),
            html2.span({}, "20"),
            html2.span({}, "22"),
            html2.span({}, "24")
        ),
        html2.div(
            { className: "dayscale" },
            html2.div({}, "Mo"),
            html2.div({}, "Tu"),
            html2.div({}, "We"),
            html2.div({}, "Th"),
            html2.div({}, "Fr"),
            html2.div({ className: "weekend" }, "Sa"),
            html2.div({ className: "weekend" }, "Su")
        ),
        html2.div(
            { className: "week", id: idName + "Week", unselectable: "on" },
            html2.div({ className: "day", id: idName + "Monday" }),
            html2.div({ className: "day", id: idName + "Tuesday" }),
            html2.div({ className: "day", id: idName + "Wednesday" }),
            html2.div({ className: "day", id: idName + "Thursday" }),
            html2.div({ className: "day", id: idName + "Friday" }),
            html2.div({ className: "day", id: idName + "Saturday" }),
            html2.div({ className: "day", id: idName + "Sunday" })
        ),
        html2.div(
            { className: "hourscale" },
            html2.span({}, "0"),
            html2.span({}, "2"),
            html2.span({}, "4"),
            html2.span({}, "6"),
            html2.span({}, "8"),
            html2.span({}, "10"),
            html2.span({}, "12"),
            html2.span({}, "14"),
            html2.span({}, "16"),
            html2.span({}, "18"),
            html2.span({}, "20"),
            html2.span({}, "22"),
            html2.span({}, "24")
        ),
        html2.div(
            { className: "legend" },
            html2.div({ className: "legend_active" }, legend.active),
            html2.div({ className: "legend_inactive" }, legend.inactive)
        ),
        html2.div({ className: "msg_box hide", id: idName + "MsgBox" }, "Click and pull to release times for use.")
    );
    return timer_container;
}
