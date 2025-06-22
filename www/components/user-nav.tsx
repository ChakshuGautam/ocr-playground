"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function UserNav() {
  const { user } = useUser()

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-600">
        Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
      </div>
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          }
        }}
      />
    </div>
  )
} 