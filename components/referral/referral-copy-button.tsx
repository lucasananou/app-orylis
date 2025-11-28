"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ReferralCopyButtonProps {
    userId: string;
}

export function ReferralCopyButton({ userId }: ReferralCopyButtonProps) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://orylis.fr";
        const link = `${origin}/signup?ref=${userId}`;

        const text = `Hello,\n\nJe te recommande Orylis pour la création de ton site web. Ils ont fait du super boulot pour moi.\n\nSi tu passes par mon lien, tu auras -10% sur ton devis !\n\n👉 ${link}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Message avec lien de parrainage copié !");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button variant="outline" size="lg" className="rounded-full" onClick={handleCopy}>
            {copied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
            Copier mon lien
        </Button>
    );
}
