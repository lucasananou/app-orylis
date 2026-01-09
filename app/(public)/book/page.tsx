"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, isSameDay, addDays, startOfToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, CheckCircle2, Calendar as CalendarIcon, Clock, Video, ArrowRight } from "lucide-react";
import { bookPublicMeeting } from "@/actions/public-booking";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BookingPage() {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState<string | null>(null);
    const [step, setStep] = useState<"date" | "details" | "success">("date");

    // Form Data
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [budget, setBudget] = useState("");
    const [notes, setNotes] = useState("");

    const [isPending, startTransition] = useTransition();

    // Generate time slots (9:00 - 18:00, every 30 mins)
    // In a real app, these would be filtered by availability fetched from server
    const timeSlots = Array.from({ length: 18 }, (_, i) => {
        const hour = Math.floor(i / 2) + 9;
        const minute = (i % 2) * 30;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });

    const handleConfirm = () => {
        if (!date || !time || !name || !email || !phone) return;

        const [hours, minutes] = time.split(":").map(Number);
        const bookingDate = new Date(date);
        bookingDate.setHours(hours, minutes, 0, 0);

        startTransition(async () => {
            try {
                const result = await bookPublicMeeting({
                    name,
                    email,
                    phone,
                    budget,
                    startTime: bookingDate.toISOString(),
                    notes
                });

                if (result.success) {
                    setStep("success");
                }
            } catch (error) {
                console.error(error);
                toast.error("Erreur lors de la réservation. Veuillez réessayer.");
            }
        });
    };

    if (step === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Réservation Confirmée !</CardTitle>
                        <CardDescription>
                            Votre rendez-vous a été programmé avec succès.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{date && format(date, "EEEE d MMMM yyyy", { locale: fr })}</span>
                            <span>à</span>
                            <span className="font-semibold">{time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Un email de confirmation vous a été envoyé à {email}.
                        </p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button asChild>
                            <Link href="/">Retour à l'accueil</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50/50 p-4 md:p-8">
            <Card className="w-full max-w-5xl shadow-xl border-zinc-200/60 overflow-hidden flex flex-col md:flex-row min-h-[600px] h-full md:h-auto">

                {/* Left Panel: Context & Info */}
                <div className="md:w-[35%] bg-zinc-50/50 border-b md:border-b-0 md:border-r border-zinc-100 p-6 md:p-8 flex flex-col justify-between shrink-0">
                    <div>
                        <div className="flex flex-col space-y-4 mb-8">
                            <div className="h-16 w-16 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <img
                                    src="/logo.png"
                                    alt="Orylis Logo"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div>
                                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Orylis – Démo & échange projet</h2>
                                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mt-1 leading-tight">Démo personnalisée de votre futur site</h1>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3 text-zinc-600">
                                <span className="text-lg">⏱️</span>
                                <span className="font-medium">30 minutes</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-600">
                                <span className="text-lg">🎥</span>
                                <span className="font-medium">Google Meet</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-600">
                                <span className="text-lg">🧠</span>
                                <span className="font-medium">Démo + discussion</span>
                            </div>
                            <div className="flex items-start gap-3 text-zinc-600">
                                <CalendarIcon className="h-5 w-5 text-zinc-400 mt-0.5" />
                                <span className="leading-snug">
                                    {date ? (
                                        <span className="text-zinc-900 font-semibold">
                                            {format(date, "EEEE d MMMM", { locale: fr })}
                                            {time && ` à ${time}`}
                                        </span>
                                    ) : (
                                        "Choisissez une date et une heure"
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 md:mt-0 pt-8 border-t border-zinc-100 text-xs text-muted-foreground hidden md:block">
                        <p>📍 Fuseau horaire : Europe/Paris (CET)</p>
                    </div>
                </div>

                {/* Right Panel: Calendar & Form */}
                <div className="flex-1 bg-white p-6 md:p-8 relative">
                    {step === "date" ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold">Sélectionnez une date et une heure</h3>
                                <p className="text-sm text-muted-foreground mt-1">Découvrez une première version de votre site et voyons ensemble si le projet est pertinent.</p>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-8 h-full">
                                {/* Calendar */}
                                <div className="flex-1 flex justify-center lg:justify-start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => {
                                            setDate(d);
                                            setTime(null);
                                        }}
                                        fromDate={startOfToday()}
                                        className="p-0 border-0"
                                        classNames={{
                                            months: "w-full",
                                            month: "space-y-4 w-full",
                                            caption: "flex justify-center pt-1 relative items-center mb-4",
                                            caption_label: "text-base font-semibold",
                                            nav: "space-x-1 flex items-center",
                                            nav_button: "h-8 w-8 bg-transparent p-0 hover:bg-zinc-100 rounded-full transition-colors",
                                            head_row: "flex justify-between w-full mb-2",
                                            head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[0.8rem]",
                                            row: "flex w-full mt-2 justify-between",
                                            cell: "text-center text-sm p-0 relative hover:bg-zinc-100 rounded-full transition-colors focus-within:relative focus-within:z-20",
                                            day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-zinc-100 transition-all",
                                            selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-md focus:bg-blue-600 focus:text-white",
                                            today: "bg-transparent text-zinc-900 font-bold border border-zinc-200",
                                            outside: "text-zinc-300 opacity-50 hover:bg-transparent",
                                            disabled: "text-zinc-300 opacity-50",
                                            hidden: "invisible",
                                        }}
                                        locale={fr}
                                    />
                                </div>

                                {/* Time Slots */}
                                <div className={cn(
                                    "w-full lg:w-[240px] border-t lg:border-t-0 lg:border-l pl-0 lg:pl-8 pt-6 lg:pt-0 transition-all duration-300",
                                    date ? "opacity-100 translate-x-0" : "opacity-30 translate-x-4 pointer-events-none grayscale"
                                )}>
                                    <div className="h-full flex flex-col">
                                        <h4 className="text-sm font-medium mb-4 text-center lg:text-left">
                                            {date ? format(date, "EEEE d MMMM", { locale: fr }) : "Date non sélectionnée"}
                                        </h4>
                                        <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 overflow-y-auto max-h-[360px] pr-2 custom-scrollbar">
                                            {timeSlots.map((slot) => (
                                                <Button
                                                    key={slot}
                                                    variant={time === slot ? "default" : "outline"}
                                                    className={cn(
                                                        "w-full justify-center text-sm font-medium transition-all",
                                                        time === slot
                                                            ? "bg-blue-600 hover:bg-blue-700 shadow-md scale-105"
                                                            : "hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50"
                                                    )}
                                                    onClick={() => {
                                                        setTime(slot);
                                                        setStep("details");
                                                    }}
                                                >
                                                    {slot}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="mb-6">
                                <Button variant="ghost" size="sm" onClick={() => setStep("date")} className="-ml-3 mb-2 text-muted-foreground hover:text-foreground">
                                    <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
                                    Retour au calendrier
                                </Button>
                                <h3 className="text-lg font-semibold">Vos informations</h3>
                                <p className="text-sm text-muted-foreground mt-1">Dites-nous en un peu plus sur vous.</p>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-zinc-700">Nom complet *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Jean Dupont"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-zinc-700">Email professionnel *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="jean@entreprise.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-zinc-700">Numéro de téléphone *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="06 12 34 56 78"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-zinc-700">Pour vous situer, quel budget envisagez-vous ?</Label>
                                    <div className="space-y-2">
                                        {[
                                            { value: "less-1k", label: "Moins de 1 000 €" },
                                            { value: "1k-2k", label: "Entre 1 000 € et 2 000 €" },
                                            { value: "2k-4k", label: "Entre 2 000 € et 4 000 €" },
                                            { value: "more-4k", label: "Plus de 4 000 €" },
                                            { value: "discuss", label: "Je préfère en discuter" },
                                        ].map((option) => (
                                            <label
                                                key={option.value}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-blue-600 hover:bg-blue-50/50",
                                                    budget === option.value && "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="budget"
                                                    value={option.value}
                                                    checked={budget === option.value}
                                                    onChange={(e) => setBudget(e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm font-medium">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-zinc-700">Message (Optionnel)</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Un sujet particulier ?"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="min-h-[100px] bg-zinc-50 border-zinc-200 focus:bg-white transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <Button
                                    onClick={handleConfirm}
                                    disabled={!name || !email || isPending}
                                    className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
                                >
                                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmer la réservation"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
