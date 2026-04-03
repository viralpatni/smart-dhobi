import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Checks if a student's room number falls within a given range string like "101-319".
 * Strips any non-numeric prefix (e.g., "A-101" becomes 101).
 */
const isRoomInRange = (roomNo, rangeStr) => {
  if (!roomNo || !rangeStr || rangeStr.trim() === '') return false;

  const parts = rangeStr.split('-').map(p => p.trim());
  
  // Extract the numeric portion of the student's room
  const studentRoomNum = parseInt(String(roomNo).replace(/\D/g, ''), 10);
  
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    if (!isNaN(studentRoomNum) && !isNaN(min) && !isNaN(max)) {
      return studentRoomNum >= min && studentRoomNum <= max;
    }
  }
  
  return false;
};

/**
 * Hook that checks the `monthlySchedules` collection to determine:
 * 1. If TODAY is the student's laundry day (schedule)
 * 2. ALL dates this month when the student has laundry (allMyDates)
 */
export const useStudentSchedule = (userId) => {
  const [schedule, setSchedule] = useState(null);
  const [allMyDates, setAllMyDates] = useState([]);
  const [monthName, setMonthName] = useState('');
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userId || !userData) {
      setLoading(false);
      return;
    }

    const checkSchedule = async () => {
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const todayDate = now.getDate();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        setMonthName(`${monthNames[currentMonth - 1]} ${currentYear}`);

        const studentBlock = userData.hostelBlock;
        const studentRoom = userData.roomNo;

        if (!studentBlock) {
          setSchedule(null);
          setAllMyDates([]);
          setLoading(false);
          return;
        }

        // Query monthly schedules for this month/year and the student's block
        const q = query(
          collection(db, 'monthlySchedules'),
          where('year', '==', currentYear),
          where('month', '==', currentMonth),
          where('hostelBlock', '==', studentBlock)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          setSchedule(null);
          setAllMyDates([]);
          setLoading(false);
          return;
        }

        let foundTodaySchedule = null;
        const studentDates = [];

        for (const doc of snap.docs) {
          const data = doc.data();
          const scheduleMap = data.scheduleMap || {};

          // Loop through ALL days in the schedule map
          for (const [dateKey, rangeStr] of Object.entries(scheduleMap)) {
            if (rangeStr && rangeStr.trim() !== '' && isRoomInRange(studentRoom, rangeStr)) {
              const dayNum = parseInt(dateKey, 10);
              
              // Build a proper date object for display
              const dateObj = new Date(currentYear, currentMonth - 1, dayNum);
              const isPast = dayNum < todayDate;
              const isToday = dayNum === todayDate;
              const isFuture = dayNum > todayDate;

              studentDates.push({
                date: dayNum,
                dateObj,
                roomRange: rangeStr,
                isPast,
                isToday,
                isFuture,
                dayName: dateObj.toLocaleDateString('en-IN', { weekday: 'short' }),
                fullDate: dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
              });

              // Check if today specifically
              if (isToday) {
                foundTodaySchedule = {
                  id: doc.id,
                  hostelBlock: data.hostelBlock,
                  roomRange: rangeStr,
                  slotDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`,
                  slotTime: 'Today',
                };
              }
            }
          }
        }

        // Sort dates in ascending order
        studentDates.sort((a, b) => a.date - b.date);

        setSchedule(foundTodaySchedule);
        setAllMyDates(studentDates);
      } catch (error) {
        console.error('Error checking monthly schedule:', error);
        setSchedule(null);
        setAllMyDates([]);
      } finally {
        setLoading(false);
      }
    };

    checkSchedule();
  }, [userId, userData]);

  return { schedule, allMyDates, monthName, loading };
};
