import { useQueryClient } from '@tanstack/react-query'
import { LogOutIcon, UserIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useAuthStore } from '../store/auth.store'

export function UserMenu() {
  const userName = useAuthStore((state) => state.session?.user.name)
  const logout = useAuthStore((state) => state.logout)
  const queryClient = useQueryClient()

  const handleLogout = () => {
    logout()
    queryClient.clear()
  }

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm">
        <UserIcon className="size-4 text-muted-foreground" />
        <span className="max-w-40 truncate font-medium">{userName}</span>
      </span>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOutIcon />
        Cerrar sesión
      </Button>
    </div>
  )
}
