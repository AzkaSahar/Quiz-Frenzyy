"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface QuestionConfig { points: number }
interface QuizData { quizId: string; title:string ; message: string }

export default function AIQuizPage() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(10);
  const [numQuestions, setNumQuestions] = useState(1);
  const [questionConfigs, setQuestionConfigs] = useState<QuestionConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  useEffect(() => {
    setQuestionConfigs((prev) => {
      const newConfigs = [...prev];
      if (newConfigs.length < numQuestions) {
        for (let i = newConfigs.length; i < numQuestions; i++) {
          newConfigs.push({ points: 10 });
        }
      } else {
        newConfigs.length = numQuestions;
      }
      return newConfigs;
    });
  }, [numQuestions]);

  async function handleGenerateQuiz() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/ai-quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topic, numQuestions, duration, questionConfigs }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setQuizData({ quizId: data.quizId,title: data.title, message: data.message });
      } else {
        setMessage(`Error: ${data.error || "Failed to generate quiz"}`);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessage("Failed to generate quiz");
    }
  }

  return (
    <>
      <Header />
      <div className="flex justify-center items-center min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 py-6">
        <div className="bg-[#242424] p-6 sm:p-10 rounded-[30px] shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl text-center">
          <div className="bg-[#333436] rounded-[30px] p-6 sm:p-10">
            <h1 className="text-4xl text-white mb-4">
              Generate <span className="text-[#ec5f80]">AI-Powered</span> Quiz
            </h1>
            <p className="text-gray-400 mb-6">
              Note: All questions will be{" "}
              <span className="font-semibold">multiple choice</span>.
            </p>

            {/* Topic */}
            <input
              type="text"
              placeholder="Enter Quiz Topic (e.g. JavaScript, Biology)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full text-center p-1 sm:p-2 md:p-2 mb-2 rounded-full bg-[#1e1e1e] text-white text-xs sm:text-sm md:text-base placeholder-gray-400 border border-[#ff3c83] truncate focus:outline-none focus:ring-2 focus:ring-[#ec5f80]"
            />

            {/* Duration & Count */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 mb-1 text-sm sm:text-base">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full text-center p-1 sm:p-2 rounded-full bg-[#1e1e1e] text-white text-xs sm:text-sm md:text-base placeholder-gray-400 border border-[#ff3c83] focus:outline-none focus:ring-2 focus:ring-[#ec5f80]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-sm sm:text-base">
                  No. of Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full text-center p-1 sm:p-2 rounded-full bg-[#1e1e1e] text-white text-xs sm:text-sm md:text-base placeholder-gray-400 border border-[#ff3c83] focus:outline-none focus:ring-2 focus:ring-[#ec5f80]"
                />
              </div>
            </div>

            {/* Question Configs */}
            <div className="mt-6 bg-[#1e1e1e] p-4 rounded-lg max-h-[300px] overflow-y-auto">
              <h3 className="text-[#ec5f80] text-xl">Configure Each Question&apos;s Points</h3>
              <div className="space-y-3 mt-4">
                {questionConfigs.map((config, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#242424] p-3 rounded-lg">
                    <p className="text-gray-400">Question {idx + 1}</p>
                    <input
                      type="number"
                      min={1}
                      value={config.points}
                      onChange={(e) => {
                        const pts = Number(e.target.value);
                        setQuestionConfigs((prev) => {
                          const copy = [...prev];
                          copy[idx] = { points: pts };
                          return copy;
                        });
                      }}
                      className="w-20 text-center p-2 rounded-full bg-[#1e1e1e] text-white text-sm placeholder-gray-400 border border-[#ff3c83] focus:outline-none focus:ring-2 focus:ring-[#ec5f80]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Generate */}
            <button
              onClick={handleGenerateQuiz}
              disabled={loading}
              className="mt-6 w-[80%] sm:w-3/4 md:w-2/3 mx-auto flex justify-center items-center px-4 py-3 border-2 border-[#ff3c83] text-[#ff3c83] rounded-full overflow-hidden relative transition-all duration-150 ease-in hover:text-white hover:border-white before:absolute before:top-0 before:left-1/2 before:right-1/2 before:bottom-0 before:bg-gradient-to-r before:from-[#fd297a] before:to-[#9424f0] before:opacity-0 before:transition-all before:duration-150 before:ease-in hover:before:left-0 hover:before:right-0 hover:before:opacity-100"
            >
              <span className="relative z-10 text-sm sm:text-base md:text-lg">
                {loading ? "Generating..." : "Generate Quiz"}
              </span>
            </button>

            {message && <p className="text-red-500 mt-4">{message}</p>}

            {quizData && (
              <div className="bg-[#1e1e1e] p-6 rounded-lg mt-6 text-center">
                <h2 className="text-xl text-[#ec5f80]">Quiz Created Successfully!</h2>
                <p className="text-gray-400">
                  Quiz title: <span className="text-white">{quizData.title}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  You can start the quiz later from the{" "}
                  <span className="text-[#ec5f80] font-medium">&quot;Hosted Quizzes&quot;</span> section in your collection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}