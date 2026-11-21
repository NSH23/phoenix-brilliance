import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Loader2, MessageCircle, ShieldCheck, KeyRound, Clock3 } from "lucide-react";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearAccessSession,
  getAccessStatus,
  isLocalUnlockValid,
  readStoredAccessToken,
  storeAccessToken,
  storeUnlockExpiry,
  verifyAccessOtp,
  type SiteAccessStatus,
} from "@/services/access";
import { DEFAULT_WHATSAPP, toWhatsAppHref } from "@/lib/contactNumbers";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { toast } from "sonner";

const POLL_PENDING_MS = 8000;
/** Re-check server unlock while browsing — blocks DevTools “set status=verified” from lasting. */
const POLL_VERIFIED_MS = 20_000;
/** Max age of last successful server verify before Outlet is withheld. */
const SERVER_TRUST_MS = 45_000;

function WaitingForOtpScreen({
  visitorName,
  otpExpiresAt,
  onVerify,
  verifying,
  onMessageWhatsApp,
  onStartOver,
}: {
  visitorName?: string | null;
  otpExpiresAt?: string | null;
  onVerify: (otp: string) => Promise<void>;
  verifying: boolean;
  onMessageWhatsApp: () => void;
  onStartOver: () => void;
}) {
  const [otp, setOtp] = useState("");

  const expiresLabel = (() => {
    if (!otpExpiresAt) return null;
    const ms = Date.parse(otpExpiresAt);
    if (Number.isNaN(ms)) return null;
    const mins = Math.max(0, Math.round((ms - Date.now()) / 60000));
    if (mins <= 0) return "OTP expired — request a new one";
    if (mins < 60) return `OTP expires in about ${mins} min`;
    return `OTP expires in about ${Math.round(mins / 60)} h`;
  })();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/90 p-6 text-center shadow-lg backdrop-blur-xl sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Enter your OTP</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {visitorName ? `Thanks, ${visitorName.split(/\s+/)[0]}. ` : null}
          Phoenix Events will send a 6-digit code on WhatsApp. Enter it here to unlock the site
          on this device for 2 hours.
        </p>
        {expiresLabel ? (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            {expiresLabel}
          </p>
        ) : null}
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void onVerify(otp);
          }}
        >
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-12 text-center text-lg tracking-[0.35em]"
            disabled={verifying}
            aria-label="One-time password"
          />
          <Button type="submit" className="w-full" disabled={verifying || otp.length !== 6}>
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Unlock site"
            )}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-2">
          <Button type="button" variant="outline" className="w-full gap-2" onClick={onMessageWhatsApp}>
            <MessageCircle className="h-4 w-4" />
            Message us on WhatsApp
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onStartOver}>
            Submit a new request
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccessExpiredScreen({
  onRetry,
  onMessageWhatsApp,
}: {
  onRetry: () => void;
  onMessageWhatsApp: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/90 p-6 text-center shadow-lg backdrop-blur-xl sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <Clock3 className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Access expired</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your OTP or 2-hour session has ended on this device. Submit a new request to get a fresh
          code. OTPs only work on the phone/browser where you filled the form.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button type="button" className="w-full" onClick={onRetry}>
            Request access again
          </Button>
          <Button type="button" variant="outline" className="w-full gap-2" onClick={onMessageWhatsApp}>
            <MessageCircle className="h-4 w-4" />
            Message us on WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SiteAccessGate() {
  const { contact } = useSiteConfig();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(() => readStoredAccessToken());
  const [status, setStatus] = useState<SiteAccessStatus | "loading">(token ? "loading" : "none");
  const [visitorName, setVisitorName] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [serverTrusted, setServerTrusted] = useState(false);
  const lastServerOkAtRef = useRef(0);
  const refreshInFlightRef = useRef(false);

  const markServerOk = useCallback(() => {
    lastServerOkAtRef.current = Date.now();
    setServerTrusted(true);
  }, []);

  const refreshStatus = useCallback(
    async (nextToken: string | null) => {
      if (!nextToken) {
        setStatus("none");
        setVisitorName(null);
        setOtpExpiresAt(null);
        setServerTrusted(false);
        lastServerOkAtRef.current = 0;
        return;
      }
      if (refreshInFlightRef.current) return;
      refreshInFlightRef.current = true;
      try {
        const result = await getAccessStatus(nextToken);
        setVisitorName(result.visitor_name ?? null);
        setOtpExpiresAt(result.otp_expires_at ?? null);

        if (result.status === "verified") {
          if (result.unlock_expires_at) storeUnlockExpiry(result.unlock_expires_at);
          // Never unlock from localStorage alone — server must confirm active unlock.
          if (result.unlock_expires_at && isLocalUnlockValid(result.unlock_expires_at)) {
            markServerOk();
            setStatus("verified");
            return;
          }
          setServerTrusted(false);
          setStatus("expired");
          return;
        }

        setServerTrusted(false);
        lastServerOkAtRef.current = 0;

        if (result.status === "none") {
          clearAccessSession();
          setToken(null);
          setStatus("none");
          return;
        }

        setStatus(result.status);
      } catch {
        // On network failure while already verified recently, keep brief grace; otherwise demote.
        const recentlyOk = Date.now() - lastServerOkAtRef.current < SERVER_TRUST_MS;
        if (!recentlyOk) {
          setServerTrusted(false);
          setStatus((prev) => {
            if (prev === "verified") return "loading";
            if (prev === "loading") return nextToken ? "pending" : "none";
            return prev;
          });
        }
      } finally {
        refreshInFlightRef.current = false;
      }
    },
    [markServerOk],
  );

  useEffect(() => {
    void refreshStatus(token);
  }, [token, refreshStatus]);

  // Re-verify on every public navigation (stops route spoofing / stale unlock).
  useEffect(() => {
    if (!token) return;
    void refreshStatus(token);
  }, [location.pathname, token, refreshStatus]);

  useEffect(() => {
    if (!token || status !== "pending") return;
    const id = window.setInterval(() => {
      void refreshStatus(token);
    }, POLL_PENDING_MS);
    return () => window.clearInterval(id);
  }, [token, status, refreshStatus]);

  useEffect(() => {
    if (status !== "verified" || !token) return;
    const tick = () => {
      if (!isLocalUnlockValid()) {
        setServerTrusted(false);
        setStatus("expired");
        return;
      }
      void refreshStatus(token);
    };
    tick();
    const id = window.setInterval(tick, POLL_VERIFIED_MS);
    return () => window.clearInterval(id);
  }, [status, token, refreshStatus]);

  // Re-check when tab becomes visible again.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && token) {
        void refreshStatus(token);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [token, refreshStatus]);

  const whatsappHref = toWhatsAppHref(
    contact?.whatsapp || DEFAULT_WHATSAPP,
    "Hi Phoenix Events, I submitted a website access request and I am waiting for my OTP.",
  );

  const openWhatsApp = () => {
    window.open(whatsappHref, "_blank", "noopener,noreferrer");
  };

  const startOver = () => {
    clearAccessSession();
    setToken(null);
    setVisitorName(null);
    setOtpExpiresAt(null);
    setServerTrusted(false);
    lastServerOkAtRef.current = 0;
    setStatus("none");
  };

  const handleVerify = async (otp: string) => {
    if (!token) return;
    setVerifying(true);
    try {
      const result = await verifyAccessOtp(token, otp);
      if (!result.ok) {
        const reason = result.reason || "invalid";
        if (reason === "expired") {
          toast.error("OTP expired. Please submit a new request.");
          setStatus("expired");
          return;
        }
        if (reason === "wrong_otp") {
          toast.error("Incorrect OTP. Please check the WhatsApp message.");
          return;
        }
        toast.error("Could not verify OTP. Try again or request a new code.");
        return;
      }
      if (result.unlock_expires_at) storeUnlockExpiry(result.unlock_expires_at);
      markServerOk();
      setStatus("verified");
      // Confirm against get_access_status (source of truth).
      void refreshStatus(token);
      toast.success("Access unlocked for 2 hours on this device.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to verify OTP");
    } finally {
      setVerifying(false);
    }
  };

  const unlockFresh =
    status === "verified" &&
    serverTrusted &&
    Date.now() - lastServerOkAtRef.current < SERVER_TRUST_MS &&
    isLocalUnlockValid();

  if (unlockFresh) {
    return <Outlet />;
  }

  if (status === "verified" && !unlockFresh) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Confirming access…</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <WaitingForOtpScreen
        visitorName={visitorName}
        otpExpiresAt={otpExpiresAt}
        verifying={verifying}
        onVerify={handleVerify}
        onMessageWhatsApp={openWhatsApp}
        onStartOver={startOver}
      />
    );
  }

  if (status === "expired") {
    return <AccessExpiredScreen onMessageWhatsApp={openWhatsApp} onRetry={startOver} />;
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none flex min-h-screen flex-col items-center justify-center px-4 text-center opacity-80">
        <ShieldCheck className="mb-3 h-8 w-8 text-primary" />
        <p className="font-serif text-xl text-foreground">Phoenix Events & Production</p>
        <p className="mt-1 text-sm text-muted-foreground">Guest access required</p>
      </div>
      <LeadCaptureModal
        isBlocking
        onSubmitSuccess={({ accessToken }) => {
          if (!accessToken) return;
          storeAccessToken(accessToken);
          setToken(accessToken);
          setServerTrusted(false);
          setStatus("pending");
        }}
      />
    </div>
  );
}
