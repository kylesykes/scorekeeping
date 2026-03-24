import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import styles from "./ShareModal.module.css";

export default function ShareModal({ code, onDismiss }) {
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my Tally game!", url });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.label}>Scan or share to invite players</p>
        <div className={styles.qrWrapper}>
          <QRCodeSVG
            value={url}
            size={180}
            bgColor="transparent"
            fgColor="#ffffff"
            level="M"
          />
        </div>
        <div className={styles.codeDisplay}>
          {code.split("").map((char, i) => (
            <div key={i} className={styles.codeChar}>
              {char}
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleCopy}>
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button className={styles.actionBtn} onClick={handleShare}>
            Share
          </button>
        </div>
        <button className={styles.dismissBtn} onClick={onDismiss}>
          Got it
        </button>
      </div>
    </div>
  );
}
