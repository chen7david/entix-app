import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { SHARED_GREETING, userSchema } from '@shared/index'
import type { UserDTO } from "@shared/index";

function App() {

  const [user, setUser] = useState<UserDTO | null>(null);



  const verifyUser = () => {

    const user: UserDTO = userSchema.parse({
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
    });

    setUser(user);
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={verifyUser}>
          {SHARED_GREETING}
          {user?.name}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
