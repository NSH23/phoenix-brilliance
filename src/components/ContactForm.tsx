import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { isValidPhone10 } from "@/services/inquiries";
import { toast } from "sonner";

const eventTypes = [
    "Wedding",
    "Birthday",
    "Engagement",
    "Sangeet",
    "Haldi",
    "Mehendi",
    "Anniversary",
    "Corporate Event",
    "Car Opening",
    "Other",
];

export default function ContactForm({ className }: { className?: string }) {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        eventType: "",
        eventDate: "",
        message: "",
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidPhone10(formData.phone)) {
            toast.error("Please enter a valid 10-digit number (with or without +91)");
            return;
        }
        // Simulate form submission
        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({ name: "", phone: "", email: "", eventType: "", eventDate: "", message: "" });
        }, 3000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center h-full"
            >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="font-serif text-xl font-semibold text-foreground mb-2">Thank You!</h4>
                <p className="text-muted-foreground text-sm">We'll get back to you within 24 hours.</p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Your Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border 
                     focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                     transition-all text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Phone Number *</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border 
                     focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                     transition-all text-sm"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email Address *</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border 
                   focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                   transition-all text-sm"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Event Type *</label>
                    <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border 
                     focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                     transition-all text-sm"
                    >
                        <option value="">Select Type</option>
                        {eventTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Event Date *</label>
                    <input
                        type="date"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleChange}
                        required
                        min="1900-01-01"
                        max="2099-12-31"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border 
                     focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                     transition-all text-sm"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-foreground mb-1">Vision & Ideas</label>
                <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border 
                   focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                   transition-all resize-none text-sm"
                />
            </div>

            <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 
                 bg-gradient-to-r from-primary to-rose-gold text-primary-foreground 
                 rounded-xl font-semibold text-sm 
                 hover:shadow-lg hover:scale-[1.02] transition-all duration-300
                 shadow-primary/20 active:scale-95"
            >
                <Send className="w-4 h-4" />
                <span>Send Inquiry</span>
            </button>
        </form>
    );
}
