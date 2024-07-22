import React from 'react'
import UserIcon from './UserIcon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button'
import { LuAlignLeft } from 'react-icons/lu'
import Link from 'next/link';
import { links } from '@/utils/links'
import SignOutLink from './SignOutLink';
import { SignedOut,SignedIn ,SignInButton , SignUpButton } from '@clerk/nextjs';

function LinksDropdown() {
  return (
    <DropdownMenu>


      <DropdownMenuTrigger asChild>
    
        <Button variant={'outline'} className='flex gap-4 max-w-[100px]'>
          <LuAlignLeft className='w-6 h-6 '/>
          <UserIcon />
        </Button>

      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-52' align='center' sideOffset={10}>

        <SignedOut >
          <DropdownMenuItem>
            <SignInButton mode="modal" >
              <button className='w-full text-left'>Login</button>
            </SignInButton>
      
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
      
            <SignUpButton mode='modal'>
              <button className='w-full text-left'>Register</button>
            </SignUpButton>
      
          </DropdownMenuItem>
        </SignedOut>

        <SignedIn>
          {
            links.map((link)=>{
              return <DropdownMenuItem key={link.href}>
                <Link href={link.href} className='w-full capitalize' >
                {link.label}
                 </Link>
              </DropdownMenuItem>
            })
          }
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <SignOutLink />
          </DropdownMenuItem>
        </SignedIn>
      
      </DropdownMenuContent>  
    </DropdownMenu>
  )
}

export default LinksDropdown
