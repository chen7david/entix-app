import { useEffect, useState } from "react";

export const HomePage = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/v1/message")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch message");
        return res.text();
      })
      .then((text) => setMessage(text))
      .catch((err) => setMessage(`Error: ${err.message}`));
  }, []);

  return (
    <div>
      Water is here and there
      <h1 className="text-xl">Welcome to the Home Page</h1>
      <p>This is the main landing page of the application.</p>
      <p className="text-2xl">Message from server: {message}</p>
    </div>
  );
};
