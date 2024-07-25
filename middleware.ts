import {clerkMiddleware,createRouteMatcher} from "@clerk/nextjs/server"
import { NextResponse } from "next/server";

/*
const isProtectedRoute = createRouteMatcher([
  '/bookings(.*)',
  '/checkout(.*)',
  '/favorites(.*)',
  '/profile(.*)',
  '/rentals(.*)',
  '/reviews(.*)'
])
*/

const isPublicRoute = createRouteMatcher(['/','/properties(.*)'])

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // every request will pass through this middleware
 // if (isProtectedRoute(req)) auth().protect();
 
 const isAdminUser = auth().userId === process.env.ADMIN_USER_ID;

 if(isAdminRoute(req) && !isAdminUser){
  // navigating to the home page
  return NextResponse.redirect(new URL('/',req.url))
 }

 if(!isPublicRoute(req)) auth().protect();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};