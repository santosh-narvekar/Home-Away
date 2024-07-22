import React from 'react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'

type PriceInputProps = {
  // super useful when needed to edit the property
  defaultValue?:number;
}

function PriceInput({defaultValue}:PriceInputProps) {
  const name = 'price' // hardcoding name for server actioon
  return (
    <div className='mb-2'>
       <Label htmlFor={name} className='capitalize'>
        Price ($)
       </Label> 
       < Input id={name} type='number' name={name} min={0} defaultValue={defaultValue || 100} required />
    </div>
  )
}

export default PriceInput
