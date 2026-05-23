import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Award, MapPin } from 'lucide-react';

const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' | 'week' | 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Static Mock Data for HR Events, Holidays, and Attendance Markers
  const holidays = [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-05-01', name: 'Labor Day' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ];

  const events = [
    { date: '2026-05-05', title: 'HR Orientation & Onboarding', time: '10:00 AM', type: 'training' },
    { date: '2026-05-12', title: 'Monthly All Hands Meeting', time: '03:00 PM', type: 'meeting' },
    { date: '2026-05-15', title: 'Performance Review Deadline', time: '06:00 PM', type: 'deadline' },
    { date: '2026-05-20', title: 'Strategy Sync: Q3 Focus', time: '11:00 AM', type: 'meeting' },
    { date: '2026-05-25', title: 'Compliance & Safety Training', time: '02:00 PM', type: 'training' },
    { date: '2026-05-28', title: 'Employee Birthday Celebrations', time: '04:30 PM', type: 'celebration' },
  ];

  const attendanceLogs = {
    '2026-05-01': { status: 'absent', checkIn: '--', checkOut: '--' },
    '2026-05-04': { status: 'present', checkIn: '08:55 AM', checkOut: '05:30 PM' },
    '2026-05-05': { status: 'present', checkIn: '08:48 AM', checkOut: '05:40 PM' },
    '2026-05-06': { status: 'late', checkIn: '09:15 AM', checkOut: '05:45 PM' },
    '2026-05-07': { status: 'present', checkIn: '08:52 AM', checkOut: '05:30 PM' },
    '2026-05-08': { status: 'present', checkIn: '08:50 AM', checkOut: '05:32 PM' },
    '2026-05-11': { status: 'present', checkIn: '08:58 AM', checkOut: '05:45 PM' },
    '2026-05-12': { status: 'present', checkIn: '08:45 AM', checkOut: '05:30 PM' },
    '2026-05-13': { status: 'late', checkIn: '09:22 AM', checkOut: '06:00 PM' },
    '2026-05-14': { status: 'present', checkIn: '08:50 AM', checkOut: '05:35 PM' },
    '2026-05-15': { status: 'present', checkIn: '08:53 AM', checkOut: '05:30 PM' },
    '2026-05-18': { status: 'absent', checkIn: '--', checkOut: '--' },
    '2026-05-19': { status: 'present', checkIn: '08:49 AM', checkOut: '05:30 PM' },
  };

  const formatDateStr = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const selectedDateStr = formatDateStr(selectedDate);
  const selectedDayEvents = events.filter(e => e.date === selectedDateStr);
  const selectedDayHoliday = holidays.find(h => h.date === selectedDateStr);
  const selectedDayAttendance = attendanceLogs[selectedDateStr];

  // Helper calculation for month view grid
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  // Month View Renderer
  const renderMonthView = () => {
    const cells = [];

    // Header labels
    dayNames.forEach(day => {
      cells.push(
        <div key={day} className="text-center text-xs font-semibold text-gray-500 uppercase py-2">
          {day}
        </div>
      );
    });

    // Blank cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="p-3 bg-gray-50/40 border border-gray-100 rounded-lg"></div>);
    }

    // Days in Month
    for (let day = 1; day <= daysInMonth; day++) {
      const activeLoopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = formatDateStr(activeLoopDate);
      const isToday = day === new Date().getDate() && 
                      currentDate.getMonth() === new Date().getMonth() &&
                      currentDate.getFullYear() === new Date().getFullYear();
      const isSelected = selectedDate.getDate() === day && 
                         selectedDate.getMonth() === currentDate.getMonth() &&
                         selectedDate.getFullYear() === currentDate.getFullYear();

      // Markers
      const hasEvents = events.some(e => e.date === dateStr);
      const holiday = holidays.find(h => h.date === dateStr);
      const attendance = attendanceLogs[dateStr];

      cells.push(
        <div
          key={day}
          onClick={() => setSelectedDate(activeLoopDate)}
          className={`min-h-[85px] p-2 border border-gray-100 rounded-lg cursor-pointer transition-all duration-200 flex flex-col justify-between hover:border-blue-500 hover:shadow-sm ${
            isSelected 
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100' 
              : isToday 
              ? 'bg-amber-50/50 border-amber-300' 
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-sm font-semibold p-1 px-2 rounded-full ${
              isSelected 
                ? 'bg-blue-600 text-white' 
                : isToday 
                ? 'bg-amber-500 text-white' 
                : 'text-gray-700'
            }`}>
              {day}
            </span>
            {holiday && (
              <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded leading-none">
                Holiday
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 mt-2">
            {/* Status indicators */}
            <div className="flex items-center gap-1.5">
              {attendance && (
                <span className={`w-2.5 h-2.5 rounded-full ${
                  attendance.status === 'present' 
                    ? 'bg-green-500' 
                    : attendance.status === 'late' 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`} title={`Attendance: ${attendance.status}`} />
              )}
              {hasEvents && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Scheduled Event" />
              )}
            </div>
            
            {hasEvents && (
              <p className="text-[10px] text-blue-700 truncate font-medium">
                {events.find(e => e.date === dateStr)?.title}
              </p>
            )}
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-2">{cells}</div>;
  };

  // Week View Renderer
  const renderWeekView = () => {
    // Get start of week
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(dayDate.getDate() + i);
      weekDays.push(dayDate);
    }

    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((dayDate, idx) => {
          const dateStr = formatDateStr(dayDate);
          const isSelected = selectedDate.toDateString() === dayDate.toDateString();
          const dayEvents = events.filter(e => e.date === dateStr);
          const holiday = holidays.find(h => h.date === dateStr);
          const attendance = attendanceLogs[dateStr];

          return (
            <div
              key={idx}
              onClick={() => {
                setSelectedDate(dayDate);
                setCurrentDate(dayDate);
              }}
              className={`p-4 min-h-[220px] rounded-xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-400 shadow-md ring-2 ring-blue-100'
                  : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-300'
              }`}
            >
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{dayNames[dayDate.getDay()]}</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{dayDate.getDate()}</p>
                {holiday && (
                  <span className="mt-2 inline-block text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                    {holiday.name}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2 flex-grow">
                {dayEvents.map((evt, eIdx) => (
                  <div key={eIdx} className="bg-blue-100/60 p-2 rounded-lg text-left">
                    <p className="text-[11px] font-bold text-blue-800 truncate">{evt.title}</p>
                    <p className="text-[9px] text-blue-600 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" /> {evt.time}
                    </p>
                  </div>
                ))}
              </div>

              {attendance && (
                <div className={`mt-2 flex items-center justify-between p-2 rounded-lg text-xs font-semibold ${
                  attendance.status === 'present' 
                    ? 'bg-green-100 text-green-800' 
                    : attendance.status === 'late' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <span className="capitalize">{attendance.status}</span>
                  <span className="text-[10px] text-gray-500 font-normal">{attendance.checkIn}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Day View Renderer
  const renderDayView = () => {
    const hours = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ];

    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        <div className="p-4 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-gray-900">
              {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </span>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              {dayNames[selectedDate.getDay()]}
            </span>
          </div>
          {selectedDayHoliday && (
            <span className="bg-rose-100 text-rose-700 font-extrabold text-sm px-3 py-1 rounded-lg">
              Holiday: {selectedDayHoliday.name}
            </span>
          )}
        </div>

        <div className="p-6 space-y-4">
          {hours.map((hour, idx) => {
            // Check if any event falls in this hour range
            const matchingEvent = selectedDayEvents.find(e => {
              const hourPrefix = hour.split(':')[0]; // "09", "10", etc.
              const hourAmPm = hour.split(' ')[1]; // "AM", "PM"
              return e.time.includes(hourPrefix) && e.time.includes(hourAmPm);
            });

            return (
              <div key={idx} className="flex items-start gap-6 py-2">
                <span className="w-20 text-sm font-semibold text-gray-400 mt-1">{hour}</span>
                <div className="flex-1 min-h-[48px] flex items-center">
                  {matchingEvent ? (
                    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 rounded-r-xl p-4 shadow-sm text-left">
                      <p className="text-sm font-bold text-gray-900">{matchingEvent.title}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Scheduled at {matchingEvent.time}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full border border-dashed border-gray-200 rounded-xl py-3 px-4 text-left text-xs text-gray-400">
                      No events scheduled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getCalendarTitle = () => {
    if (view === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
    } else {
      return `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper control layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Toggle tabs for views */}
        <div className="bg-gray-100 p-1 rounded-xl flex self-start">
          {['month', 'week', 'day'].map((type) => (
            <button
              key={type}
              onClick={() => setView(type)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                view === type 
                  ? 'bg-white text-blue-600 shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type} view
            </button>
          ))}
        </div>

        {/* Date controllers */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <h3 className="text-lg font-black text-gray-900">
            {getCalendarTitle()}
          </h3>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDate(new Date());
              }}
              className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid displays based on view state */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Interactive Footer Panel displaying detailed indicators for clicked date */}
      {view !== 'day' && (
        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100 p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-blue-600 text-white p-3.5 rounded-xl shadow-md">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Selected Date Summary</p>
              <h4 className="text-lg font-black text-gray-900">
                {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h4>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {/* Holiday Status */}
            <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 flex-1 md:flex-initial text-left min-w-[140px]">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Holiday</span>
              {selectedDayHoliday ? (
                <span className="text-sm font-black text-rose-600 leading-none">
                  {selectedDayHoliday.name}
                </span>
              ) : (
                <span className="text-sm font-semibold text-gray-500 leading-none">
                  Regular Working Day
                </span>
              )}
            </div>

            {/* Attendance Status */}
            <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 flex-1 md:flex-initial text-left min-w-[140px]">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">My Attendance</span>
              {selectedDayAttendance ? (
                <div className="flex flex-col">
                  <span className={`text-sm font-black capitalize leading-none ${
                    selectedDayAttendance.status === 'present' 
                      ? 'text-green-600' 
                      : selectedDayAttendance.status === 'late' 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  }`}>
                    {selectedDayAttendance.status}
                  </span>
                  {selectedDayAttendance.status !== 'absent' && (
                    <span className="text-[9px] text-gray-400 mt-1">
                      In: {selectedDayAttendance.checkIn}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-semibold text-gray-500 leading-none">
                  No log recorded
                </span>
              )}
            </div>

            {/* Events count */}
            <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 flex-1 md:flex-initial text-left min-w-[140px]">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Events Scheduled</span>
              <span className="text-sm font-black text-blue-600 leading-none">
                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* List display of detailed events for month & week clickouts */}
      {view !== 'day' && selectedDayEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left">
          <h4 className="text-md font-bold text-gray-900 mb-4">
            Events Scheduled on {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDayEvents.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-colors">
                <div className={`p-2.5 rounded-lg text-white ${
                  evt.type === 'meeting' 
                    ? 'bg-blue-500' 
                    : evt.type === 'training' 
                    ? 'bg-indigo-500' 
                    : evt.type === 'deadline' 
                    ? 'bg-rose-500' 
                    : 'bg-amber-500'
                }`}>
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-gray-800">{evt.title}</h5>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> {evt.time}
                    <span className="text-gray-300">|</span>
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> Conference Room B
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;
