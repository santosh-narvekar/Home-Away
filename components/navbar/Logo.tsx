import React from 'react'
import { LuTent } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { buttonVariants } from '../ui/button';
import { Icon } from '@radix-ui/react-select';
function Logo() {
  return (
    <Button size="icon"  className={'bg-primary'} asChild>
     <Link href={'/'}>
        <LuTent className='w-6 h-6'/>
      </Link>
    </Button>
  )
}

export default Logo
