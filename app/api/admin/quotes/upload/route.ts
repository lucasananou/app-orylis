import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { isStaff } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || !isStaff(session.user.role)) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
        }

        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
        const blob = await put(`quotes/uploads/${Date.now()}-${file.name}`, file, {
            access: "public",
            token: blobToken
        });

        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error("[QuoteUpload] Error:", error);
        return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }
}
