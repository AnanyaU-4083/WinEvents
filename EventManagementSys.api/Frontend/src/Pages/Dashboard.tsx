import { useEffect, useMemo, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'


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

  const navigate = useNavigate()

  const account =
    instance.getActiveAccount() ?? accounts[0]

  /*
     Use the stable Microsoft account ID for the
     useEffect dependency instead of the whole
     account object.
  */
  const accountId =
    account?.homeAccountId

  console.log('MSAL account:', account)
  console.log('ID token claims:', account?.idTokenClaims)


  /* =======================================================
     USER ROLES
     ======================================================= */

  const roles =
    (account?.idTokenClaims?.roles as string[]) ?? []

  const isAdmin =
    roles.includes('Admin')

  const isEmployee =
    roles.includes('Employee')

  const isAttendee =
    roles.includes('Attendee')


  /* =======================================================
     API SCOPE
     ======================================================= */

  const API_SCOPE =
    'api://0332cc25-1dc3-4542-b1cd-a1ad23d0f620/access_as_user'


  const [events, setEvents] =
    useState<EventDto[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [currentDate, setCurrentDate] =
    useState(new Date())

  const [hoveredEventId, setHoveredEventId] =
    useState<number | null>(null)

  const [selectedDate, setSelectedDate] =
    useState<Date | null>(null)


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

     Admin / Employee:
       GET /api/events

     Attendee:
       GET /api/events/my-registrations

     This means an Attendee only sees events
     that they have registered for.
     ======================================================= */

  useEffect(() => {

    const getEvents = async () => {

      try {

        setLoading(true)

        setError('')


        let response: Response


        /* =================================================
           ATTENDEE
           ================================================= */

        if (isAttendee) {

          if (!account) {

            throw new Error(
              'Microsoft account not available.'
            )

          }


          const tokenResponse =
            await instance.acquireTokenSilent({
              scopes: [API_SCOPE],
              account: account,
            })


          response =
            await fetch(
              '/api/events/my-registrations',
              {
                headers: {
                  Authorization:
                    `Bearer ${tokenResponse.accessToken}`,
                },
              }
            )

        }

        /* =================================================
           ADMIN / EMPLOYEE
           ================================================= */

        else {

          response =
            await fetch(
              '/api/events'
            )

        }


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

  }, [
    accountId,
    instance,
    isAttendee,
  ])


  /* =======================================================
     EVENT STATUS
     ======================================================= */

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


  /* =======================================================
     GO TO EVENT DETAILS
     ======================================================= */

  const goToEventDetails = (
    eventId: number
  ) => {

    navigate(
      `/events/${eventId}`
    )

  }


  /* =======================================================
     SELECT CALENDAR DATE

     Clicking the date only selects it.
     It does NOT navigate.
     ======================================================= */

  const selectCalendarDate = (
    date: Date
  ) => {

    setSelectedDate(date)

  }


  /* =======================================================
     ADD EVENT FROM HEADER

     Opens the normal Events page.
     ======================================================= */

  const openCreateEvent = () => {

    navigate(
      '/events'
    )

  }


  /* =======================================================
     ADD EVENT FOR SELECTED DATE

     Clicking the + on a selected calendar
     day sends the selected date to the
     Events page.
     ======================================================= */

  const addEventForSelectedDate = (
    date: Date
  ) => {

    const year =
      date.getFullYear()

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0')

    const day =
      String(
        date.getDate()
      ).padStart(2, '0')


    const selectedDate =
      `${year}-${month}-${day}`


    navigate(
      `/events?date=${selectedDate}`
    )

  }


  /* =======================================================
     PREVIOUS MONTH
     ======================================================= */

  const goToPreviousMonth = () => {

    setCurrentDate(
      new Date(
        currentYear,
        currentMonth - 1,
        1
      )
    )

  }


  /* =======================================================
     NEXT MONTH
     ======================================================= */

  const goToNextMonth = () => {

    setCurrentDate(
      new Date(
        currentYear,
        currentMonth + 1,
        1
      )
    )

  }


  /* =======================================================
     TODAY
     ======================================================= */

  const goToToday = () => {

    setCurrentDate(
      new Date()
    )

  }


  /* =======================================================
     MONTH DROPDOWN
     ======================================================= */

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


  /* =======================================================
     YEAR DROPDOWN
     ======================================================= */

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


  /* =======================================================
     YEARS
     ======================================================= */

  const years = Array.from(
    {
      length: 11,
    },
    (_, index) =>
      currentYear - 5 + index
  )


  /* =======================================================
     DAYS IN CURRENT MONTH
     ======================================================= */

  const daysInMonth =
    new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate()


  /* =======================================================
     FIRST DAY OF MONTH

     Monday = 0
     Tuesday = 1
     ...
     Sunday = 6
     ======================================================= */

  const firstDayOfMonth =
    (
      new Date(
        currentYear,
        currentMonth,
        1
      ).getDay() + 6
    ) % 7


  /* =======================================================
     DAYS IN PREVIOUS MONTH
     ======================================================= */

  const daysInPreviousMonth =
    new Date(
      currentYear,
      currentMonth,
      0
    ).getDate()


  /* =======================================================
     BUILD CALENDAR
     ======================================================= */

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


  /* =======================================================
     EVENTS FOR DATE

     CANCELLED EVENTS ARE NOT SHOWN ON THE CALENDAR.
     ======================================================= */

  const getEventsForDate = (
    date: Date
  ) => {

    return events.filter(
      (event) => {

        const status =
          getEventStatus(
            event.status
          )


        /*
           Cancelled events should never appear
           inside the calendar.
        */
        if (status === 'Cancelled') {
          return false
        }


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

     Cancelled events are excluded from the
     calendar's monthly event count.
     ======================================================= */

  const monthEvents =
    events.filter(
      (event) => {

        const status =
          getEventStatus(
            event.status
          )


        /*
           Cancelled events should not contribute
           to the calendar month count.
        */
        if (status === 'Cancelled') {
          return false
        }


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

     Cancelled events are still counted in the
     dashboard statistics.
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
     FORMAT DATE
     ======================================================= */

  const formatDate = (
    date: string
  ) => {

    return new Date(
      date
    ).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
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
     CHECK SELECTED DATE
     ======================================================= */

  const isSelectedDate = (
    date: Date
  ) => {

    if (!selectedDate) {
      return false
    }


    return (
      date.getDate() ===
        selectedDate.getDate() &&

      date.getMonth() ===
        selectedDate.getMonth() &&

      date.getFullYear() ===
        selectedDate.getFullYear()
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

    <div className="min-h-[calc(100vh-68px)] w-full bg-[#f5f8fc] px-[46px] pt-9 pb-[60px] max-[1150px]:px-[25px] max-[1150px]:pt-[30px] max-[1150px]:pb-[50px] max-[700px]:px-[15px] max-[700px]:pt-[25px] max-[700px]:pb-10">


      {/* =================================================
          DASHBOARD HEADER
          ================================================= */}

      <header className="mx-auto mb-[34px] w-full max-w-[1400px] text-center">

        <div>

          <p className="mb-[6px] text-[14px] font-[750] tracking-[1.8px] text-[#ff7a00]">
            WINEVENTS
          </p>


          <h1 className="m-0 text-[48px] font-extrabold leading-[1.1] tracking-[-1px] text-[#111827] max-[700px]:text-[38px]">
            Dashboard
          </h1>


          <p className="mt-3 text-[17px] text-[#6b7280]">
            Welcome back! Here's what's happening
            with your events.
          </p>

        </div>


        <div className="mt-[14px] flex items-center justify-center">

          <div>

            <span>
              Welcome,{' '}
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

      <main className="mx-auto w-full max-w-[1400px]">


        {/* =================================================
            STATISTICS
            ================================================= */}

        <section className="mb-[30px] grid w-full grid-cols-4 gap-5 max-[900px]:grid-cols-2 max-[700px]:grid-cols-1">


          <div className="rounded-xl border border-[#dfe5ec] bg-white p-[22px] shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] border-t-4 border-t-[#0066ff]">

            <span className="block text-[14px] font-medium text-[#6b7280]">
              Total Events
            </span>

            <strong className="mt-2 block text-[30px] font-[750] text-[#111827]">
              {events.length}
            </strong>

          </div>


          <div className="rounded-xl border border-[#dfe5ec] bg-white p-[22px] shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] border-t-4 border-t-[#ff7a00]">

            <span className="block text-[14px] font-medium text-[#6b7280]">
              Scheduled
            </span>

            <strong className="mt-2 block text-[30px] font-[750] text-[#111827]">
              {scheduledEvents.length}
            </strong>

          </div>


          <div className="rounded-xl border border-[#dfe5ec] bg-white p-[22px] shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] border-t-4 border-t-[#dc2626]">

            <span className="block text-[14px] font-medium text-[#6b7280]">
              Cancelled
            </span>

            <strong className="mt-2 block text-[30px] font-[750] text-[#111827]">
              {cancelledEvents.length}
            </strong>

          </div>


          <div className="rounded-xl border border-[#dfe5ec] bg-white p-[22px] shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] border-t-4 border-t-[#15803d]">

            <span className="block text-[14px] font-medium text-[#6b7280]">
              Upcoming
            </span>

            <strong className="mt-2 block text-[30px] font-[750] text-[#111827]">
              {upcomingEvents.length}
            </strong>

          </div>

        </section>


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (

          <div className="mb-[22px] w-full rounded-[9px] border border-[#fecaca] bg-[#fef2f2] px-[18px] py-[14px] text-[14px] text-[#b91c1c]">

            {error}

          </div>

        )}


        {/* =================================================
            CALENDAR + UPCOMING
            ================================================= */}

        <section className="grid w-full grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)] items-start gap-6 max-[1150px]:grid-cols-1">


          {/* =================================================
              CALENDAR
              ================================================= */}

          <div className="w-full rounded-[14px] border border-[#dfe5ec] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">


            {/* Calendar header */}

            <div className="mb-5 flex items-center justify-between max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-[15px]">

              <div>

                <div className="mb-[6px] flex items-center gap-2">

                  <select
                    className="min-w-[110px] cursor-pointer rounded-[7px] border border-[#cfd7e2] bg-white px-[11px] py-2 text-[14px] font-semibold text-[#111827] outline-none focus:border-[#0066ff] focus:ring-4 focus:ring-[#0066ff]/10"
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


                  <select
                    className="min-w-[110px] cursor-pointer rounded-[7px] border border-[#cfd7e2] bg-white px-[11px] py-2 text-[14px] font-semibold text-[#111827] outline-none focus:border-[#0066ff] focus:ring-4 focus:ring-[#0066ff]/10"
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


              {/* Calendar buttons */}

              <div className="flex items-center gap-[7px] max-[700px]:w-full max-[700px]:justify-start">


                {/* Header Add Event button */}

                {(
                  isAdmin ||
                  isEmployee
                ) && (

                  <button
                    type="button"
                    className="cursor-pointer rounded-[7px] border border-[#ff7a00] bg-[#ff7a00] px-3 py-2 text-[13px] font-semibold text-white transition hover:border-[#e65f00] hover:bg-[#e65f00]"
                    onClick={
                      openCreateEvent
                    }
                  >
                    + Add Event
                  </button>

                )}


                <button
                  type="button"
                  className="cursor-pointer rounded-[7px] border border-[#cfd7e2] bg-white px-3 py-2 text-[13px] font-semibold text-[#374151] hover:border-[#9bbcff] hover:bg-[#eaf2ff] hover:text-[#0066ff]"
                  onClick={
                    goToPreviousMonth
                  }
                >
                  &lt;
                </button>


                <button
                  type="button"
                  className="cursor-pointer rounded-[7px] border border-[#cfd7e2] bg-white px-3 py-2 text-[13px] font-semibold text-[#374151] hover:border-[#9bbcff] hover:bg-[#eaf2ff] hover:text-[#0066ff]"
                  onClick={
                    goToToday
                  }
                >
                  Today
                </button>


                <button
                  type="button"
                  className="cursor-pointer rounded-[7px] border border-[#cfd7e2] bg-white px-3 py-2 text-[13px] font-semibold text-[#374151] hover:border-[#9bbcff] hover:bg-[#eaf2ff] hover:text-[#0066ff]"
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

            <div className="mt-[5px] grid grid-cols-7 border-l border-t border-[#dfe5ec]">

              <span className="border-r border-b border-[#dfe5ec] bg-[#f8fafc] px-[6px] py-[11px] text-center text-[12px] font-bold uppercase tracking-[0.5px] text-[#6b7280]">
                Mon
              </span>

              <span className="border-r border-b border-[#dfe5ec] bg-[#f8fafc] px-[6px] py-[11px] text-center text-[12px] font-bold uppercase tracking-[0.5px] text-[#6b7280]">
                Tue
              </span>

              <span className="border-r border-b border-[#dfe5ec] bg-[#f8fafc] px-[6px] py-[11px] text-center text-[12px] font-bold uppercase tracking-[0.5px] text-[#6b7280]">
                Wed
              </span>

              <span className="border-r border-b border-[#dfe5ec] bg-[#f8fafc] px-[6px] py-[11px] text-center text-[12px] font-bold uppercase tracking-[0.5px] text-[#6b7280]">
                Thu
              </span>

              <span className="border-r border-b border-[#dfe5ec] bg-[#f8fafc] px-[6px] py-[11px] text-center text-[12px] font-bold uppercase tracking-[0.5px] text-[#6b7280]">
                Fri
              </span>

              <span className="border-r border-b border-[#dfe5ec] bg-[#f8fafc] px-[6px] py-[11px] text-center text-[12px] font-bold uppercase tracking-[0.5px] text-[#6b7280]">
                Sat
              </span>

              <span className="border-r border-b border-[#dfe5ec] bg-[#f8fafc] px-[6px] py-[11px] text-center text-[12px] font-bold uppercase tracking-[0.5px] text-[#6b7280]">
                Sun
              </span>

            </div>


            {/* =================================================
                CALENDAR DAYS
                ================================================= */}

            <div className="grid grid-cols-7 border-l border-t border-[#dfe5ec]">

              {calendarDays.map(
                (
                  calendarDay,
                  index
                ) => {

                  const dayEvents =
                    getEventsForDate(
                      calendarDay.date
                    )


                  const selected =
                    isSelectedDate(
                      calendarDay.date
                    )


                  return (

                    <div
                      key={
                        `${calendarDay.date.toISOString()}-${index}`
                      }

                      className={`relative min-h-[112px] cursor-pointer border-r border-b border-[#dfe5ec] bg-white p-[9px] transition hover:z-20 hover:bg-[#fbfdff] max-[900px]:min-h-[95px] max-[700px]:min-h-[75px] max-[700px]:p-[5px] ${!calendarDay.currentMonth ? 'bg-[#f8fafc]' : ''} ${isToday(calendarDay.date) ? 'bg-[#f0f6ff]' : ''} ${selected ? 'z-[25] outline-2 outline-[#ff7a00] outline-offset-[-2px]' : ''}`}

                      onClick={() =>
                        selectCalendarDate(
                          calendarDay.date
                        )
                      }
                    >


                      {/* =================================================
                          DATE NUMBER
                          ================================================= */}

                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-[650] text-[#374151] max-[700px]:h-6 max-[700px]:w-6 max-[700px]:text-[11px] ${!calendarDay.currentMonth ? 'text-[#b4bdc9]' : ''} ${isToday(calendarDay.date) ? 'bg-[#0066ff] font-[750] text-white' : ''}`}>

                        {calendarDay.day}

                      </span>


                      {/* =================================================
                          ADD BUTTON FOR SELECTED DAY

                          Only Admin / Employee can add events.
                          ================================================= */}

                      {selected &&
                        (
                          isAdmin ||
                          isEmployee
                        ) && (

                        <button
                          type="button"
                          className="ml-[6px] cursor-pointer border-0 bg-transparent p-0 align-middle text-[20px] font-bold leading-none text-[#ff7a00] hover:scale-[1.15] hover:text-[#e65f00]"

                          onClick={(clickEvent) => {

                            clickEvent.stopPropagation()

                            addEventForSelectedDate(
                              calendarDay.date
                            )

                          }}

                          title="Add event on this date"
                        >
                          +
                        </button>

                      )}


                      {/* =================================================
                          EVENTS

                          Cancelled events are already removed by
                          getEventsForDate(), so they will never
                          be rendered here.
                          ================================================= */}

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

                              className="relative mt-[6px] w-full cursor-pointer overflow-visible whitespace-nowrap rounded-[5px] border-l-[3px] border-[#ff7a00] bg-[#fff1e6] px-2 py-[6px] text-[11px] font-[650] text-[#b45309] transition hover:z-[100] hover:bg-[#ffe4cc] max-[700px]:p-1 max-[700px]:text-[9px]"

                              onMouseEnter={() =>
                                setHoveredEventId(
                                  event.eventId
                                )
                              }

                              onMouseLeave={() =>
                                setHoveredEventId(
                                  null
                                )
                              }

                              onClick={(eventClick) => {
                                eventClick.stopPropagation()
                              }}
                            >

                              {event.eventName}


                              {/* =================================================
                                  EVENT POPUP
                                  ================================================= */}

                              {hoveredEventId ===
                                event.eventId && (

                                <div
                                  className="absolute left-0 top-7 z-[1000] w-[370px] cursor-default rounded-lg border-t-4 border-[#0066ff] bg-white p-[18px] text-left text-[#374151] shadow-[0_8px_24px_rgba(0,0,0,0.18)] max-[700px]:left-auto max-[700px]:right-0 max-[700px]:w-[300px]"

                                  onMouseEnter={() =>
                                    setHoveredEventId(
                                      event.eventId
                                    )
                                  }

                                  onMouseLeave={() =>
                                    setHoveredEventId(
                                      null
                                    )
                                  }

                                  onClick={(popupClick) =>
                                    popupClick.stopPropagation()
                                  }
                                >


                                  {/* ==============================
                                      POPUP HEADER
                                      ============================== */}

                                  <div className="flex items-start justify-between gap-3">

                                    <h3 className="m-0 text-[20px] font-semibold leading-[1.3] text-[#6b7280]">
                                      {event.eventName}
                                    </h3>


                                    <button
                                      type="button"
                                      className="cursor-pointer border-0 bg-transparent px-1 py-0.5 text-[20px] leading-none text-[#6b7280] hover:text-[#0066ff]"

                                      onClick={() =>
                                        goToEventDetails(
                                          event.eventId
                                        )
                                      }

                                      title="Open event"
                                    >
                                      ↗
                                    </button>

                                  </div>


                                  {/* Divider */}

                                  <div className="my-[14px] h-px bg-[#edf0f4]" />


                                  {/* ==============================
                                      DATE / TIME
                                      ============================== */}

                                  <div className="flex min-h-[35px] items-start gap-3">

                                    <span className="w-[22px] shrink-0 text-center text-[19px] text-[#6b7280]">
                                      ◷
                                    </span>


                                    <div className="flex flex-col gap-1 text-[14px] leading-[1.4]">

                                      <strong>
                                        {formatDate(
                                          event.startDate
                                        )}
                                      </strong>


                                      <span>
                                        {formatTime(
                                          event.startDate
                                        )}

                                        {' - '}

                                        {formatTime(
                                          event.endDate
                                        )}
                                      </span>

                                    </div>

                                  </div>


                                  {/* Divider */}

                                  <div className="my-[14px] h-px bg-[#edf0f4]" />


                                  {/* ==============================
                                      LOCATION
                                      ============================== */}

                                  <div className="flex min-h-[35px] items-start gap-3">

                                    <span className="w-[22px] shrink-0 text-center text-[19px] text-[#6b7280]">
                                      ◉
                                    </span>


                                    <div className="flex flex-col gap-1 text-[14px] leading-[1.4]">

                                      <span>
                                        No location added
                                      </span>

                                    </div>

                                  </div>


                                  {/* Divider */}

                                  <div className="my-[14px] h-px bg-[#edf0f4]" />


                                  {/* ==============================
                                      ORGANIZER
                                      ============================== */}

                                  <div className="flex min-h-[35px] items-start gap-3">

                                    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-[13px] font-bold text-[#e65f00]">

                                      {userName
                                        .charAt(0)
                                        .toUpperCase()}

                                    </div>


                                    <div className="flex flex-col gap-1 text-[14px] leading-[1.4]">

                                      <span className="text-[#6b7280]">
                                        You're the organizer.
                                      </span>


                                      <span className="text-[#6b7280]">
                                        Status: {status}
                                      </span>

                                    </div>

                                  </div>


                                  {/* Divider */}

                                  <div className="my-[14px] h-px bg-[#edf0f4]" />


                                  {/* ==============================
                                      ACTION BUTTONS
                                      ============================== */}

                                  <div className="mt-1 flex gap-2">

                                    <button
                                      type="button"
                                      className="cursor-pointer rounded-[4px] border border-[#dfe5ec] bg-white px-[14px] py-2 text-[14px] text-[#0066ff] hover:border-[#0066ff] hover:bg-[#eaf2ff]"

                                      onClick={() =>
                                        goToEventDetails(
                                          event.eventId
                                        )
                                      }
                                    >
                                      ✎ Edit
                                    </button>


                                    <button
                                      type="button"
                                      className="cursor-pointer rounded-[4px] border border-[#dfe5ec] bg-white px-[14px] py-2 text-[14px] text-[#dc2626] hover:border-[#dc2626] hover:bg-[#fee2e2]"
                                    >
                                      × Cancel
                                    </button>

                                  </div>

                                </div>

                              )}

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

          <div className="w-full rounded-[14px] border border-[#dfe5ec] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">


            <div className="mb-5 flex items-center justify-between max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-[15px]">

              <div>

                <h2 className="m-0 text-[21px] font-[750] text-[#111827]">
                  Upcoming Events
                </h2>

                <p className="mt-[5px] text-[13px] text-[#6b7280]">
                  Your next scheduled events
                </p>

              </div>

            </div>


            {/* Loading */}

            {loading && (

              <p className="m-0 px-0 py-[25px] text-center text-[14px] text-[#6b7280]">
                Loading events...
              </p>

            )}


            {/* No events */}

            {!loading &&
              upcomingEvents.length ===
                0 && (

                <p className="m-0 px-0 py-[25px] text-center text-[14px] text-[#6b7280]">
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
                      className="flex cursor-pointer items-center gap-[14px] border-b border-[#edf0f4] py-[14px] last:border-b-0 max-[1150px]:mr-[1%] max-[1150px]:inline-flex max-[1150px]:w-[32.5%] max-[1150px]:border max-[1150px]:rounded-[9px] max-[1150px]:p-3 max-[700px]:mb-2 max-[700px]:mr-0 max-[700px]:w-full"

                      key={
                        event.eventId
                      }

                      onClick={() =>
                        goToEventDetails(
                          event.eventId
                        )
                      }

                      title="Go to event details"
                    >


                      {/* Date */}

                      <div className="flex h-[60px] w-[55px] shrink-0 flex-col items-center justify-center rounded-[9px] border border-[#cfe0ff] bg-[#eaf2ff]">

                        <strong className="text-[21px] font-extrabold leading-none text-[#0066ff]">
                          {
                            eventDate.getDate()
                          }
                        </strong>


                        <span className="mt-1 text-[10px] font-extrabold tracking-[0.7px] text-[#ff7a00]">

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


                        <p className="m-0 text-[12px] text-[#6b7280]">

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


                        <p className="m-0 text-[12px] text-[#6b7280]">

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