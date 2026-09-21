import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { config } from "./config";
import { useNoIndex } from "./lib";

const QR_URL = `https://iamdecoded.com/liza?key=${encodeURIComponent(config.hardwareKey.secret)}`;

export default function LizaPrint() {
  useNoIndex();
  const [qr, setQr] = useState("");

  useEffect(() => {
    QRCode.toString(QR_URL, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, []);

  const code = config.otp.code;

  return (
    <div className="lz-print min-h-screen bg-white px-6 py-8 text-black">
      <style>{`
        .lz-print { font-family: "IBM Plex Sans", Arial, sans-serif; }
        .lz-print svg { width: 100%; height: 100%; }
        .lz-cut { border: 1.5px dashed #999; border-radius: 10px; }
        @media print {
          @page { margin: 12mm; }
          body { background: #fff !important; }
          .lz-noprint { display: none !important; }
        }
      `}</style>

      <div className="lz-noprint mx-auto mb-6 max-w-2xl rounded-lg bg-neutral-100 p-4 text-sm text-neutral-700">
        Это страница для тебя, не для Лизы. Распечатай (Ctrl+P), вырежи по пунктиру и спрячь.
        <br />
        QR ведёт на: <span className="break-all font-mono">{QR_URL}</span>
        <div className="mt-3 flex gap-3">
          <button onClick={() => window.print()} className="rounded bg-black px-4 py-2 text-white">
            Распечатать
          </button>
          <a href="/liza?debug=1" className="rounded border border-black px-4 py-2">
            К квесту (debug)
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-2xl gap-8 sm:grid-cols-2">
        {/* OTP card */}
        <div className="lz-cut flex flex-col items-center p-6 text-center">
          <p className="text-xs text-neutral-500">{config.meta.orgName}</p>
          <p className="mt-1 text-sm font-semibold">Одноразовый код доступа</p>
          <p className="mt-5 font-mono text-4xl font-bold tracking-[0.25em]">
            {code.slice(0, 3)} {code.slice(3)}
          </p>
          <p className="mt-5 text-xs text-neutral-500">Действителен один раз. Никому не сообщай.</p>
        </div>

        {/* QR key */}
        <div className="lz-cut flex flex-col items-center p-6 text-center">
          <p className="text-xs text-neutral-500">{config.meta.orgName}</p>
          <p className="mt-1 text-sm font-semibold">Аппаратный ключ безопасности</p>
          <div className="mt-4 h-40 w-40" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="mt-3 text-xs text-neutral-500">Отсканируй камерой телефона</p>
          <p className="mt-1 font-mono text-xs">S/N {config.hardwareKey.secret}</p>
        </div>
      </div>
    </div>
  );
}
