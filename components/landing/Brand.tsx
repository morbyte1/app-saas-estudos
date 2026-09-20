import Image from 'next/image'
import Link from 'next/link'

export default function Brand() {
  return (
    <Link href="/" aria-label="Revyza, página inicial" className="relative block h-14 w-40 shrink-0 overflow-hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0EEC6]">
      <Image src="/logo.png" alt="" width={216} height={216} priority className="absolute left-1/2 top-1/2 h-[216px] w-[216px] max-w-none -translate-x-1/2 -translate-y-1/2" />
    </Link>
  )
}
