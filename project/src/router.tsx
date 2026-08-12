import { createBrowserRouter, Navigate } from 'react-router-dom'
import { buildUrlFragments, getAppState } from 'frame-common'
import { MainFrame } from './frame'
import { HomePage, NotFoundPage, PatientsPage, ConferencePage } from '@/pages'

/** Keep `pageParams` hash across redirects (RR `location.hash` is often stale). */
function NavigateKeepHash({ to, replace }: { to: string; replace?: boolean }) {
  const hash = buildUrlFragments(getAppState().pageParams)
  return <Navigate to={{ pathname: to, hash: hash || undefined }} replace={replace} />
}

const routes = [
  {
    index: true,
    element: <NavigateKeepHash to="/home" replace />,
  },
  {
    path: '/',
    element: <MainFrame />,
    children: [
      {
        index: true,
        element: <NavigateKeepHash to="home" replace />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'patients',
        element: <PatientsPage />,
      },
      {
        path: 'conference',
        element: <ConferencePage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

const AppRouter = createBrowserRouter(routes, { basename: '/frame-project/project/' })

export default AppRouter
