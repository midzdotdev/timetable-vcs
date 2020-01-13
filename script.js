/*
  ** Created with <3 by James Middleton (hello@jamesmiddleton.me)
  ** ------------------------------
  ** This script allows Loughborough University students to easily import all lectures as events into a calendar app.
  **
  ** For instructions and PRs, please visit the GitHub repository (https://github.com/james2mid/timetable-vcs).
*/

// -- CONSTANTS

/** The number of milliseconds in one half-hour. */
const HALF_HOUR = 30 * 60 * 1000
/** The number of milliseconds in one hour. */
const HOUR = HALF_HOUR * 2
/** The number of milliseconds in one day. */
const DAY = HOUR * 24

/** Zero-based days of week array. */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// -- UTILITY FUNCTIONS

/** Flattens an array by one level. Included for older browser compatibility (and Edge ;) ). */
function flat (arr) {
  return [].concat.apply([], arr)
}

/** Pads a digit with zeroes to return a two-digit string. */
function padZeroes (s) {
  return String(s).length === 1 ? `0${s}` : s
}

/** Converts milliseconds to the VCS date format. */
function msToVeventDate (ms) {
  const date = new Date(ms)
  return `${date.getFullYear()}${padZeroes(date.getUTCMonth() + 1)}${padZeroes(date.getUTCDate())}T${padZeroes(date.getUTCHours())}${padZeroes(date.getUTCMinutes())}${padZeroes(date.getUTCSeconds())}Z`
}

// -- FUNCTIONS USED IN MAIN

/** Gets the day of week (zero-based) of the given row. */
function getRowDay (row) {
  let dayText = null

  // sessions whose durations overlap, are placed on adjacent rows
  // these rows do not contain data about the weekday
  // so retrace rows until the current weekday is determined

  while (!dayText && $(row).prev()[0] !== row) {
    dayText = $(row).find('.weekday').text()
    row = $(row).prev()
  }

  return DAYS.indexOf(dayText)
}

(function main () {
  // -- Establish that the correct data is included in the table – prompt to change if not.
  const semester =
    $('#P2_MY_PERIOD').val() === 'sem1' ? 1 :
    $('#P2_MY_PERIOD').val() === 'sem2' ? 2 :
    null
  
  if (!semester) {
    alert('Ensure that the "Period" dropdown box is set as "Semester 1" or "Semester 2"')
    return
  }

  // -- Parse the table HTML to get the session data – each containing one or multiple events.

  const rows = $('.tt_info_row').get()

  const sessions = rows.reduce((sessions, row) => {
    const day = getRowDay(row)

    const cells = $(row).children('td').not('.weekday_col').get()
    const rowSessions = cells.reduce((acc, cell) => {
      if (cell.classList.contains('new_row_tt_info_cell') || cell.classList.contains('tt_info_cell')) {
        // session
        acc.sessions.push({
          moduleId: $(cell).find('.tt_module_id_row').text(),
          moduleName: $(cell).find('.tt_module_name_row').text(),
          type: $(cell).find('.tt_modtype_row').text(),
          lecturerName: $(cell).find('.tt_lect_row').text(),
          room: $(cell).find('.tt_room_row').first().text().replace('...', ''),
          buildingName: $($(cell).find('.tt_room_row')[1]).text().replace(/\.\.\.|\(|\)/g, ''),
          day,
          timeOffset: (() => {
            const prevSession = acc.sessions[acc.sessions.length - 1]
            return (prevSession ? (prevSession.timeOffset + prevSession.duration) : 0) + acc.gap
          })(),
          duration: $(cell).attr('colspan') * HALF_HOUR,
          weeks: flat(/Sem\s+\d:\s+(.*)$/.exec($(cell).find('.tt_weeks_row').text())[1].split(',').map(x => {
            const r = /(\d{1,2})\s+-\s+(\d{1,2})/.exec(x)
            return r
              // a range, e.g '9 - 11' meaning weeks 9, 10 and 11
              ? Array.from(Array(r[2] - r[1])).map((_, i) => +r[1] + i) // expand range
              // not a range, e.g. '6' meaning only week 6
              : [ +x ]
          }))
        })
        acc.gap = 0
      } else {
        // gap
        acc.gap += HALF_HOUR // each gap is half an hour
      }

      return acc
    }, { sessions: [], gap: 0 }).sessions
    sessions.push(...rowSessions)
    return sessions
  }, [])

  // -- Remove the potentially trashy parts of the sessions.

  sessions.forEach(session => {
    Object.keys(session).forEach(key => {
      if (session[key] && typeof session[key] === 'string') {
        session[key] = session[key].trim().replace(/\s+/g, ' ')
      }
    })
  })

  // -- Convert sessions into individual events.

  /** The beginning of the each week as a `Date` in the current semester. Array index equal to week number. */
  const weekStartDates = [null, ...$('#P2_MY_PERIOD > option')
    .get()
    .map(x => x.innerText)
    .filter(x => x.includes(`Sem ${semester} - Wk`))
    .map(x => /^Sem \d - Wk \d{1,2} \(starting (\d{1,2}-[A-Z]{3}-\d{4})\)$/.exec(x))
    .map(x => new Date(x[1]).getTime())
  ]

  /** The start of the days as a `Date` as displayed in the timetable (generally 9AM). */
  const timetableStart = +$('.first_time_slot_col').first().text().split(':')[0] * HOUR

  /** Every event for the current semester as objects whose keys match the VCS specification. */
  const events = sessions.reduce((events, session) => {
    events.push(...session.weeks.map(weekNumber => {
      const startTime = weekStartDates[weekNumber] + (DAY * session.day) + timetableStart + session.timeOffset

      return {
        UID: `${startTime}-${session.moduleId}`,
        DTSTART: msToVeventDate(startTime),
        DTEND: msToVeventDate(startTime + session.duration),
        SUMMARY: session.type ? `${session.moduleName} (${session.type})` : session.moduleName,
        LOCATION: session.buildingName ? `${session.room} (${session.buildingName})` : session.room,
        COMMENT: `${session.type} for ${session.moduleName} (${session.moduleId}) with ${session.lecturerName} in room ${session.room} of ${session.buildingName}`
      }
    }))

    return events
  }, [])

  // -- Make a long string containing the events following the VCS specification.
  const contents = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//James Middleton//NONSGML timetable-vcs V6//EN',
    ...flat(events.map(data => ([
      'BEGIN:VEVENT',
      'DTSTAMP:' + msToVeventDate(Date.now()),
      ...Object.entries(data).map(([key, value]) => `${key}:${value}`),
      'END:VEVENT'
    ]))),
    'END:VCALENDAR',
  ].join('\r\n')

  // -- Download the string as a virtual file.
  const blob = new Blob([ contents ], {
    type: 'text/calendar'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.setAttribute('download', 'lectures.vcs')
  a.setAttribute('href', url)
  document.body.appendChild(a)

  // short delay for the DOM to update
  setTimeout(() => {
    a.click()

    // uses setTimeout so that Edge can download the file
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 1000)
  }, 100)
})()
