/* ------------------------------------------------------------------ */
/* Tipos de campo                                                        */
/* ------------------------------------------------------------------ */
export type FieldType = "number" | "yesno" | "mood" | "text";

export type SurveyField = {
  key: string;
  id: string;
  type: FieldType;
  question: string;
  /** Solo se incluye en este slot (undefined = todos los slots) */
  onlySlot?: "MANANA" | "MEDIODIA" | "TARDE";
};

/* ------------------------------------------------------------------ */
/* Campos de la encuesta en orden                                        */
/* ------------------------------------------------------------------ */
export const SURVEY_FIELDS: SurveyField[] = [
  {
    key: "vomitos",
    id: "VOMITOS",
    type: "number",
    question:
      "Hola 👋, soy el asistente del Programa de Apoyo a Pacientes Ketolance de Helse Colombia.\n\n¿Cuántos episodios de *vómito* tuvo en este turno?\n_(Escribe un número, por ejemplo: 0, 1, 2...)_",
  },
  {
    key: "diarrea",
    id: "DIARREA",
    type: "number",
    question: "¿Cuántos episodios de *diarrea* tuvo en este turno?\n_(Escribe 0 si ninguno)_",
  },
  {
    key: "fiebre",
    id: "FIEBRE",
    type: "number",
    question: "¿Cuántos episodios de *fiebre* tuvo en este turno?\n_(Escribe 0 si ninguna)_",
  },
  {
    key: "numeroCrisis",
    id: "CRISIS",
    type: "number",
    question: "¿Cuántas *crisis epilépticas* tuvo en este turno?\n_(Escribe 0 si ninguna)_",
  },
  {
    key: "transgresionDieta",
    id: "TRANSGRESION",
    type: "yesno",
    question: "¿Hubo *transgresión de la dieta cetogénica*?",
  },
  {
    key: "cambioFae",
    id: "CAMBIO_FAE",
    type: "yesno",
    question: "¿Hubo *cambio de FAE* (fármacos antiepilépticos)?",
  },
  {
    key: "glucosa",
    id: "GLUCOSA",
    type: "number",
    question:
      "¿Cuál fue el nivel de *glucosa* en este turno? (mg/dl)\n_(Escribe 0 si no midió)_",
  },
  {
    key: "cetonas",
    id: "CETONAS",
    type: "number",
    question:
      "¿Cuál fue el nivel de *cetonas*?\n_(Escribe el valor, o 0 si no midió)_",
  },
  {
    key: "estadoAnimo",
    id: "ANIMO",
    type: "mood",
    question: "¿Cómo es el *estado de ánimo* del paciente en este turno?",
  },
  {
    key: "peso",
    id: "PESO",
    type: "number",
    onlySlot: "MANANA",
    question:
      "Buenos días 🌅 ¿Cuál es el *peso* del paciente hoy? (en kg)\n_(Escribe el valor, por ejemplo: 18.5)_",
  },
  {
    key: "observaciones",
    id: "OBSERVACIONES",
    type: "text",
    question:
      "¿Desea agregar alguna *observación* para el equipo de nutrición? Puede escribirla ahora o responder *No*.",
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */

/** Devuelve los campos activos para un slot dado */
export function fieldsForSlot(slot: string): SurveyField[] {
  return SURVEY_FIELDS.filter((f) => !f.onlySlot || f.onlySlot === slot);
}

/** Primer campo activo para un slot */
export function firstField(slot: string): SurveyField {
  return fieldsForSlot(slot)[0];
}

/** Siguiente campo tras el actual, para un slot dado */
export function nextField(currentId: string, slot: string): SurveyField | null {
  const fields = fieldsForSlot(slot);
  const idx = fields.findIndex((f) => f.id === currentId);
  if (idx < 0 || idx === fields.length - 1) return null;
  return fields[idx + 1];
}

/** Busca un campo por id */
export function fieldById(id: string): SurveyField {
  return SURVEY_FIELDS.find((f) => f.id === id) ?? SURVEY_FIELDS[0];
}

/* ------------------------------------------------------------------ */
/* Validación de respuestas                                              */
/* ------------------------------------------------------------------ */

/** Valida y normaliza una respuesta según el tipo del campo */
export function normalizeAnswer(
  raw: string,
  field: SurveyField,
): { value: string | null; valid: boolean; hint?: string } {
  const text = raw.trim();

  if (field.type === "number") {
    // Acepta enteros y decimales con punto o coma
    const n = parseFloat(text.replace(",", "."));
    if (isNaN(n) || n < 0) {
      return {
        value: null,
        valid: false,
        hint: "Por favor escribe un número válido (por ejemplo: 0, 1, 2.5).",
      };
    }
    return { value: String(n), valid: true };
  }

  if (field.type === "yesno") {
    const lower = text.toLowerCase();
    if (["si", "sí", "yes", "1", "s"].includes(lower)) return { value: "SI", valid: true };
    if (["no", "nop", "0", "n"].includes(lower)) return { value: "NO", valid: true };
    // También acepta el id del botón directo
    if (text === "SI") return { value: "SI", valid: true };
    if (text === "NO") return { value: "NO", valid: true };
    return {
      value: null,
      valid: false,
      hint: "Por favor responde *Sí* o *No*.",
    };
  }

  if (field.type === "mood") {
    const lower = text.toLowerCase();
    if (["bien", "b", "1", "BIEN"].includes(lower) || text === "BIEN")
      return { value: "BIEN", valid: true };
    if (["regular", "r", "2", "REGULAR"].includes(lower) || text === "REGULAR")
      return { value: "REGULAR", valid: true };
    if (["mal", "m", "3", "MAL"].includes(lower) || text === "MAL")
      return { value: "MAL", valid: true };
    return {
      value: null,
      valid: false,
      hint: "Por favor elige: *Bien*, *Regular* o *Mal*.",
    };
  }

  // text — siempre válido
  return { value: text || null, valid: true };
}

/* ------------------------------------------------------------------ */
/* Alertas                                                               */
/* ------------------------------------------------------------------ */
export function isAlertAnswer(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toUpperCase();
  // Sí en yesno
  if (v === "SI") return true;
  // Número > 0
  const n = parseFloat(v);
  if (!isNaN(n) && n > 0) return true;
  return false;
}

export function surveyHasAlert(survey: {
  vomitos?: string | null;
  diarrea?: string | null;
  fiebre?: string | null;
  numeroCrisis?: string | null;
  transgresionDieta?: string | null;
  cambioFae?: string | null;
}): boolean {
  return (
    isAlertAnswer(survey.vomitos) ||
    isAlertAnswer(survey.diarrea) ||
    isAlertAnswer(survey.fiebre) ||
    isAlertAnswer(survey.numeroCrisis) ||
    isAlertAnswer(survey.transgresionDieta) ||
    isAlertAnswer(survey.cambioFae)
  );
}

/* ------------------------------------------------------------------ */
/* Labels de UI                                                          */
/* ------------------------------------------------------------------ */
export const SLOT_LABEL: Record<string, string> = {
  MANANA:   "Mañana 8:00",
  MEDIODIA: "Mediodía 12:00",
  TARDE:    "Tarde 16:00",
};

export const MOOD_LABEL: Record<string, string> = {
  BIEN:    "😊 Bien",
  REGULAR: "😐 Regular",
  MAL:     "😔 Mal",
};

export const FIELD_LABEL: Record<string, string> = {
  vomitos:          "Vómitos",
  diarrea:          "Diarrea",
  fiebre:           "Fiebre",
  numeroCrisis:     "Crisis epilépticas",
  transgresionDieta:"Transgresión dieta",
  cambioFae:        "Cambio FAE",
  glucosa:          "Glucosa (mg/dl)",
  cetonas:          "Cetonas",
  estadoAnimo:      "Estado de ánimo",
  peso:             "Peso (kg)",
  observaciones:    "Observaciones",
};
