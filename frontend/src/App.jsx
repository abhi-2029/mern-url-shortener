// import { useState } from "react";
// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// function App() {
//   const [url, setUrl] = useState("");
//   const [shortUrl, setShortUrl] = useState("");
//   const [copied, setCopied] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleShorten = async () => {
//     if (!url || loading) return;
//     setLoading(true);

//     try {
//       const res = await axios.post(`${API_BASE_URL}/shorten`, {
//         originalUrl: url,
//       });

//       setShortUrl(res.data.shortUrl);
//       setCopied(false);
//     } catch (err) {
//       console.log(err);
//       alert("Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCopy = () => {
//     navigator.clipboard.writeText(shortUrl);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
//       <h1 className="text-4xl font-bold mb-4 text-center">
//         URL SHORTENER
//       </h1>

//       <div className="flex flex-col gap-3 w-full max-w-3xl">
//         <input
//           type="text"
//           className="input input-success w-full"
//           placeholder="Enter long URL"
//           value={url}
//           onChange={(e) => setUrl(e.target.value)}
//         />

//         <button
//           onClick={handleShorten}
//           className="btn btn-primary w-full"
//           disabled={loading}
//         >
//           {loading ? "Loading..." : "Shorten"}
//         </button>
//       </div>

//       {shortUrl && (
//         <div className="flex flex-col items-center max-w-3xl w-full">
//           <p className="font-medium mb-2">Your short link:</p>

//           <a
//             href={shortUrl}
//             target="_blank"
//             rel="noreferrer"
//             className="link link-primary break-all"
//           >
//             {shortUrl}
//           </a>

//           <button
//             onClick={handleCopy}
//             className={`btn mt-2 w-full ${
//               copied ? "btn-success" : "btn-secondary"
//             }`}
//           >
//             {copied ? "Copied!" : "Copy"}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;




import { useState } from "react";
import axios from "axios";
import QRCodeGenerator from "qrcode";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState("");

  const handleShorten = async () => {
    if (!url || loading) return;

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/shorten`, {
        originalUrl: url,
      });

      const generatedShortUrl = res.data.shortUrl;

      setShortUrl(generatedShortUrl);
      setCopied(false);

      const qr = await QRCodeGenerator.toDataURL(generatedShortUrl);
      setQrImage(qr);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="text-4xl font-bold mb-4 text-center">
        URL SHORTENER
      </h1>

      <div className="flex flex-col gap-3 w-full max-w-3xl">
        <input
          type="text"
          className="input input-success w-full"
          placeholder="Enter long URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={handleShorten}
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Loading..." : "Shorten"}
        </button>
      </div>

      {shortUrl && (
        <div className="flex flex-col items-center max-w-3xl w-full">
          <p className="font-medium mb-2">Your short link:</p>

          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            className="link link-primary break-all"
          >
            {shortUrl}
          </a>

          <button
            onClick={handleCopy}
            className={`btn mt-2 w-full ${
              copied ? "btn-success" : "btn-secondary"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>

          {qrImage && (
            <div className="bg-white p-4 rounded-lg shadow-lg mt-6 flex flex-col items-center">
              <p className="text-center font-semibold mb-3 text-black">
                Scan QR Code
              </p>

              <img
                src={qrImage}
                alt="QR Code"
                className="w-48 h-48"
              />

              <a
                href={qrImage}
                download="qr-code.png"
                className="btn btn-accent mt-4 w-full"
              >
                Download QR Code
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;