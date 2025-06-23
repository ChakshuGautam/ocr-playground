"use client"

import { UserButton, useUser } from "@clerk/nextjs"

export function UserNav() {
  const { user } = useUser()
  if (!user) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-600" aria-label="User greeting">
        Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress || 'User'}
      </div>
      <UserButton 
        afterSignOutUrl="/"
        aria-label="User menu"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          }
        }}
      />
    </div>
  )
} 