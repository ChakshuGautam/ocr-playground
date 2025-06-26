import Link from "next/link"
import { Search, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"

interface HeaderProps {
  title: string
  navigation?: Array<{ name: string; href: string; active?: boolean }>
  showSearch?: boolean
}

export function Header({ title, navigation, showSearch }: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-black text-white">
              <span className="text-sm font-bold">📊</span>
            </div>
            {title}
          </Link>

          {navigation && (
            <nav className="flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                    item.active ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search" className="w-64 pl-10" />
            </div>
          )}

          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>

          <UserNav />
        </div>
      </div>
    </header>
  )
}
