<script async defer src="https://buttons.github.io/buttons.js"></script>

# NERDS README for timetable-vcs
I guess you like this little script and want to learn a bit more about how it works.

_If you've got your own GitHub account, I'd appreciate it if you gave me a [star](https://github.com/james2mid/timetable-vcs) and a [follow](https://github.com/james2mid)._

## Recommended Reading
  * [vCalendar Specification](https://icalendar.org/RFC-Specifications/iCalendar-RFC-5545/)

## The Algorithm
The following is a summary describing the steps taken to make this thing work.

* Establish that the correct data is included in the table – prompt to change if not.
* Parse the table HTML to get the session data – each containing one or multiple events.
* Remove the potentially trashy parts of the sessions.
* Convert sessions into individual events.
* Make a long string containing the events following the VCS specification.
* Download the string as a virtual file.

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