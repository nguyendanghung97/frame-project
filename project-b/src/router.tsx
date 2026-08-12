import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppFrame } from './frame'
import { HomePage, AboutPage } from './pages'

/** Redirect to default page. */
function NavigateToHome() {
  return <Navigate to="/home" replace />
}

const routes = [
  {
    index: true,
    element: <NavigateToHome />,
  },
  {
    path: '/',
    element: <AppFrame />,
    children: [
      {
        index: true,
        element: <NavigateToHome />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
]

const AppRouter = createBrowserRouter(routes, { basename: '/frame-project/project-b/' })

export default AppRouter
