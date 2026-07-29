import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainFrame } from './frame'
import { HomePage, NotFoundPage, PatientsPage } from '@/pages'

const routes = [
  {
    index: true,
    element: <Navigate to="app/home" replace />,
  },
  {
    path: 'app',
    element: <MainFrame />,
    children: [
      {
        index: true,
        element: <Navigate to="home" replace />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'patients',
        element: <PatientsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]

const AppRouter = createBrowserRouter(routes)

export default AppRouter
