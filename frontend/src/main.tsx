import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { router } from "./Routes";
import { TelegramAuthWrapper } from "./components/TelegramAuthWrapper";
import { ToastContainer } from "./components/Shared/Toast";
import "./index.css"
import '../src/i18n.js'


const client = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <QueryClientProvider client={client}>
      <TelegramAuthWrapper>
        <RouterProvider router={router} />
      </TelegramAuthWrapper>
      <ToastContainer />
    </QueryClientProvider>
  </Provider>
)
