import '../styles/globals.css'
import Link from 'next/link'

function Marketplace({ Component, pageProps }) {
  return (
    <div className='navbar flex flex-col'>
      <nav className='flex flex-col justify-center items-center'>
       
        <div className='flex mt-4' >
        <svg class="absolute left-20 fill-current h-8 w-8 mr-2" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 22.1c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05zM0 38.3c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05z"/></svg>
          
          <Link href='/' className='text-center block border border-blue-500 rounded py-2 px-4 bg-blue-500 hover:bg-blue-700 text-white'>
             Home
          </Link>
          <Link href='/collectible' className='text-center block border border-white rounded hover:border-gray-200 text-blue-500 hover:bg-gray-200 py-2 px-4'>
              Create Collectible
          </Link>
          <Link href='/buy' className='text-center block border border-white rounded hover:border-gray-200 text-blue-500 hover:bg-gray-200 py-2 px-4'>
              Buy OCEAN
          </Link>
          <Link href='/review' className='block py-2 px-4 text-gray-400 cursor-not-allowed'>
              Ratings
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}



export default Marketplace