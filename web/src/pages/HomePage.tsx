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
    <div className="min-h-screen bg-green-50 flex flex-col items-center">
      {/* Top Navigation */}
      <header className="w-full max-w-5xl flex justify-between items-center py-6 px-4">
        <div className="text-3xl font-extrabold text-green-600">Entix</div>

        <button className="px-5 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition">
          Login
        </button>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mt-10 px-6">
        <div className="max-w-lg">
          <h1 className="text-5xl font-extrabold text-green-700 leading-tight">
            Learn Smarter.
            <br />
            Grow Faster.
          </h1>

          <p className="mt-4 text-lg text-gray-700">
            Your personalized learning companion — built to help you reach
            mastery with fun, science-powered practice.
          </p>

          <button className="mt-6 px-8 py-3 bg-green-600 text-white font-bold rounded-full text-lg hover:bg-green-700 transition shadow-md">
            Get Started
          </button>

          <p className="mt-6 text-md text-gray-600">
            Server Message:{" "}
            <span className="font-semibold text-green-700">{message}</span>
          </p>
        </div>

        {/* Illustration */}
        <div className="mt-10 md:mt-0">
          <div className="w-72 h-72 bg-green-500 rounded-full flex items-center justify-center shadow-xl">
            <span className="text-white text-7xl">🦉</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-5xl grid md:grid-cols-3 gap-6 mt-20 px-6 mb-24">
        <div className="bg-white rounded-3xl p-6 shadow hover:shadow-lg transition">
          <h3 className="text-xl font-bold text-green-700 mb-2">
            Smart Practice
          </h3>
          <p className="text-gray-600">
            Adaptive exercises that match your skill level.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow hover:shadow-lg transition">
          <h3 className="text-xl font-bold text-green-700 mb-2">
            Instant Feedback
          </h3>
          <p className="text-gray-600">
            Understand mistakes instantly and learn the right way.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow hover:shadow-lg transition">
          <h3 className="text-xl font-bold text-green-700 mb-2">
            Track Progress
          </h3>
          <p className="text-gray-600">
            Visualize your growth with daily analytics.
          </p>
        </div>
      </section>
    </div>
  );
};
