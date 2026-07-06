import '../pages/Calendar.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth } from '../auth'

const CalendarPage = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const [mood, setMood] = useState(3)

    const navigate = useNavigate()

    const handleLogout = () => {
        clearAuth()
        navigate('/login', { replace: true })
    }

    const currentDate = new Date();

    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
    const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
    const [selectedDate, setSelectedDate] = useState(currentDate)
    const[showEventPopup, setShowEventPopup] = useState(false)
    const [events, setEvents] = useState([])
    const [eventTime, setEventTime] = useState({ hours: '00', minutes: '00' })
    const [eventText, setEventText] = useState('')

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

        if (clickedDate >= today || isSameDay(clickedDate, today)) {
            setSelectedDate(clickedDate)
            setShowEventPopup(true)
            setEventText('')
            setEventTime({ hours: '00', minutes: '00' })
        }
    }

    const isSameDay = (date1, date2) => {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        ) 
    }

    const handleEventSubmit = () => {
        const newEvent = {
            date: selectedDate,
            mood: mood,
            text: eventText
        }
        setEvents([...events, newEvent])
        setEventTime({ hours: '00', minutes: '00' })
        setEventText('')
        setMood(3)
        setShowEventPopup(false)
    }

    return (
    <div className="calendar-page-wrapper">

        {/* ── Nav ── */}
        <nav className="calendar-nav">
            <div className="calendar-nav-inner">
                <span className="nav-menu">Menu</span>
                <span className="nav-logo">lifesafe</span>
                <div className="nav-links">
                    <button type="button" className="nav-link active">Calendar</button>
                    <button type="button" className="nav-link" onClick={() => navigate('/resources')}>Resources</button>
                    <button type="button" className="nav-link" onClick={() => navigate('/message')}>Message</button>
                    <button className="nav-btn" onClick={() => navigate('/entry')}>New Entry</button>
                    <button className="nav-btn nav-btn-secondary" onClick={handleLogout}>Log out</button>
                </div>
            </div>
        </nav>

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
                    {[...Array(firstDayOfMonth).keys()].map((_, index) => (
                        <span key={'empty-${index}'}/>
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
        <i
            className={`material-symbols-rounded ${mood === 5 ? 'selected' : ''}`}
            onClick={() => setMood(5)}
        >
            sentiment_very_satisfied
        </i>

        <i
            className={`material-symbols-rounded ${mood === 4 ? 'selected' : ''}`}
            onClick={() => setMood(4)}
        >
            sentiment_satisfied
        </i>

        <i
            className={`material-symbols-rounded ${mood === 3 ? 'selected' : ''}`}
            onClick={() => setMood(3)}
        >
            sentiment_neutral
        </i>

        <i
            className={`material-symbols-rounded ${mood === 2 ? 'selected' : ''}`}
            onClick={() => setMood(2)}
        >
            sentiment_dissatisfied
        </i>

        <i
            className={`material-symbols-rounded ${mood === 1 ? 'selected' : ''}`}
            onClick={() => setMood(1)}
        >
            sentiment_very_dissatisfied
        </i>
    </div>

    <textarea
        placeholder="How are you feeling today?"
        value={eventText}
        onChange={(e) => {
            if (e.target.value.length <= 300) {
                setEventText(e.target.value)
            }
        }}
    ></textarea>

    <button
        className="event-popup-btn"
        onClick={handleEventSubmit}
    >
        Save Journal Entry
    </button>
                    <button className="close-event-popup" onClick={() => setShowEventPopup(false)}>
                        <i className="material-symbols-rounded">close</i>
                    </button>
                </div>}
                <div className="tracking-stats">
        <div className="stat-card">
            <h2>🔥</h2>
            <h3>7 Days</h3>
            <p>Tracked Consecutively</p>
        </div>

        <div className="stat-card">
            <h2>📅</h2>
            <h3>3 Weeks</h3>
            <p>Total Tracking</p>
        </div>
    </div>
               {/*}
               <div className="event">
                <div className="event-date-wrapper">
                    <div className="event-date">May 15, 2024</div>
                    <div className="event-time">10:00</div>
                </div>
                <div className="event-text">Event Sample</div>
                <div className="event-buttons">
                    <i className="material-symbols-rounded">edit</i>
                    <i className="material-symbols-rounded">3p</i>
                </div>
               </div>
               */}
            </div>
        </div>
        </div>
    </div>
  )
}

export default CalendarPage