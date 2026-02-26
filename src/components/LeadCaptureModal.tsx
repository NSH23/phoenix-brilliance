import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { createInquiry, isValidPhone10, getNormalizedPhone10 } from "@/services/inquiries";
import { getVenueOptions, getEventTypeOptions, DEFAULT_VENUES, DEFAULT_EVENT_TYPES, NOT_BOOKED_VENUE } from "@/services/formOptions";
import { getActiveCollaborations } from "@/services/collaborations";
import { useLeadCapture } from "@/contexts/LeadCaptureContext";
import { Loader2, CheckCircle, Lock, ChevronDown, ChevronUp, ExternalLink, BookOpen, FolderOpen } from "lucide-react";
import { toast } from "sonner";

type SubmitScenario = "specific_venue" | "not_booked" | "other";

/** Once set (after submit or close), modal never shows again. */
const STORAGE_KEY = "phoenix_lead_captured";
const OTHER_LABEL = "Other";

export default function LeadCaptureModal() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedScenario, setSubmittedScenario] = useState<SubmitScenario | null>(null);
    const [submittedVenueName, setSubmittedVenueName] = useState<string | null>(null);
    const [matchedCollaborationId, setMatchedCollaborationId] = useState<string | null>(null);
    const [showMore, setShowMore] = useState(false);
    const [venueOptions, setVenueOptions] = useState<string[]>([...DEFAULT_VENUES, NOT_BOOKED_VENUE, OTHER_LABEL]);
    const { setSelectedVenue } = useLeadCapture();
    const [eventTypeOptions, setEventTypeOptions] = useState<string[]>([...DEFAULT_EVENT_TYPES, OTHER_LABEL]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [eventType, setEventType] = useState("");
    const [eventTypeOther, setEventTypeOther] = useState("");
    const [venue, setVenue] = useState("");
    const [venueOther, setVenueOther] = useState("");
    const [instagramId, setInstagramId] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        getVenueOptions().then(setVenueOptions);
        getEventTypeOptions().then(setEventTypeOptions);
    }, []);

    useEffect(() => {
        if (!isSuccess || submittedScenario !== "specific_venue" || !submittedVenueName?.trim()) return;
        getActiveCollaborations()
            .then((list) => {
                const v = submittedVenueName.trim().toLowerCase();
                const match = list.find((c) => (c.name || "").trim().toLowerCase() === v);
                if (match) setMatchedCollaborationId(match.id);
            })
            .catch(() => {});
    }, [isSuccess, submittedScenario, submittedVenueName]);

    useEffect(() => {
        if (location.pathname !== "/") return;
        const handleScroll = () => {
            if (localStorage.getItem(STORAGE_KEY) === "true") return;
            const heroSection = document.getElementById("home");
            if (!heroSection) return;
            const heroBottom = heroSection.getBoundingClientRect().bottom;
            if (heroBottom < window.innerHeight) {
                setIsOpen(true);
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        const t = setTimeout(handleScroll, 300);
        return () => {
            window.removeEventListener("scroll", handleScroll);
            clearTimeout(t);
        };
    }, [location.pathname]);

    if (location.pathname.startsWith("/admin")) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (!name.trim()) {
                toast.error("Please enter your name");
                setIsSubmitting(false);
                return;
            }
            if (!phone.trim()) {
                toast.error("Please enter your phone number");
                setIsSubmitting(false);
                return;
            }
            if (!isValidPhone10(phone)) {
                toast.error("Please enter a valid 10-digit number (with or without +91)");
                setIsSubmitting(false);
                return;
            }
            const resolvedVenue = venue === OTHER_LABEL ? (venueOther.trim() || null) : (venue.trim() || null);
            const resolvedEventType = eventType === OTHER_LABEL ? (eventTypeOther.trim() || null) : (eventType.trim() || null);
            await createInquiry({
                name: name.trim(),
                phone: getNormalizedPhone10(phone),
                email: email.trim() || undefined,
                event_type: resolvedEventType,
                venue: resolvedVenue,
                instagram_id: instagramId.trim() || null,
                message: message.trim() || "Lead Capture",
            });
            if (venue === NOT_BOOKED_VENUE || !venue.trim()) {
                setSelectedVenue(null);
                setSubmittedScenario("not_booked");
                setSubmittedVenueName(null);
            } else if (venue === OTHER_LABEL) {
                setSelectedVenue(null);
                setSubmittedScenario("other");
                setSubmittedVenueName(resolvedVenue || null);
            } else {
                setSelectedVenue(resolvedVenue || null);
                setSubmittedScenario("specific_venue");
                setSubmittedVenueName(resolvedVenue || null);
            }
            localStorage.setItem(STORAGE_KEY, "true");
            setIsSuccess(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
            toast.error(msg);
            if (msg.includes("Unable to save")) {
                toast.info("You can reach us directly via WhatsApp.", { duration: 5000 });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen && !isSuccess) return null;

    const selectClass = "flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

    const handleOpenChange = (open: boolean) => {
        if (!open && !isSuccess) return;
        if (!open) {
            localStorage.setItem(STORAGE_KEY, "true");
            setIsOpen(false);
            setIsSuccess(false);
            setSubmittedScenario(null);
            setSubmittedVenueName(null);
            setMatchedCollaborationId(null);
        }
    };

    const closeAndNavigate = (path: string, opts?: { state?: { fromLeadCapture?: boolean }; replace?: boolean }) => {
        localStorage.setItem(STORAGE_KEY, "true");
        setIsOpen(false);
        setIsSuccess(false);
        setSubmittedScenario(null);
        setSubmittedVenueName(null);
        setMatchedCollaborationId(null);
        navigate(path, { state: opts?.state, replace: opts?.replace ?? true });
    };

    const closeAndScrollToVenues = () => {
        localStorage.setItem(STORAGE_KEY, "true");
        setIsOpen(false);
        setIsSuccess(false);
        setSubmittedScenario(null);
        setSubmittedVenueName(null);
        setMatchedCollaborationId(null);
        const el = document.getElementById("venues");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const closeOnly = () => {
        setIsOpen(false);
        setIsSuccess(false);
        setSubmittedScenario(null);
        setSubmittedVenueName(null);
        setMatchedCollaborationId(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="w-[calc(100vw-1.5rem)] max-w-[380px] flex flex-col bg-card/95 backdrop-blur-xl border-primary/20 p-3 sm:p-4 overflow-hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex-shrink-0 space-y-0.5 pb-2">
                    <div className="mx-auto w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <DialogTitle className="text-center font-serif text-lg sm:text-xl font-semibold">
                        Welcome to Phoenix Events
                    </DialogTitle>
                    <DialogDescription className="text-center text-xs">
                        Join our guest list to unlock event showcase and prices.
                    </DialogDescription>
                </DialogHeader>

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-4 sm:py-5 text-center animate-in fade-in zoom-in space-y-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium">You're In!</h3>
                        {submittedScenario === "specific_venue" && submittedVenueName && (
                            <>
                                <p className="text-muted-foreground text-sm leading-snug">
                                    Open <span className="font-semibold text-foreground">&quot;{submittedVenueName}&quot;</span> to view photos & videos from our events.
                                </p>
                                <div className="flex flex-col gap-2 w-full pt-1">
                                    <Button
                                        type="button"
                                        className="w-full bg-gradient-to-r from-primary to-rose-gold text-white gap-2"
                                        onClick={() => matchedCollaborationId ? closeAndNavigate(`/collaborations/${matchedCollaborationId}`, { replace: true }) : closeAndScrollToVenues()}
                                    >
                                        <FolderOpen className="w-4 h-4" />
                                        {matchedCollaborationId ? `View ${submittedVenueName}` : "View venues"}
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={closeOnly} className="text-muted-foreground">
                                        Maybe later
                                    </Button>
                                </div>
                            </>
                        )}
                        {submittedScenario === "not_booked" && (
                            <>
                                <p className="text-muted-foreground text-sm leading-snug">
                                    Book your venue through us for exclusive benefits and a seamless experience.
                                </p>
                                <div className="flex flex-col gap-2 w-full pt-1">
                                    <Button type="button" className="w-full gap-2" onClick={() => closeAndNavigate("/contact", { replace: false })}>
                                        <BookOpen className="w-4 h-4" />
                                        Book now
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={closeOnly} className="text-muted-foreground">
                                        Maybe later
                                    </Button>
                                </div>
                            </>
                        )}
                        {submittedScenario === "other" && (
                            <>
                                <p className="text-muted-foreground text-sm leading-snug">
                                    Explore our partner venues below and find the perfect one for your event.
                                </p>
                                <div className="flex flex-col gap-2 w-full pt-1">
                                    <Button type="button" className="w-full gap-2" onClick={closeAndScrollToVenues}>
                                        <ExternalLink className="w-4 h-4" />
                                        View venues
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={closeOnly} className="text-muted-foreground">
                                        Maybe later
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="lead-name" className="text-[11px] sm:text-xs">Name *</Label>
                                <Input
                                    id="lead-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    required
                                    className="h-9 text-sm touch-manipulation"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="lead-phone" className="text-[11px] sm:text-xs">Phone *</Label>
                                <div className="flex h-9">
                                    <div className="flex items-center justify-center px-2 border rounded-l-md bg-muted text-muted-foreground text-[11px] border-r-0 shrink-0">
                                        +91
                                    </div>
                                    <Input
                                        id="lead-phone"
                                        type="tel"
                                        inputMode="numeric"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="9876543210"
                                        className="rounded-l-none text-sm h-9 touch-manipulation"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="lead-email" className="text-[11px] sm:text-xs">Email</Label>
                                <Input
                                    id="lead-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="h-9 text-sm touch-manipulation"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="lead-event-type" className="text-[11px] sm:text-xs">Event</Label>
                                <select
                                    id="lead-event-type"
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Select</option>
                                    {eventTypeOptions.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {eventType === OTHER_LABEL && (
                            <div className="space-y-1">
                                <Label htmlFor="lead-event-other" className="text-[11px] sm:text-xs">Event type (other)</Label>
                                <Input
                                    id="lead-event-other"
                                    value={eventTypeOther}
                                    onChange={(e) => setEventTypeOther(e.target.value)}
                                    placeholder="Specify event type"
                                    className="h-9 text-sm touch-manipulation"
                                />
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label htmlFor="lead-venue" className="text-[11px] sm:text-xs">Venue</Label>
                            <select
                                id="lead-venue"
                                value={venue}
                                onChange={(e) => setVenue(e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Select venue</option>
                                {venueOptions.map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                        {venue === OTHER_LABEL && (
                            <div className="space-y-1">
                                <Label htmlFor="lead-venue-other" className="text-[11px] sm:text-xs">Venue name (other)</Label>
                                <Input
                                    id="lead-venue-other"
                                    value={venueOther}
                                    onChange={(e) => setVenueOther(e.target.value)}
                                    placeholder="Enter venue name"
                                    className="h-9 text-sm touch-manipulation"
                                />
                            </div>
                        )}

                        <Collapsible open={showMore} onOpenChange={setShowMore}>
                            <CollapsibleTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground py-1 -mb-0.5"
                                >
                                    {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    {showMore ? "Less" : "More details (Instagram, message)"}
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-2 pt-1">
                                <div className="space-y-1">
                                    <Label htmlFor="lead-instagram" className="text-[11px] sm:text-xs">Instagram</Label>
                                    <Input
                                        id="lead-instagram"
                                        value={instagramId}
                                        onChange={(e) => setInstagramId(e.target.value)}
                                        placeholder="@username"
                                        className="h-9 text-sm touch-manipulation"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="lead-message" className="text-[11px] sm:text-xs">Message</Label>
                                    <Textarea
                                        id="lead-message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Questions or details..."
                                        rows={2}
                                        className="resize-none text-sm min-h-0 touch-manipulation"
                                    />
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        <Button
                            type="submit"
                            className="w-full h-10 text-sm bg-gradient-to-r from-primary to-rose-gold text-white font-medium touch-manipulation mt-0.5"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            View Exclusive Content
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground">
                            Your details are safe with us.
                        </p>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
