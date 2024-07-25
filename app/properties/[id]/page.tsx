import FavoriteToggleButton from "@/components/card/FavoriteToggleButton";
import PropertyRating from "@/components/card/PropertyRating";
import Amenities from "@/components/properties/Amenities";
import BookingCalendar from "@/components/properties/booking/BookingCalendar";
import BreadCrumbs from "@/components/properties/BreadCrumbs";
import Description from "@/components/properties/Description";
import ImageContainer from "@/components/properties/ImageContainer";
import PropertyDetails from "@/components/properties/PropertyDetails";
import ShareButton from "@/components/properties/ShareButton";
import UserInfo from "@/components/properties/UserInfo";
import PropertyReviews from "@/components/reviews/PropertyReviews";
import SubmitReview from "@/components/reviews/SubmitReview";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPropertyDetails,findExistingReview } from "@/utils/actions"
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import {auth} from '@clerk/nextjs/server';




const DynamicMap = dynamic(()=>import('@/components/properties/PropertyMap'),{
  ssr:false,
  loading: () => <Skeleton className = 'h-[400px] w-full'/>
});

const DynamicBookingWrapper = dynamic(()=>import('@/components/properties/booking/BookingWrapper'),{
  ssr:false,
  loading:() => <Skeleton className="h-[200px] w-full"/>
});

async function PropertyDetailsPage({params}:{params:{id:string}}){
  const property = await fetchPropertyDetails(params.id);
  if(!property) redirect('/')
  const {baths, bedrooms, beds, guests} = property; 
  const {firstName,profileImage} = property.profile;
  const {userId} = auth();
  // relation between property and profile
  const isNotOwner = property.profile.clerkId !== userId

  // to summarize checking if the user is logged in by userId
  // if he is logged in Checking if he is not the owner
  // if he is not the owner checking if the review is already present 
  // if all conditions match then showing review button
  const reviewDoesNotExist = userId && isNotOwner && !(await findExistingReview(userId,property.id))

  console.log(property.bookings)

  // turning into a different object
  const details ={
    baths,
    bedrooms,
    beds,
    guests
  }


  return (

    <section>
      <BreadCrumbs name={property.name} />
      <header className="flex justify-between items-center mt-4">
        <h1 className="text-4xl font-bold capitalize">{property.tagline}</h1>

        <div className="flex items-center gap-x-4">
          { /* share button */ }
          <ShareButton name={property.name} propertyId={property.id} />
          <FavoriteToggleButton propertyId={property.id}/>
        </div>
      </header>
      
      <ImageContainer mainImage={property.image} name={property.name} />

      <section className="lg:grid lg:grid-cols-12 gap-x-12 mt-12">
        <div className="lg:col-span-8">
          <div className="flex gap-x-4 items-center">
            
            <h1 className="text-xl font-bold">{property.name}</h1>

            <PropertyRating inPage propertyId={property.id} />

          </div>
          <PropertyDetails details={details} />
          <UserInfo profile={{firstName,profileImage}}/>
          <Separator className="mt-4"/>
          <Description description={property.description} />
          <Amenities amenities={property.amenities} />
          <DynamicMap countryCode={property.country} />
        </div>
        <div className="lg:col-span-4 flex flex-col items-center">
          {/* calendar */}
          <DynamicBookingWrapper propertyId={property.id} price={property.price} bookings = {property.bookings} />
        </div>
      </section>

      {
        reviewDoesNotExist && <SubmitReview propertyId = {property.id} />
      }

      <PropertyReviews propertyId={property.id} />
    </section>
  )
}


export default PropertyDetailsPage
