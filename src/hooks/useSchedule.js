import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const isRoomInRange = (roomNo, rangeStr) => {
  if (!roomNo || !rangeStr || rangeStr.trim() === '') return false;
  const parts = rangeStr.split('-').map(p => p.trim());
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

    let unsub = () => {};

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

      const q = query(
        collection(db, 'monthlySchedules'),
        where('year', '==', currentYear),
        where('month', '==', currentMonth),
        where('hostelBlock', '==', studentBlock)
      );

      unsub = onSnapshot(q, (snap) => {
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
          for (const [dateKey, rangeStr] of Object.entries(scheduleMap)) {
            if (rangeStr && rangeStr.trim() !== '' && isRoomInRange(studentRoom, rangeStr)) {
              const dayNum = parseInt(dateKey, 10);
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

        studentDates.sort((a, b) => a.date - b.date);
        setSchedule(foundTodaySchedule);
        setAllMyDates(studentDates);
        setLoading(false);
      }, (err) => {
        console.error('Error fetching real-time schedule:', err);
        setSchedule(null);
        setAllMyDates([]);
        setLoading(false);
      });
    } catch (error) {
      console.error('Error setting up schedule listener:', error);
      setSchedule(null);
      setAllMyDates([]);
      setLoading(false);
    }

    return () => unsub();
  }, [userId, userData]);
  return { schedule, allMyDates, monthName, loading };
};
