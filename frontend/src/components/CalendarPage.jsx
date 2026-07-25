import '../pages/Calendar.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuth } from '../auth'
import { fetchEntries } from '../api/entries'

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

const moods = [
    { id: 'veryHappy', label: 'Very Happy', icon: 'sentiment_very_satisfied' },
    { id: 'happy', label: 'Happy', icon: 'sentiment_satisfied' },
    { id: 'neutral', label: 'Neutral', icon: 'sentiment_neutral' },
    { id: 'sad', label: 'Sad', icon: 'sentiment_dissatisfied' },
    { id: 'verySad', label: 'Very Sad', icon: 'sentiment_very_dissatisfied' },
]

const CalendarPage = () => {
    const navigate = useNavigate()
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const currentDate = new Date();

    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
    const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
    const[showEventPopup, setShowEventPopup] = useState(false)
    const [journalEntries, setJournalEntries] = useState([])

    useEffect(() => {
        fetchEntries(getAuth())
            .then(setJournalEntries)
            .catch(() => setJournalEntries([]))
    }, [])

    const entriesLoggedCount = journalEntries.length

    const weeksTracking = journalEntries.length === 0
        ? 0
        : Math.floor(
            (currentDate - Math.min(...journalEntries.map((entry) => new Date(entry.timestamp))))
            / MS_PER_WEEK
        )

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

    const prevMonth = () => {
        setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1))
        setCurrentYear(prevYear => (currentMonth === 0 ? prevYear - 1 : prevYear))
    }

    const nextMonth = () => {
        setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1))
        setCurrentYear(prevYear => (currentMonth === 11 ? prevYear + 1 : prevYear))
    }

    const handleDayClick = (day) => {
        const clickedDate = new Date(currentYear, currentMonth, day)
        const today = new Date()

        if (isSameDay(clickedDate, today)) {
            setShowEventPopup(true)
        }
    }

    const isSameDay = (date1, date2) => {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        ) 
    }

    const handleMoodSelect = (moodId) => {
        navigate('/entry', { state: { mood: moodId } })
    }

    return (
    <div className="calendar-page-wrapper">
        <div className="calendar-page-center">
        <div className="calendar-page">
            <div className="calendar">
                <h1 className="heading">Calendar</h1>
                <div className="navigate-date">
                    <h2 className="month">{monthsOfYear[currentMonth]},</h2>
                    <h2 className="year">{currentYear}</h2>
                    <div className="buttons">
                        <i className="material-symbols-rounded" onClick={prevMonth}>chevron_left</i>
                        <i className="material-symbols-rounded" onClick={nextMonth}>chevron_right</i>
                    </div>
                </div>
                <div className="weekdays">
                    {daysOfWeek.map((day) => <span key={day}>{day}</span>)}
                </div>
                <div className="days">
                    {Array.from({ length: firstDayOfMonth }, (_, index) => (
                        <span key={`empty-${index}`} />
                    ))}
                    {[...Array(daysInMonth).keys()].map((day) => (
                        <span
                            key={day + 1}
                            className={
                                day + 1 === currentDate.getDate() &&
                                currentMonth === currentDate.getMonth() &&
                                currentYear === currentDate.getFullYear()
                                 ? 'current-day'
                                 : ''
                            }
                            onClick={() => handleDayClick(day + 1)}
                        >
                            {day + 1}
                        </span>
                    ))}
                </div>
            </div>
            <div className="events">
                {showEventPopup &&
                <div className="event-popup">
                    <div className="time-input">
        <div className="event-popup-time">Mood</div>
    </div>

    <div className="mood-selector">
        {moods.map((mood) => (
            <button
                type="button"
                key={mood.id}
                aria-label={`${mood.label} — open journal`}
                onClick={() => handleMoodSelect(mood.id)}
            >
                <i className="material-symbols-rounded">{mood.icon}</i>
            </button>
        ))}
    </div>
                    <button className="close-event-popup" onClick={() => setShowEventPopup(false)}>
                        <i className="material-symbols-rounded">close</i>
                    </button>
                </div>}
                <div className="tracking-stats">
        <div className="stat-card">
            <h2>🔥</h2>
            <h3>{entriesLoggedCount}</h3>
            <p>Entries Logged</p>
        </div>

        <div className="stat-card">
            <h2>📅</h2>
            <h3>{weeksTracking} Weeks</h3>
            <p>Total Tracking</p>
        </div>
    </div>
               <div className="journal-entries">
                   {journalEntries.length > 0 && (
                       <h3 className="journal-entries-heading">Journal Entries</h3>
                   )}
                   {journalEntries.map((entry) => {
                       const entryDate = new Date(entry.timestamp)
                       return (
                           <div className="event" key={entry.entryId}>
                               <div className="event-date-wrapper">
                                   <div className="event-date">
                                       {entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                   </div>
                                   <div className="event-time">
                                       {entryDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                               </div>
                               <div className="event-text">
                                   <strong>{entry.moodLabel}</strong> — {entry.answers[0]}
                               </div>
                           </div>
                       )
                   })}
               </div>
            </div>
        </div>
        </div>
    </div>
  )
}

export default CalendarPage
