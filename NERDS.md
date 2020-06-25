# NERDS README for timetable-vcs
I guess you like this little script and want to learn a bit more about how it works.

_If you've got your own GitHub account, I'd appreciate it if you gave me a [star](https://github.com/james2mid/timetable-vcs) and a [follow](https://github.com/james2mid)._

## Recommended Reading
  * [vCalendar Specification](https://icalendar.org/RFC-Specifications/iCalendar-RFC-5545/)

## The Algorithm
The following is a summary describing the steps taken to make this thing work. _Click on any to forward to the relevant line._

1. [Establish that the correct data is included in the table – prompt to change if not](https://github.com/james2mid/timetable-vcs/blob/master/script.js#L58)
2. [Parse the table HTML to get the session data – each containing one or multiple events.](https://github.com/james2mid/timetable-vcs/blob/master/script.js#L69)
3. [Remove the potentially trashy parts of the sessions.](https://github.com/james2mid/timetable-vcs/blob/master/script.js#L114)
4. [Convert sessions into individual events.](https://github.com/james2mid/timetable-vcs/blob/master/script.js#L124)
5. [Make a long string containing the events following the VCS specification.](https://github.com/james2mid/timetable-vcs/blob/master/script.js#L156)
6. [Download the string as a virtual file.](https://github.com/james2mid/timetable-vcs/blob/master/script.js#L170)

## Further Developments
The following are ideas to further the development of this mini-project:

* Online wrapper
  * Request, parses and downloads the VCS automatically
  * Prevents the user having to execute the script manually in DevTools
  * Would require username and password for authentication
* Online service
  * User adds [subscription](https://en.wikipedia.org/wiki/CalDAV) to their calendar
  * Periodically syncronises every user's calendar subscription
  * Ensures that the timetable events are always up-to-date

_Note that lboro may soon change their timetable, which would make this code fail. Just keep this in mind when making improvements._

## Contributions
For improvements to the code, please submit a PR to this repository.
