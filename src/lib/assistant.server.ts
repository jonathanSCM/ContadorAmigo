// Asistente de IA: responde preguntas sobre el negocio usando sus datos
// financieros reales como contexto. Usa Groq (API compatible con OpenAI),
// sin SDK adicional — solo fetch.
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses, movements } from "@/db/schema";
import { requireUserId } from "./auth.server";
import { assertOwnsBusiness } from "./businesses.server";
import type { Movement } from "./storage";
import { profitAndLoss } from "./analysis";
import { calcMonthly, healthStatus, formatBs } from "./tax";
import { gestionRange, SECTOR_INFO, DEFAULT_SECTOR, type Sector } from "./sectors";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildContext(businessName: string, sector: Sector | null, movs: Movement[]): string {
  const monthly = calcMonthly(movs);
  const health = healthStatus(monthly);
  const pnlMes = profitAndLoss(movs, "mes");
  const pnlAnio = profitAndLoss(movs, "anio");
  const gestion = gestionRange(sector ?? DEFAULT_SECTOR);

  return `Eres el asistente financiero de ContadorAmigo, una app para emprendedores bolivianos sin
formación contable. Hablas en español boliviano, simple, cercano y sin tecnicismos innecesarios —
como si le explicaras a un amigo que recién empieza su negocio. Cuando des consejos, básalos en los
números reales de abajo, no en generalidades. Si la pregunta no tiene que ver con el negocio,
igual respóndela con amabilidad pero breve.

Aclara si corresponde que no reemplazas a un contador ni das asesoría legal oficial ante el SIN,
solo apoyas a entender los números.

Datos reales del negocio "${businessName}" (rubro: ${SECTOR_INFO[sector ?? DEFAULT_SECTOR].label}):

Este mes:
- Ingresos: ${formatBs(monthly.ingresos)}
- Gastos: ${formatBs(monthly.gastos)}
- Utilidad: ${formatBs(monthly.utilidad)}
- IVA a pagar: ${formatBs(monthly.ivaAPagar)}
- IT a pagar: ${formatBs(monthly.itAPagar)}
- Salud del negocio: ${health.label} — ${health.description}

Este año:
- Ingresos: ${formatBs(pnlAnio.ingresos)}
- Utilidad neta: ${formatBs(pnlAnio.utilidadNeta)}
- Margen neto: ${(pnlAnio.margenNeto * 100).toFixed(0)}%
- Gastos operativos principales: ${pnlAnio.operativos
    .slice(0, 3)
    .map((o) => `${o.label} ${formatBs(o.value)}`)
    .join(", ") || "sin datos aún"}

Cierre de Gestión (año fiscal según su rubro): ${gestion.start.toLocaleDateString("es-BO")} al
${gestion.end.toLocaleDateString("es-BO")}, vence el ${gestion.dueDate.toLocaleDateString("es-BO")}.

Los ÚNICOS regímenes tributarios que existen en Bolivia (no inventes otros nombres):
- RTS (Régimen Tributario Simplificado): para comerciantes minoristas, vivanderos y artesanos con
  capital hasta Bs 60.000 y ventas anuales menores a Bs 184.000. Pago fijo bimestral según categoría
  de capital (entre Bs 47 y Bs 350 cada 2 meses). No emite factura con crédito fiscal.
- SIETE-RG (Decreto Supremo 5503): régimen de transición para ventas anuales menores a Bs 250.000.
  Monotributo del 5% de las ventas brutas, pago bimestral, reemplaza IVA+IT+IUE. Válido hasta 3 años.
- Régimen General: para el resto. Paga IVA 13% (débito−crédito fiscal), IT 3% de ingresos brutos,
  e IUE 25% de la utilidad neta anual. Emite factura.

Detalle del mes actual (Estado de Resultados):
- Costo de ventas: ${formatBs(pnlMes.costoVentas)}
- Utilidad bruta: ${formatBs(pnlMes.utilidadBruta)}
- Gastos operativos: ${formatBs(pnlMes.gastosOperativos)}
- Impuestos del mes (IVA+IT): ${formatBs(pnlMes.impuestos)}`;
}

export const askAssistant = createServerFn({ method: "POST" })
  .validator((d: { businessId: string; messages: ChatMessage[] }) => d)
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const userId = await requireUserId();
    await assertOwnsBusiness(userId, data.businessId);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "El asistente no está configurado todavía (falta GROQ_API_KEY en el servidor).",
      );
    }

    const [bizRows, movRows] = await Promise.all([
      db.select().from(businesses).where(eq(businesses.id, data.businessId)).limit(1),
      db.select().from(movements).where(eq(movements.businessId, data.businessId)),
    ]);
    const biz = bizRows[0];
    if (!biz) throw new Error("Emprendimiento no encontrado.");

    const movs: Movement[] = movRows.map((m) => ({
      id: m.id,
      type: m.type as Movement["type"],
      concept: m.concept,
      amountNet: m.amountNet,
      hasInvoice: m.hasInvoice,
      category: m.category,
      date: m.date,
      note: m.note ?? undefined,
      providerName: m.providerName ?? undefined,
      invoiceNumber: m.invoiceNumber ?? undefined,
      providerNit: m.providerNit ?? undefined,
    }));

    const systemPrompt = buildContext(biz.name, biz.sector as Sector | null, movs);
    const recentMessages = data.messages.slice(-12); // no mandar historiales infinitos

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 700,
        messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`El asistente no respondió (${res.status}). ${errText.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("El asistente no devolvió una respuesta.");

    return { reply };
  });
