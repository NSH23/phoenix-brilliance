import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ContactForm from "./ContactForm";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContactPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ContactPopup({ isOpen, onClose }: ContactPopupProps) {
    // We'll use a custom fixed overlay instead of Shadcn Dialog for more custom positioning/animation control if needed,
    // but Shadcn Dialog is accessible and standard. User asked for "popup... in the ui", "exit button at top right".
    // Shadcn Dialog has X button by default.
    // Let's use Shadcn Dialog but style it to look premium.

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95%] rounded-[24px] sm:max-w-[500px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-primary/20">
                <div className="absolute right-4 top-4 z-50">
                    {/* Close button is already provided by DialogContent usually, but we can ensure it's styled or add our own if needed. 
               Shadcn DialogContent usually includes a Close Primitive. We'll trust that or add one if missing style. 
               Actually, let's keep standard behavior. */}
                </div>

                <div className="relative">
                    {/* Decor */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-rose-gold to-primary" />
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-2xl font-serif font-bold text-center">
                            Let's Discuss Your Event
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                            Get a quote for your upcoming celebration.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 pt-2">
                        <ContactForm />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
