'use client';
import { Input } from '../ui/input';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useState, useEffect } from 'react';

function NavSearch() {

  const searchParams = useSearchParams();

  const pathname = usePathname();
  const {replace} = useRouter();

  const [search,setSearch] = useState(searchParams.get('search')?.toString() || '');
  
  const handleSearch = useDebouncedCallback((value:string) => {
    const params = new URLSearchParams(searchParams);
    if(value){
      // search param will be equal to whatever that will be typed in input
      params.set('search',value);
    }else{
      // if no value then in that case search param would be deleted
      params.delete('search')
    }
    // replace the current url with this and we dont affect category search param at all in this case
    //replace(`${pathname}?${params}`)
    replace(`/${params.toString()}`)
  },500);

  useEffect(()=>{
    if(!searchParams.get('search')) setSearch('');
  },[searchParams.get('search')]);

  return (
    <Input
    type='text'
    placeholder='find a property...'
    className='max-w-xs dark:bg-muted'
    value ={search}
    onChange= {(e) => {
      setSearch(e.target.value);
      handleSearch(e.target.value)
    }}
    />

  )
}

export default NavSearch
