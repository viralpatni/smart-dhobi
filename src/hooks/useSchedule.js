import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * Hook to get a student's laundry schedule
 */
export const useStudentSchedule = (uid) => {
  const [schedule, setSchedule] = useState(null);
  const [allMyDates, setAllMyDates] = useState([]);
  const [monthName, setMonthName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const fetchProfileAndSchedule = async () => {
      try {
        // 1. Get user profile for block/room
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('hostel_block, room_no')
          .eq('id', uid)
          .maybeSingle();

        if (pError || !profile) throw pError || new Error('No profile');

        const block = profile.hostel_block;
        const room = profile.room_no;

        // 2. Get current month schedules
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        setMonthName(now.toLocaleString('default', { month: 'long' }));

        const { data: schedules, error: sError } = await supabase
          .from('monthly_schedules')
          .select('*')
          .eq('year', year)
          .eq('month', month)
          .eq('hostel_block', block);

        if (sError) throw sError;

        // 3. Find matching schedule for room
        let mySchedule = null;
        let allDates = [];

        schedules.forEach(s => {
          if (isRoomInRange(room, s.room_range)) {
            // Check if today is the day
            const todayStr = now.toISOString().split('T')[0];
            const scheduleDates = s.schedule_data || {};
            
            // Map dates for the timeline
            Object.entries(scheduleDates).forEach(([date, dayInfo]) => {
              const fullDate = `${year}-${month}-${date.padStart(2, '0')}`;
              const isToday = fullDate === todayStr;
              const isPast = new Date(fullDate) < new Date(todayStr);

              const dateObj = {
                date,
                fullDate,
                dayName: dayInfo.day,
                roomRange: s.room_range,
                isToday,
                isPast,
                isFuture: !isToday && !isPast,
                id: s.id
              };

              allDates.push(dateObj);
              if (isToday) mySchedule = dateObj;
            });
          }
        });

        // Sort dates
        allDates.sort((a, b) => parseInt(a.date) - parseInt(b.date));

        setSchedule(mySchedule);
        setAllMyDates(allDates);
      } catch (err) {
        console.error('useStudentSchedule Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndSchedule();
  }, [uid]);

  return { schedule, allMyDates, monthName, loading };
};

/**
 * Check if there's a schedule for given user's hostel block / room.
 * Returns { isScheduled, scheduleInfo, loading }
 */
export const checkSchedule = async (hostelBlock, roomNo) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    const { data, error } = await supabase
      .from('monthly_schedules')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .eq('hostel_block', hostelBlock);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { isScheduled: false, scheduleInfo: null };
    }

    // Check if room number falls within any schedule's room range
    for (const schedule of data) {
      const scheduleData = schedule.schedule_data || {};
      const roomRange = schedule.room_range || '';

      if (isRoomInRange(roomNo, roomRange)) {
        return {
          isScheduled: true,
          scheduleInfo: {
            id: schedule.id,
            year: schedule.year,
            month: schedule.month,
            hostelBlock: schedule.hostel_block,
            scheduleData: scheduleData,
            roomRange: schedule.room_range,
          },
        };
      }
    }

    return { isScheduled: false, scheduleInfo: null };
  } catch (err) {
    console.error('Error checking schedule:', err);
    return { isScheduled: false, scheduleInfo: null };
  }
};

function isRoomInRange(roomNo, rangeStr) {
  if (!rangeStr || !roomNo) return true; // No range means all rooms
  const roomNum = parseInt(roomNo, 10);
  if (isNaN(roomNum)) return true;

  // Parse ranges like "101-120, 201-220"
  const ranges = rangeStr.split(',').map(s => s.trim());
  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && roomNum >= start && roomNum <= end) {
        return true;
      }
    } else {
      const single = parseInt(range, 10);
      if (!isNaN(single) && roomNum === single) return true;
    }
  }
  return false;
}

