import { PackageIcon } from 'lucide-react'
import { Outlet } from 'react-router'
import { UserMenu } from '@/features/auth/components/user-menu'

export function AppLayout() {
  return (
    <div className="min-h-svh motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <span className="flex items-center gap-2 font-semibold">
            <PackageIcon className="size-5" />
            Inventario
          </span>
          <UserMenu />
        </div>
      </header>
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <Outlet />
      </div>
    </div>
  )
}
