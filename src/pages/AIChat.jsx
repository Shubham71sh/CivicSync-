import { useState } from "react";
import { Send, Mic, Volume2 } from "lucide-react";
import { sendMessage } from "../services/api";

export default function AIChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");

  const speechLanguages = {
    en: "en-US",
    hi: "hi-IN",
    pa: "hi-IN",
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = speechLanguages[language];
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
    };
  };

  const speakText = (text) => {
    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = speechLanguages[language];
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentMessage = message;

    setMessage("");
    setLoading(true);

    try {
      const aiResponse = await sendMessage(
        currentMessage,
        language
      );

      speakText(aiResponse);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: aiResponse,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Error connecting to AI.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-[85vh] flex flex-col">
      <h1 className="text-3xl font-bold text-white mb-4">
        CivicSync AI Assistant
      </h1>

      <div className="mb-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="p-2 rounded border text-black"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="pa">Punjabi</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto border rounded-xl p-4 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${
              msg.role === "user"
                ? "text-right"
                : "text-left"
            }`}
          >
            <div className="inline-block px-4 py-2 rounded-xl border text-white">
              <div className="flex items-center gap-2">
                <span>{msg.text}</span>

                {msg.role === "assistant" && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="text-blue-400"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-left">
            <div className="inline-block px-4 py-2 rounded-xl border text-white">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Ask about laws, policies, benefits..."
          className="flex-1 p-3 rounded-xl border text-black"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />

        <button
          onClick={startListening}
          className="px-4 rounded-xl bg-green-600 text-white hover:bg-green-700"
        >
          <Mic size={18} />
        </button>

        <button
          onClick={handleSend}
          className="px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}