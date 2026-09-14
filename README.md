# Ketolance PAP — Helse Colombia

Bot de WhatsApp y dashboard de hoja de vida para el Programa de Apoyo a Pacientes (producto **Ketolance**).

## Qué hace el MVP

- Solo envía encuestas a **pacientes previamente registrados**.
- Tres chequeos diarios, **todos los días del año**, hora Colombia: **8:00, 12:00 y 16:00**.
- Cada turno es independiente (aunque el paciente ya haya contestado ese día).
- Pregunta: vómitos, diarrea, fiebre, transgresión de dieta, cambio de FAE y observaciones.
- Guarda todo en la **hoja de vida** del paciente.
- Roles: `NUTRICIONISTA`, `EMPRESA`, `SUPERADMIN` (ve todo, audita y revierte encuestas).

## Cómo correrlo

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

En otra terminal, para los horarios automáticos:

```bash
npx tsx src/worker.ts
```

Abre http://localhost:3000

| Usuario | Correo | Contraseña |
| --- | --- | --- |
| Superadmin | jose@helsecolombia.com | HelseAdmin123! |
| Nutricionista | nutricion@helsecolombia.com | Nutri1234! |

Cambia esas claves antes de producción.

## WhatsApp (Meta Cloud API)

El número se crea de cero y se cuelga del Business/app de Meta que ya tienen.

1. En Meta for Developers: WhatsApp → configuración → número y token.
2. Webhook: `https://TU-DOMINIO/api/whatsapp/webhook`
3. Verify token: el de `WHATSAPP_VERIFY_TOKEN` en `.env`
4. Completa en `.env`:

```
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
```

Sin token, el bot corre en **dry-run** (registra la encuesta y escribe en consola, no llama a Meta). Sirve para probar el dashboard.

## Envío programado

- Worker local: `npx tsx src/worker.ts` (dispara en el minuto 0–2 de cada horario).
- O un GET autenticado: `/api/cron/surveys?secret=CRON_SECRET`
- Superadmin también puede forzar un turno desde el tablero.

## Datos personales

Hay consentimiento por paciente y roles. Esto **no sustituye** política de tratamiento de datos, contrato de encargado ni hosting en Colombia/región acordada. La auditoría cubre cambios de encuestas y su reversión.

## Primer cambio útil

El texto de las preguntas está en `src/lib/survey-copy.ts`. El flujo de WhatsApp está en `src/lib/survey.ts`.
