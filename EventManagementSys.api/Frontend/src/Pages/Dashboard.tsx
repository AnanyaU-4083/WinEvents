import { useEffect, useMemo, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import type { ChangeEvent } from 'react'
import '../App.css'


/* =========================================================
   EVENT TYPES
   ========================================================= */

type EventStatus =
  | 'Scheduled'
  | 'Cancelled'
  | 'Completed'

interface EventDto {
  eventId: number
  eventName: string
  startDate: string
  endDate: string
  status: EventStatus | number
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard() {
    

  const { instance, accounts } = useMsal()

  const account =
    instance.getActiveAccount() ?? accounts[0]

  console.log("MSAL account:", account)
  console.log("ID token claims:", account?.idTokenClaims)


  const [events, setEvents] = useState<EventDto[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [currentDate, setCurrentDate] =
    useState(new Date())


  /* =======================================================
     MONTHS
     ======================================================= */

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]


  const currentMonth =
    currentDate.getMonth()

  const currentYear =
    currentDate.getFullYear()


  /* =======================================================
     LOAD EVENTS
     ======================================================= */
     

  useEffect(() => {

    const getEvents = async () => {

      try {

        setLoading(true)

        setError('')


        const response =
          await fetch('/api/events')


        if (!response.ok) {

          throw new Error(
            'Failed to load events.'
          )

        }


        const data: EventDto[] =
          await response.json()


        setEvents(data)

      } catch (error) {

        console.error(
          'Error loading events:',
          error
        )

        setError(
          'Unable to load events.'
        )

      } finally {

        setLoading(false)

      }

    }


    getEvents()

  }, [])


  /*
     NORMALIZE EVENT STATUS
     
     ASP.NET may return enum values as:
     
     0 = Scheduled
     1 = Cancelled
     2 = Completed
     
     or as strings.
      */

  const getEventStatus = (
    status: EventStatus | number
  ): EventStatus => {

    if (typeof status === 'number') {

      switch (status) {

        case 0:
          return 'Scheduled'

        case 1:
          return 'Cancelled'

        case 2:
          return 'Completed'

        default:
          return 'Scheduled'

      }

    }


    return status

  }


  /* 
     PREVIOUS MONTH
    */

  const goToPreviousMonth = () => {

    setCurrentDate(
      new Date(
        currentYear,
        currentMonth - 1,
        1
      )
    )

  }


  /* 
     NEXT MONTH
    */

  const goToNextMonth = () => {

    setCurrentDate(
      new Date(
        currentYear,
        currentMonth + 1,
        1
      )
    )

  }


  /* 
     TODAY
     */

  const goToToday = () => {

    setCurrentDate(
      new Date()
    )

  }


  /* 
     MONTH DROPDOWN
      */

  const handleMonthChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {

    setCurrentDate(
      new Date(
        currentYear,
        Number(event.target.value),
        1
      )
    )

  }


  /* 
     YEAR DROPDOWN
      */

  const handleYearChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {

    setCurrentDate(
      new Date(
        Number(event.target.value),
        currentMonth,
        1
      )
    )

  }


  /* 
     YEARS
      */

  const years = Array.from(
    {
      length: 11,
    },
    (_, index) =>
      currentYear - 5 + index
  )


  /* 
     DAYS IN CURRENT MONTH
      */

  const daysInMonth =
    new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate()


  /* 
     FIRST DAY OF MONTH
     
     Monday = 0
     Tuesday = 1
     ...
     Sunday = 6
      */

  const firstDayOfMonth =
    (
      new Date(
        currentYear,
        currentMonth,
        1
      ).getDay() + 6
    ) % 7


  /* 
     PREVIOUS MONTH DAYS
      */

  const daysInPreviousMonth =
    new Date(
      currentYear,
      currentMonth,
      0
    ).getDate()


  /* 
     BUILD CALENDAR
      */

  const calendarDays = useMemo(() => {

    const days: {
      day: number
      currentMonth: boolean
      date: Date
    }[] = []


    /* Previous month */

    for (
      let i = firstDayOfMonth - 1;
      i >= 0;
      i--
    ) {

      const day =
        daysInPreviousMonth - i


      days.push({
        day,
        currentMonth: false,
        date: new Date(
          currentYear,
          currentMonth - 1,
          day
        ),
      })

    }


    /* Current month */

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {

      days.push({
        day,
        currentMonth: true,
        date: new Date(
          currentYear,
          currentMonth,
          day
        ),
      })

    }


    /* Next month */

    let nextMonthDay = 1


    while (
      days.length % 7 !== 0
    ) {

      days.push({
        day: nextMonthDay,
        currentMonth: false,
        date: new Date(
          currentYear,
          currentMonth + 1,
          nextMonthDay
        ),
      })

      nextMonthDay++

    }


    return days

  }, [
    currentMonth,
    currentYear,
    daysInMonth,
    firstDayOfMonth,
    daysInPreviousMonth,
  ])


  /* 
     EVENTS FOR A DATE
     */

  const getEventsForDate = (
    date: Date
  ) => {

    return events.filter(
      (event) => {

        const eventDate =
          new Date(
            event.startDate
          )


        return (
          eventDate.getFullYear() ===
            date.getFullYear() &&

          eventDate.getMonth() ===
            date.getMonth() &&

          eventDate.getDate() ===
            date.getDate()
        )

      }
    )

  }


  /* =======================================================
     CURRENT MONTH EVENTS
     ======================================================= */

  const monthEvents =
    events.filter(
      (event) => {

        const date =
          new Date(
            event.startDate
          )


        return (
          date.getMonth() ===
            currentMonth &&

          date.getFullYear() ===
            currentYear
        )

      }
    )


  /* =======================================================
     SCHEDULED EVENTS
     ======================================================= */

  const scheduledEvents =
    events.filter(
      (event) =>
        getEventStatus(
          event.status
        ) === 'Scheduled'
    )


  /* =======================================================
     CANCELLED EVENTS
     ======================================================= */

  const cancelledEvents =
    events.filter(
      (event) =>
        getEventStatus(
          event.status
        ) === 'Cancelled'
    )


  /* =======================================================
     UPCOMING EVENTS
     
     Cancelled events are excluded.
     ======================================================= */

  const upcomingEvents =
    events
      .filter(
        (event) => {

          const status =
            getEventStatus(
              event.status
            )


          return (
            status !== 'Cancelled' &&
            new Date(
              event.startDate
            ) >= new Date()
          )

        }
      )
      .sort(
        (a, b) =>
          new Date(
            a.startDate
          ).getTime() -
          new Date(
            b.startDate
          ).getTime()
      )
      .slice(0, 5)


  /* =======================================================
     FORMAT TIME
     ======================================================= */

  const formatTime = (
    date: string
  ) => {

    return new Date(
      date
    ).toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    )

  }


  /* =======================================================
     CHECK TODAY
     ======================================================= */

  const isToday = (
    date: Date
  ) => {

    const today =
      new Date()


    return (
      date.getDate() ===
        today.getDate() &&

      date.getMonth() ===
        today.getMonth() &&

      date.getFullYear() ===
        today.getFullYear()
    )

  }


  /* =======================================================
     USER NAME
     ======================================================= */

  const userName =
    accounts[0]?.name ||
    accounts[0]?.username ||
    'User'


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <div className="dashboard">


      {/* =================================================
          DASHBOARD HEADER
          ================================================= */}

      <header className="dashboard-header">

        <div>

          <p className="dashboard-eyebrow">
            WINEVENTS
          </p>


          <h1>
            Dashboard
          </h1>


          <p>
            Welcome back! Here's what's happening
            with your events.
          </p>

        </div>


        {/* User information only.
            Logout is already in the navbar. */}

        <div className="dashboard-profile">

          <div>

            <span>
              Welcome
            </span>

            <strong>
              {userName}
            </strong>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN DASHBOARD
          ================================================= */}

      <main className="dashboard-content">


        {/* =================================================
            STATISTICS
            ================================================= */}

        <section className="dashboard-stats">


          {/* Total */}

          <div className="stat-card">

            <span>
              Total Events
            </span>

            <strong>
              {events.length}
            </strong>

          </div>


          {/* Scheduled */}

          <div className="stat-card">

            <span>
              Scheduled
            </span>

            <strong>
              {scheduledEvents.length}
            </strong>

          </div>


          {/* Cancelled */}

          <div className="stat-card">

            <span>
              Cancelled
            </span>

            <strong>
              {cancelledEvents.length}
            </strong>

          </div>


          {/* Upcoming */}

          <div className="stat-card">

            <span>
              Upcoming
            </span>

            <strong>
              {upcomingEvents.length}
            </strong>

          </div>

        </section>


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (

          <div className="dashboard-error">

            {error}

          </div>

        )}


        {/* =================================================
            CALENDAR + UPCOMING
            ================================================= */}

        <section className="dashboard-main">


          {/* =================================================
              CALENDAR
              ================================================= */}

          <div className="calendar-card">


            {/* Calendar header */}

            <div className="section-header">


              <div>

                <div className="calendar-title">


                  {/* Month */}

                  <select
                    value={currentMonth}
                    onChange={
                      handleMonthChange
                    }
                  >

                    {months.map(
                      (
                        month,
                        index
                      ) => (

                        <option
                          key={month}
                          value={index}
                        >
                          {month}
                        </option>

                      )
                    )}

                  </select>


                  {/* Year */}

                  <select
                    value={currentYear}
                    onChange={
                      handleYearChange
                    }
                  >

                    {years.map(
                      (year) => (

                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <p>

                  {monthEvents.length}

                  {' '}

                  event(s) this month

                </p>

              </div>


              {/* Calendar navigation */}

              <div className="calendar-buttons">

                <button
                  type="button"
                  onClick={
                    goToPreviousMonth
                  }
                >
                  &lt;
                </button>


                <button
                  type="button"
                  onClick={
                    goToToday
                  }
                >
                  Today
                </button>


                <button
                  type="button"
                  onClick={
                    goToNextMonth
                  }
                >
                  &gt;
                </button>

              </div>

            </div>


            {/* =================================================
                WEEKDAYS
                ================================================= */}

            <div className="calendar-weekdays">

              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>

            </div>


            {/* =================================================
                CALENDAR DAYS
                ================================================= */}

            <div className="calendar-days">

              {calendarDays.map(
                (
                  calendarDay,
                  index
                ) => {

                  const dayEvents =
                    getEventsForDate(
                      calendarDay.date
                    )


                  return (

                    <div
                      key={
                        `${calendarDay.date.toISOString()}-${index}`
                      }

                      className={`
                        calendar-day
                        ${
                          calendarDay.currentMonth
                            ? ''
                            : 'muted'
                        }
                        ${
                          isToday(
                            calendarDay.date
                          )
                            ? 'today'
                            : ''
                        }
                      `}
                    >


                      {/* Date */}

                      <span className="calendar-number">

                        {calendarDay.day}

                      </span>


                      {/* Events */}

                      {dayEvents.map(
                        (event) => {

                          const status =
                            getEventStatus(
                              event.status
                            )


                          return (

                            <div
                              key={
                                event.eventId
                              }

                              className={`
                                calendar-event
                                ${
                                  status ===
                                  'Cancelled'
                                    ? 'cancelled-event'
                                    : ''
                                }
                              `}
                              title={
                                event.eventName
                              }
                            >

                              {event.eventName}

                            </div>

                          )

                        }
                      )}

                    </div>

                  )

                }
              )}

            </div>

          </div>


          {/* =================================================
              UPCOMING EVENTS
              ================================================= */}

          <div className="upcoming-card">


            <div className="section-header">

              <div>

                <h2>
                  Upcoming Events
                </h2>

                <p>
                  Your next scheduled events
                </p>

              </div>

            </div>


            {/* Loading */}

            {loading && (

              <p>
                Loading events...
              </p>

            )}


            {/* No events */}

            {!loading &&
              upcomingEvents.length ===
                0 && (

                <p>
                  No upcoming events.
                </p>

              )}


            {/* Upcoming events */}

            {!loading &&
              upcomingEvents.map(
                (event) => {

                  const eventDate =
                    new Date(
                      event.startDate
                    )


                  return (

                    <div
                      className="upcoming-event"
                      key={
                        event.eventId
                      }
                    >


                      {/* Date */}

                      <div className="event-date">

                        <strong>

                          {
                            eventDate.getDate()
                          }

                        </strong>

                        <span>

                          {
                            eventDate
                              .toLocaleString(
                                'en-US',
                                {
                                  month:
                                    'short',
                                }
                              )
                              .toUpperCase()
                          }

                        </span>

                      </div>


                      {/* Event information */}

                      <div>

                        <h3>
                          {event.eventName}
                        </h3>

                        <p>
                          {eventDate.toLocaleDateString(
                            'en-US',
                            {
                              month:
                                'short',
                              day:
                                'numeric',
                              year:
                                'numeric',
                            }
                          )}
                        </p>

                        <p>
                          {formatTime(
                            event.startDate
                          )}
                        </p>

                      </div>

                    </div>

                  )

                }
              )}

          </div>

        </section>

      </main>

    </div>

  )

}


export default Dashboard