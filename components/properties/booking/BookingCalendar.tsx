'use client'
import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"

function BookingCalendar() {

  // grabbing currentdate
  const currentDate = new Date();

  // booked dates undefined for now 😢
  const defaultSelected:DateRange = {
    from:undefined,
    to:undefined
  }

  const [range,setRange] = useState<DateRange | undefined>(defaultSelected);

  return (
    <Calendar mode='range' defaultMonth={currentDate} selected={range} onSelect={setRange} />
  )
}

export default BookingCalendar
