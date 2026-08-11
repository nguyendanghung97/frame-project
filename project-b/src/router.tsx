import { createBrowserRouter } from 'react-router-dom'
import { AppFrame } from './frame'
import { HomePage, AboutPage } from './pages'

// 2. Router setup
const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppFrame />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      }
    ]
  }
])

export default AppRouter
