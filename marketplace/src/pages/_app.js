import '../styles/globals.css'
import Link from 'next/link'

function Marketplace({ Component, pageProps }) {
  return (
    <div className='flex flex-col'>
      <nav className='flex flex-col justify-center items-center'>
        <p className='text-4xl font-bold text-green-700' >OpeanOcean Collectible Marketplace</p>
        <div className='flex mt-4'>
          <Link href='/'>
             Marketplace
          </Link>
          <Link href='/collectible'>
              Create Collectible
          </Link>
          <Link href='/modal'>
              Test Modal
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default Marketplace