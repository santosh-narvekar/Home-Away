'use client';
import { Calendar } from '@/components/ui/calendar';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { DateRange } from 'react-day-picker';
import { useProperty } from '@/utils/store';

import {
  generateDisabledDates,
  generateDateRange,
  defaultSelected,
  generateBlockedPeriods,
} from '@/utils/calendar';


function BookingCalendar() {

  // grabbing currentdate
  const currentDate = new Date();

  // booked dates undefined for now 😢
 // const defaultSelected:DateRange = {
   // from:undefined,
    //to:undefined
 // }
 
  const [range,setRange] = useState<DateRange | undefined>(defaultSelected); // { from:undefined , To:undefined }
  const {bookings} = useProperty((state) => state);
  
  // toast if the date is already booked
  const {toast} = useToast();


  const blockedPeriods = generateBlockedPeriods({
    bookings,
    today:currentDate,
  })

  const unavailableDates = generateDisabledDates(blockedPeriods)
  console.log(unavailableDates)
  useEffect(()=>{

    const selectedRange = generateDateRange(range);
    const isDisabledDateIncluded = selectedRange.some((date)=>{
      if(unavailableDates[date]) {
        setRange(defaultSelected);
        toast({
          description:" Some dates are booked. Please select again "
        })
        return true
      }
      return false;
    })
    useProperty.setState({range})
  },[range]);


  return (
    <Calendar mode='range' defaultMonth={currentDate} selected={range} onSelect={setRange} disabled={blockedPeriods} />
  )
}

export default BookingCalendar
