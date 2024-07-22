import { findCountryByCode } from "@/utils/countries"

function CountryFlagAndName({countryCode}:{countryCode:string}) {

  // ! telling typescript we know more that there is going to be a valid country
  const validCountry = findCountryByCode(countryCode)!
  const countryName = validCountry.name.length > 20 ? `${validCountry.name.substring(0,20)}...` : validCountry.name
  console.log(countryCode)
  
  return (
    <span className="flex justify-between items-center gap-2 text-sm">
      {validCountry.flag} {countryName}
    </span>
  )
}

export default CountryFlagAndName
