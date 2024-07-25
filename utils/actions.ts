'use server'

import { createReviewSchema, imageSchema, profileSchema, propertySchema, validateWithZodSchema } from "./schemas";
import db from './db';
import {  clerkClient, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { uploadImage } from "./supabase";
import { calculateTotals } from "./calculateTotals";
import { devNull } from "os";
import { formatDate } from "./format";

const getAuthUser = async() => {
  const user = await currentUser();
  if(!user) throw new Error('You must be logged in to access this route'); 
  if(!user.privateMetadata.hasProfile) redirect('/profile/create')
  return user; 
}

// checking for admin user
const getAdminUser = async() => {
  const user = await getAuthUser();
  if(user.id !== process.env.ADMIN_USER_ID) redirect('/');
  return user;
}

const renderError = (error:unknown)=>{
  console.log(error)
  return {message:error instanceof Error?error.message:'there was an error'};
} 


export const createProfileAction = async (prevState:any,formData:FormData) => {
  try{
    const user = await currentUser();
    if(!user) throw new Error('Please login to create a profile');
    const rawData = Object.fromEntries(formData);
    // returns a object (object must be filled with full type information) or throws error using parse method
    //const validatedFields = profileSchema.parse(rawData);
    const validatedFields = validateWithZodSchema(profileSchema,rawData)

    await db.profile.create({
      data:{
        clerkId:user.id,
        email:user.emailAddresses[0].emailAddress,
        profileImage:user.imageUrl ?? '',
        ...validatedFields
      }
    })

    clerkClient.users.updateUserMetadata(user.id,{
      privateMetadata:{
        hasProfile:true
      }
    })
  }catch(error){
    return renderError(error)
  }

  redirect('/')
}

export const fetchProfileImage = async() => {
  const user = await currentUser();
  if(!user) return null;

  const profile = await db.profile.findUnique({
    where:{
      clerkId:user.id
    },
    select:{
      profileImage:true
    }
  });
  
  return profile?.profileImage;
}

export const fetchProfile = async() =>{
  const user = await getAuthUser();
  
  const profile = await db.profile.findUnique({
    where:{
      clerkId:user.id
    }
  })

  if(!profile) redirect('/profile/create');
  return profile
}

export const updateProfileAction = async(prevState:any,formData:FormData):Promise<{message:string}> => {
  const user = await getAuthUser();
  try{
    const rawData = Object.fromEntries(formData);
    const validatedFields = validateWithZodSchema(profileSchema,rawData)

    await db.profile.update({
      where:{
        clerkId:user.id
      },
      data:validatedFields
    })

    // to immediately update data
    revalidatePath('/profile');

    return {message:'profile updated successfully!'}
  }catch(error){
    return renderError(error)
  }

}

export const updateProfileImageAction = async (
  prevState: any,
  formData: FormData
): Promise<{ message: string }> => {

  const user = await getAuthUser();
  try{
    const image = formData.get('image') as File;
    const validatedFields = validateWithZodSchema(imageSchema,{image});

    
    const fullPath = await uploadImage(validatedFields.image);
    
    await db.profile.update({
      where:{
        clerkId:user.id
      },
      data:{
        profileImage:fullPath
      }
    });

    revalidatePath('/profile');
    return { message: 'Profile image updated successfully' };

  }catch(error){
    return renderError(error);
  }

};

export const createPropertyAction = async (prevState:any,formData:FormData):Promise<{message:string}> => {
  const user = await getAuthUser();
  try{
    const rawData = Object.fromEntries(formData);
    const image = formData.get('image') as File;

    const validatedFields = validateWithZodSchema(propertySchema,rawData);

    // validating image seperately
    const validatedFile = validateWithZodSchema(imageSchema,{image})

    // getting the image Path from supabase after uploading
    const fullPath = await uploadImage(validatedFile.image);


    await db.property.create({
      data:{
        ...validatedFields,
        image:fullPath,
        profileId:user.id
      }
    })

  }catch(error){
     return renderError(error)
  }

  redirect('/')
}


export const fetchProperties = async({search='',category}:{search?:string,category?:string}) => {
  const properties = await db.property.findMany({
    where:{
      category,
      // this value will be undefined meaning all properties will be grabbed if not provided
      OR:[
        // search is set to empty initially because if it is undefined no properties will be returned thats how prisma works 
        {name:{contains:search,mode:'insensitive'}},
        {tagline:{contains:search,mode:'insensitive'}},
      ]
    },
    select:{
      id:true,
      name:true,
      tagline:true,
      country:true,
      price:true,
      image:true
    },
    // grouping properties
    orderBy:{
      createdAt:'desc'
    }
  })

  return properties
}

export const fetchFavoriteId = async(propertyId:string) => { 
  const user = await getAuthUser();
  const favorite = await db.favorite.findFirst({
    where:{
      propertyId,
      profileId:user.id
    },select:{
      id:true
    }
  })  
  return favorite?.id || null
}

export const toggleFavoriteAction = async(prevState:{
  propertyId:string,
  favoriteId:string | null,
  pathname:string
})=>{
  const user = await getAuthUser();
  const {propertyId,favoriteId,pathname} = prevState;

  try{
    if(favoriteId){
      await db.favorite.delete({
        where:{
          id:favoriteId
        }
      })
    }else{
      await db.favorite.create({
        data:{
          propertyId,
          profileId:user.id,
        }
      })
    }
   
    // revalidating cache for multiple pages : favorites,property details and homePage : optional
    revalidatePath(pathname);
 
    return {message:favoriteId?'Removed from Faves':'Added to Faves'}
    
  }catch(error){
    return renderError(error)
  }

}

export const fetchFavorites = async() =>{
  const user = await getAuthUser();
  const favorites = await db.favorite.findMany({
    where:{
      profileId:user.id,
    },
    select:{
      property:{
        select:{
          id:true,
          name:true,
          tagline:true,
          country:true,
          price:true,
          image:true
        }
      }
    }
  })

  return favorites.map((favorite) => favorite.property)
}


export const fetchPropertyDetails = (id:string) => {
  // looking for a unique property
  return db.property.findUnique({
    where:{
      id
    },include:{
      // including all profile properties
      profile:true,
      bookings:{
        select:{
          // values to disable dates
          checkIn:true,
          checkOut:true
        }
      }
    }
  })
}


export const createReviewAction = async (prevState:any,formData:FormData) => {
  const user = await getAuthUser();
  try{
    const rawData = Object.fromEntries(formData);
    const validatedFields = validateWithZodSchema(createReviewSchema,rawData);

    await db.review.create({
      data:{
        ...validatedFields,
        profileId:user.id
      }
    });
    revalidatePath(`/properties/${validatedFields.propertyId}`)
    return { message: 'review submitted successfully!' };
  }catch(error){
    return renderError(error);
  }

};

export const fetchPropertyReviews = async (propertyId:string) => {
  const reviews = await db.review.findMany({
    where:{
      propertyId,
    },
    select:{
      id:true,
      rating:true,
      comment:true,
      profile:{
        select:{
          firstName:true,
          profileImage:true
        }
      }
    },
    orderBy:{
      createdAt:'desc'
    }
  },)

  return reviews;
};

export const fetchPropertyReviewsByUser = async () => {
  const user = await getAuthUser();
  const reviews = await db.review.findMany({
    where:{
      // the user whose id will be in the profileId of reviews 
      profileId:user.id
    },
    select:{
      id:true,
      rating:true,
      comment:true,
      property:{
        select:{
          name:true,
          image:true
        }
      }
    }
  })
  return reviews;
};

export const deleteReviewAction = async (prevState:{reviewId:string}) => {
  const {reviewId} = prevState;
  const user = await getAuthUser();
  try{
    // deleting a review where id matches review id and current user id matches profile Id present in review which was added while creating it
    await db.review.delete({
      where:{
        id:reviewId,
        profileId:user.id
      }
    });

    // in order to see latest changes
    revalidatePath('/');
    return { message: 'Review deleted successfully' };
  }catch(err){
    return renderError(err);
  }
};


export async function fetchPropertyRating(propertyId:string){
  const result = await db.review.groupBy({
    by:['propertyId'],
    _avg:{
      rating:true
    },
    _count:{
      rating:true
    },
    where:{
      propertyId,
    }
  })

  console.log(result)
  return {rating:result[0]?._avg.rating ?? 0,count:result[0]?._count.rating ?? 0 }
}

// review protect functionalities

export const findExistingReview = async(userId:string,propertyId:string) => {
  return db.review.findFirst({
    where:{
      profileId:userId,
      propertyId:propertyId
    }
  })
}

export const createBookingAction = async(prevState:{propertyId:string,checkIn:Date,checkOut:Date})=>{
  const user = await getAuthUser();

  // deleting bookings where payment status is false
  await db.booking.deleteMany({
    where:{
      profileId:user.id,
      paymentStatus:false
    }
  })

  let bookingId: null | string = null;
  const {propertyId,checkIn,checkOut} = prevState;

  const property = await db.property.findUnique({
    where:{
      id:propertyId
    },select:{
      price:true
    }
  });

  if(!property) return {message:'Property not found!'}; 

  const {orderTotal,totalNights} = calculateTotals({
    checkIn,checkOut,price:property.price
  })

  try{
    const booking = await db.booking.create({
      data:{
        checkIn,
        checkOut,
        orderTotal,
        totalNights,
        profileId:user.id,
        propertyId
      }
    })
    bookingId = booking.id
  }catch(error){
    return renderError(error);
  }

  redirect(`/checkout?bookingId=${bookingId}`);
}


export const fetchBookings = async() => {
  const user = await getAuthUser();
  const bookings = await db.booking.findMany({
    where:{
      profileId:user.id,
      paymentStatus:true
    },
    include:{
      property:{
        select:{
          id:true,
          name:true,
          country:true
        }

      }
    },
    orderBy:{
      createdAt:'desc',
    }
  });
  return  bookings;
}

export const deleteBookingAction = async(prevState:{bookingId:string}) => {
  const { bookingId } = prevState;
  const user = await getAuthUser();
  try{
    const result = await db.booking.delete({
      where:{
        id:bookingId,
        profileId:user.id
      },
    });
    revalidatePath('/bookings');
    return {message:'Booking deleted successfully'}
  }catch(error){
    return renderError(error);
  }
}

export const fetchRentals = async() => {
  const user = await getAuthUser();

  const rentals = await db.property.findMany({
    where:{
      profileId:user.id
    },
    select:{
      id:true,
      name:true,
      price:true
    }
  })
  // [{id,name,price},{id,name,price}]
  const rentalsWithBookingSums = await Promise.all(
    
    rentals.map(async(rental) => {
      
      const totalNightSum = await db.booking.aggregate({
        where:{
          propertyId:rental.id,
          paymentStatus:true
        },
        _sum:{
          totalNights:true
        },
      });

      const orderTotalSum = await db.booking.aggregate({
        where:{
          propertyId:rental.id,
          paymentStatus:true
        },
        _sum:{
          orderTotal:true
        }
      });

      return {
        ...rental,
        totalNightsSum:totalNightSum._sum.totalNights,
        orderTotalsSum:orderTotalSum._sum.orderTotal
      }
    })

  )

  return rentalsWithBookingSums
}

export const deleteRentalAction = async(prevState:{propertyId:string}) => {
  const {propertyId}=prevState;
  const user = await getAuthUser();
  try{
    await db.property.delete({
      where:{
        id:propertyId,
        profileId:user.id
      }
    });
    revalidatePath('/rentals');
    return {message:'Rental deleted successfully!'}
  }catch(error){
    return renderError(error);
  }
}

// looking for Unique Property to update
export const fetchRentalDetails = async(propertyId:string) =>{
  const user = await getAuthUser();
  return db.property.findUnique({
    where:{
      id:propertyId,
      profileId:user.id
    },
  });
}

export const updatePropertyAction = async(prevState:any,formData:FormData):Promise<{message:string}> =>{
  const user = await getAuthUser();
  const propertyId = formData.get('id') as string;
  try{
    const rawData = Object.fromEntries(formData);
 
    const validatedFields = validateWithZodSchema(propertySchema,rawData);
    await db.property.update({
      where:{
        id:propertyId,
        profileId:user.id
      },
      data:{
        ...validatedFields,
      }
    })

    revalidatePath(`/rentals/${propertyId}/edit`);
    return {message:'Update Successful'}
  }catch(error){
    return renderError(error);
  }
}

export const updatePropertyImageAction = async(prevState:any,formData:FormData):Promise<{message:string}>=>{
  const user = await getAuthUser();
  const propertyId = formData.get('id') as string;

  try{
    const image = formData.get('image') as File;

    const validatedFields = validateWithZodSchema(imageSchema,{image});

    const fullPath = await uploadImage(validatedFields.image);
    
    await db.property.update({
      where:{
         id:propertyId,
         profileId:user.id
      },
      data:{
        image:fullPath
      }
    })

    revalidatePath(`/rentals/${propertyId}/edit`);
    return {message:'Image Update Successful'}

  }catch(error){
    return renderError(error);
  }
}

// specific booking where property profileId matches userId
export const fetchReservations = async () => {
  const user = await getAuthUser();
  
    const reservation = await db.booking.findMany({
      where:{
        paymentStatus:true,
        property:{
          profileId:user.id
        }
      },
      orderBy:{
        // displaying most recent bookings by me
        createdAt:'desc'
      },
      include:{
        property:{
          select:{
            id:true,
            name:true,
            price:true,
            country:true
          }
        }
      }
    });

    console.log(reservation);
    return reservation;
  
}


export const fetchStats = async() => {
  await getAdminUser();

  const usersCount = await db.profile.count();
  const propertiesCount = await db.property.count();
  const bookingsCount = await db.booking.count({
    where:{
      paymentStatus:true
    }
  });

  return {
    usersCount,
    propertiesCount,
    bookingsCount
  }
}

export const fetchChartsData = async() => {
  await getAdminUser();
  const date = new Date();
  date.setMonth(date.getMonth() - 6)

  const sixMonthsAgo = date;
  //  Jan 25 2024 

  // fetching bookings where created at greater than six months ago

  const bookings = await db.booking.findMany({
    where:{
      paymentStatus:true,
      createdAt:{
        gte:sixMonthsAgo
      }
    },
    orderBy:{
      createdAt:'asc'
    }
  })

  console.log(bookings);

  let bookingsPerMonth = bookings.reduce((total,current)=>{
    const date = formatDate(current.createdAt,true);
    const existingEntry = total.find((entry) => entry.date === date);

    if(existingEntry) existingEntry.count += 1

    else {
      total.push({date,count:1})
    }

    return total;
  },[] as Array<{date:string,count:number}>);

  console.log(bookingsPerMonth)
  return bookingsPerMonth
}

export const fetchReservationStats = async() =>{
  const user = await getAuthUser();
  
  const properties = await db.property.count({
    where:{
      profileId:user.id
    }
  });

  const totals = await db.booking.aggregate({
    _sum:{
      orderTotal:true,
      totalNights:true
    },
    where:{
      property:{
        profileId:user.id
      }
    }
  });

  return {properties,nights:totals._sum.totalNights || 0,amount:totals._sum.orderTotal || 0}
}