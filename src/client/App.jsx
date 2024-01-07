import { Toaster } from 'sonner';
import { RouterProvider } from 'react-router-dom';
import { browserRouter } from './routes/browserRouter';
import { AccountProvider } from './store/accountContext';

function App() {
  return (
    <AccountProvider>
      <div className="fade-in">
        <RouterProvider router={browserRouter} />
        <Toaster />
      </div>
    </AccountProvider>
  );
}


export default App;
