import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as React from 'react'
import { DefaultCatchBoundary } from '../components/DefaultCatchBoundary'
import { NotFound } from '../components/NotFound'
import appCss from '../styles/app.css?url'
import { seo } from '../utils/seo'
import { getSupabaseServerClient } from '../utils/supabase'
import { Logo } from '~/components/Logo'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { LogOutIcon, UserIcon } from 'lucide-react'
import { Toaster } from '~/components/ui/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const fetchUser = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = await getSupabaseServerClient()
  const { data, error: _error } = await supabase.auth.getUser()

  if (!data.user?.email) {
    return null
  }

  return {
    id: data.user.id,
    email: data.user.email,
    app_metadata: data.user.app_metadata,
    user_metadata: data.user.user_metadata,
  }
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'TanStack Start | Type-Safe, Client-First, Full-Stack React Framework',
        description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  beforeLoad: async () => {
    const user = await fetchUser()

    return {
      user,
    }
  },
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    )
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
      <Toaster />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { user } = Route.useRouteContext()

  return (
    <html className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="p-2 px-6 flex gap-4 text-sm items-center">
          <Link
            to="/"
            activeProps={{
              className: 'font-bold',
            }}
            activeOptions={{ exact: true }}
          >
            <Logo size="sm" />
          </Link>{' '}
          <Link
            to="/listings"
            activeProps={{
              className: 'font-bold underline underline-offset-8',
            }}
            className="p-2 hover:underline underline-offset-8"
          >
            Listings
          </Link>
          <Link
            to="/analyze"
            activeProps={{
              className: 'font-bold underline underline-offset-8',
            }}
            className="p-2 hover:underline underline-offset-8"
          >
            Analyze
          </Link>
          <div className="ml-auto">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/logout" className="flex w-full items-center cursor-pointer">
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/login" className="flex items-center">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
        <hr />
        {children}
        <Scripts />
      </body>
    </html>
  )
}
