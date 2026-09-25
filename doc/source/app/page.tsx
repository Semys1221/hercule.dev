"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { VolumeX, Volume2 } from "lucide-react"

export default function CreateAccountPage() {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 lg:p-8 bg-gradient-to-br from-amber-100 via-orange-50 to-teal-100">
      <div className="w-full max-w-[1000px] bg-background rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0 min-h-[700px]">
          {/* Left Side - Create Account Form */}
          <div className="flex flex-col items-center justify-center p-6 lg:p-10">
            <div className="w-full max-w-[420px] space-y-6">
              <div className="text-left">
                <h1 className="text-[32px] font-normal tracking-tight">
                  Create your account
                </h1>
              </div>

              <div className="space-y-4">
                {/* Google Sign Up Button */}
                <Button
                  variant="outline"
                  className="w-full h-[50px] bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl font-normal"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign up with Google
                </Button>

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-normal">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@email.com"
                    className="h-[50px] bg-background border border-border rounded-xl focus-visible:ring-1 text-[15px]"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[13px] font-normal">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-[50px] bg-background border border-border rounded-xl focus-visible:ring-1 text-[15px]"
                  />
                </div>

                {/* Create Account Button */}
                <Button className="w-full h-[50px] bg-primary text-primary-foreground hover:bg-primary/90 font-normal rounded-xl text-[15px]">
                  Create account
                </Button>

                {/* Already have account link */}
                <div className="text-center pt-1">
                  <button className="text-[14px] font-normal text-muted-foreground hover:text-foreground transition-colors">
                    Already have an account?
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Image Section */}
          <div className="relative lg:rounded-[2rem] m-0 lg:m-4 overflow-hidden">
            
            {/* Background Image */}
            <img
              src="/headphone.jpg"
              alt="Stylish portrait with headphones and sunglasses"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Bottom Caption/Description Card */}
            <div className="absolute bottom-6 left-6 right-6 bg-background rounded-2xl shadow-lg p-4 space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                Modern minimalist portrait featuring premium wireless headphones and sleek sunglasses against a gradient teal background.
              </p>
              
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Inspiration</span>
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <span className="text-sm font-medium">1UI.dev 1.0</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                <button className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-colors ml-auto">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Try 1UI.dev for free
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
