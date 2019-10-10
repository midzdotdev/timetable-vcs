/*
  ** Created with <3 by James Middleton (hello@jamesmiddleton.me)
  ** ------------------------------
  ** This script allows Loughborough University students to easily import all lectures as events into a calendar.
  **
  ** HOW TO USE:
  ** 1. Open your timetable and set the `Period` dropdown box as "Semester #".
  ** 2. Open the browsers console, paste this entire script and hit enter.
  ** 3. Your browser should automatically download the generated `lectures.vcs` file.
  ** 4. Open this file with your calendar program (such as Outlook or Calendar.app).
  ** 5. Seek help from your nearest Computer Science student in case of failure.
*/

const HALF_HOUR = 30 * 60 * 1000
const HOUR = HALF_HOUR * 2
const DAY = HOUR * 24

/** Zero-based days of week array. */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Flattens an array by one level. Included for older browser compatibility (and Edge ;) ). */
function flat (arr) {
  return [].concat.apply([], arr)
}

/** Gets the day of week (zero-based) of the given row. */
function getRowDay (row) {
  let dayText = null

  // overlapping sessions are place on adjacent rows which do not contain the weekday
  // keep going to the previous row until the weekday is found
  while (!dayText && $(row).prev()[0] !== row) {
    dayText = $(row).find('.weekday').text()
    row = $(row).prev()
  }

  return DAYS.indexOf(dayText)
}

(function () {
  // -- ensure the period dropdown has the correct item selected
  if ($('#P2_MY_PERIOD').val() !== 'sem1' && $('#P2_MY_PERIOD').val() !== 'sem2') {
    alert('Ensure that the "Period" dropdown box is set as "Semester 1" or "Semester 2"')
    return
  }

  // -- extract data from each session
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

  // -- remove extra whitespace from session string fields
  sessions.forEach(session => {
    Object.keys(session).forEach(key => {
      if (session[key] && typeof session[key] === 'string') {
        session[key] = session[key].trim().replace(/\s+/g, ' ')
      }
    })
  })

  // -- convert sessions into individual events
  const weekStartDates = [null, ...$('#P2_MY_PERIOD > option')
    .get()
    .map(x => x.innerText)
    .filter(x => x.includes('Sem 1 - Wk'))
    .map(x => /^Sem \d - Wk \d{1,2} \(starting (\d{1,2}-[A-Z]{3}-\d{4})\)$/.exec(x))
    .map(x => new Date(x[1]).getTime())
  ]

  const timetableStart = +$('.first_time_slot_col').first().text().split(':')[0] * HOUR

  function padZeroes (s) {
    return String(s).length === 1 ? `0${s}` : s
  }

  function msToVeventDate (ms) {
    const date = new Date(ms)
    return `${date.getFullYear()}${padZeroes(date.getUTCMonth() + 1)}${padZeroes(date.getUTCDate())}T${padZeroes(date.getUTCHours())}${padZeroes(date.getUTCMinutes())}${padZeroes(date.getUTCSeconds())}Z`
  }

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

  // -- generate the contents of the VCS file
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
  }, 100)

  // uses setTimeout so that Edge can download the file
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 1000)
})()
